import { oops } from "db://oops-framework/core/Oops";
import { GameEvent } from "../../common/config/GameEvent";
import { GameStorageConfig } from "../../common/config/GameStorageConfig";
import { TableOrder } from "../../common/table/TableOrder";
import { TablePlant, PlantRecord } from "../../common/table/TablePlant";
import { TableRoleExp } from "../../common/table/TableRoleExp";
import { smc } from "../../common/SingletonModuleComp";
import { LandStatus, ILandSlot } from "../model/XianLand";
import { XianSdkManager } from "../sdk/XianSdkManager";

const ORDER_COUNT = 3;
const OFFLINE_BONUS_RATE = 0.1;
const TIMESTAMP_SAVE_INTERVAL = 60;
const ORDER_REFRESH_COST = 50;
const SUBSIDY_THRESHOLD = 50;
const SUBSIDY_REWARD_STONE = 500;

export interface IActiveOrder {
    orderId: number;
    zongmenName: string;
    requirePlantId: number;
    requireCount: number;
    rewardStone: number;
}

function isActiveOrder(value: unknown): value is IActiveOrder {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const order = value as Partial<IActiveOrder>;
    return typeof order.orderId === "number"
        && typeof order.zongmenName === "string"
        && typeof order.requirePlantId === "number"
        && typeof order.requireCount === "number"
        && typeof order.rewardStone === "number";
}

export class FarmController {
    static readonly inst: FarmController = new FarmController();

    activeOrders: IActiveOrder[] = [];

    private initialized: boolean = false;
    private saveTicker: number = 0;
    private subsidyPending: boolean = false;

    private constructor() { }

    initialize(): void {
        if (this.initialized) return;
        this.initialized = true;
        this.loadOrders();
        this.applyOfflineProgress();
        this.saveOfflineTimestamp(this.now());
    }

    update(dt: number): void {
        const farm = smc.farm;
        if (!farm) return;

        const now = this.now();
        let changed = false;

        for (const slot of farm.XianLand.slots) {
            if (slot.status !== LandStatus.PLANTED) continue;

            const cfg = TablePlant.get(slot.plantId);
            if (!cfg) continue;

            if (now - slot.startTime >= cfg.growTime) {
                this.makeMature(slot, 0);
                changed = true;
                oops.message.dispatchEvent(GameEvent.LandRefresh, slot.landId);
            }
        }

        if (changed) farm.XianLand.save();

        this.saveTicker += dt;
        if (this.saveTicker >= TIMESTAMP_SAVE_INTERVAL) {
            this.saveTicker = 0;
            this.saveOfflineTimestamp(now);
        }
    }

    shutdown(): void {
        this.saveOfflineTimestamp(this.now());
    }

    plantSeed(landId: number, plantId: number): boolean {
        const farm = smc.farm;
        if (!farm) return false;

        if (landId > this.getMaxLandCount()) {
            oops.message.dispatchEvent(GameEvent.FloatingTip, "Land locked by current realm");
            return false;
        }

        const slot = farm.XianLand.getSlot(landId);
        const cfg = TablePlant.get(plantId);
        if (!slot || !cfg) return false;
        if (slot.status !== LandStatus.EMPTY) return false;
        if (farm.XianUser.level < cfg.requireLevel) {
            oops.message.dispatchEvent(GameEvent.FloatingTip, "\u4fee\u58eb\u5883\u754c\u4e0d\u8db3\uff0c\u5f3a\u884c\u79cd\u690d\u6050\u906d\u53cd\u566c");
            return false;
        }
        if (farm.XianUser.spiritStone < cfg.seedCost) {
            this.checkAndGrantSubsidies();
            return false;
        }

        farm.XianUser.spiritStone -= cfg.seedCost;
        slot.status = LandStatus.PLANTED;
        slot.plantId = plantId;
        slot.startTime = this.now();
        slot.offlineBonusCount = 0;

        this.saveGameState();
        oops.message.dispatchEvent(GameEvent.UserDataChanged);
        oops.message.dispatchEvent(GameEvent.LandRefresh, landId);
        return true;
    }

    harvestPlant(landId: number): void {
        const farm = smc.farm;
        if (!farm) return;

        const slot = farm.XianLand.getSlot(landId);
        if (!slot || slot.status !== LandStatus.MATURE) return;

        const cfg = TablePlant.get(slot.plantId);
        if (!cfg) return;

        const plantId = slot.plantId;
        const baseYield = this.getBaseYield(cfg);
        const count = Math.min(baseYield + slot.offlineBonusCount, baseYield * 2);
        farm.XianUser.bag[plantId] = (farm.XianUser.bag[plantId] || 0) + count;
        farm.XianUser.exp += cfg.expReward;
        this.tryLevelUp();

        slot.status = LandStatus.EMPTY;
        slot.plantId = 0;
        slot.startTime = 0;
        slot.offlineBonusCount = 0;

        this.saveGameState();
        oops.message.dispatchEvent(GameEvent.UserDataChanged);
        oops.message.dispatchEvent(GameEvent.LandRefresh, landId);
    }

    submitOrder(orderId: number): boolean {
        const farm = smc.farm;
        if (!farm) return false;

        this.ensureOrders();
        const index = this.activeOrders.findIndex(order => order.orderId === orderId);
        if (index < 0) return false;

        const order = this.activeOrders[index];
        const have = farm.XianUser.bag[order.requirePlantId] || 0;
        if (have < order.requireCount) return false;

        farm.XianUser.bag[order.requirePlantId] = have - order.requireCount;
        farm.XianUser.spiritStone += order.rewardStone;

        this.activeOrders[index] = this.randomOrder();
        this.saveGameState();
        this.saveOrders();

        oops.message.dispatchEvent(GameEvent.UserDataChanged);
        oops.message.dispatchEvent(GameEvent.OrderRefresh);
        return true;
    }

    speedUpLand(landId: number): void {
        XianSdkManager.showRewardVideoAd(() => {
            if (this.forceMatureLand(landId)) {
                this.saveGameState();
                oops.message.dispatchEvent(GameEvent.LandRefresh, landId);
            }
        }, () => {
            oops.message.dispatchEvent(GameEvent.FloatingTip, "Reward video failed");
        });
    }

    speedUpAllLands(): void {
        const farm = smc.farm;
        if (!farm) return;

        const landIds = farm.XianLand.slots
            .filter(slot => slot.status === LandStatus.PLANTED)
            .map(slot => slot.landId);
        if (landIds.length === 0) return;

        XianSdkManager.showRewardVideoAd(() => {
            for (const landId of landIds) {
                this.forceMatureLand(landId);
                oops.message.dispatchEvent(GameEvent.LandRefresh, landId);
            }
            this.saveGameState();
        }, () => {
            oops.message.dispatchEvent(GameEvent.FloatingTip, "Reward video failed");
        });
    }

    refreshOrdersWithStone(orderId?: number): boolean {
        const farm = smc.farm;
        if (!farm) return false;
        if (farm.XianUser.spiritStone < ORDER_REFRESH_COST) {
            this.checkAndGrantSubsidies();
            return false;
        }

        this.ensureOrders();
        const index = orderId === undefined
            ? -1
            : this.activeOrders.findIndex(order => order.orderId === orderId);
        if (orderId !== undefined && index < 0) return false;

        farm.XianUser.spiritStone -= ORDER_REFRESH_COST;
        if (orderId === undefined) {
            this.activeOrders = this.activeOrders.map(() => this.randomOrder());
        } else {
            this.activeOrders[index] = this.randomOrder();
        }

        this.saveGameState();
        this.saveOrders();
        oops.message.dispatchEvent(GameEvent.UserDataChanged);
        oops.message.dispatchEvent(GameEvent.OrderRefresh);
        return true;
    }


    checkAndGrantSubsidies(): boolean {
        const farm = smc.farm;
        if (!farm || this.subsidyPending) return false;
        if (farm.XianUser.spiritStone >= SUBSIDY_THRESHOLD) return false;
        if (this.hasAnyBagItem()) return false;

        this.subsidyPending = true;
        oops.message.dispatchEvent(GameEvent.FloatingTip, "\u4ed9\u7f18\u5929\u964d");
        oops.message.dispatchEvent(GameEvent.SubsidyAvailable);
        XianSdkManager.showRewardVideoAd(() => {
            const currentFarm = smc.farm;
            this.subsidyPending = false;
            if (!currentFarm) return;
            currentFarm.XianUser.spiritStone += SUBSIDY_REWARD_STONE;
            this.saveGameState();
            oops.message.dispatchEvent(GameEvent.UserDataChanged);
            oops.message.dispatchEvent(GameEvent.FloatingTip, "\u4ed9\u7f18\u5929\u964d\uff0c\u83b7\u5f97500\u7075\u77f3");
        }, () => {
            this.subsidyPending = false;
            oops.message.dispatchEvent(GameEvent.FloatingTip, "Reward video failed");
        });
        return true;
    }

    getActiveOrders(): IActiveOrder[] {
        this.ensureOrders();
        return this.activeOrders;
    }

    getMaxLandCount(): number {
        const farm = smc.farm;
        const level = farm?.XianUser.level ?? 1;
        const cfg = TableRoleExp.get(level);
        return cfg?.maxLandCount ?? 3;
    }

    getRoleTitle(): string {
        const farm = smc.farm;
        const level = farm?.XianUser.level ?? 1;
        const cfg = TableRoleExp.get(level);
        return cfg?.title ?? "";
    }


    private hasAnyBagItem(): boolean {
        const farm = smc.farm;
        if (!farm) return false;
        return Object.values(farm.XianUser.bag).some(count => count > 0);
    }

    private applyOfflineProgress(): void {
        const farm = smc.farm;
        if (!farm) return;

        const now = this.now();
        const last = farm.XianUser.lastOfflineTime;
        if (last <= 0 || now <= last) return;

        let changed = false;
        for (const slot of farm.XianLand.slots) {
            if (slot.status !== LandStatus.PLANTED) continue;

            const cfg = TablePlant.get(slot.plantId);
            if (!cfg) continue;

            const matureAt = slot.startTime + cfg.growTime;
            if (matureAt <= now) {
                const bonus = this.rollOfflineBonus(now, matureAt, cfg);
                this.makeMature(slot, bonus);
                changed = true;
                oops.message.dispatchEvent(GameEvent.LandRefresh, slot.landId);
            }
        }

        if (changed) farm.XianLand.save();
    }

    private rollOfflineBonus(now: number, matureAt: number, cfg: PlantRecord): number {
        const minutes = Math.floor(Math.max(0, now - matureAt) / 60);
        const cap = this.getBaseYield(cfg);
        let bonus = 0;
        for (let i = 0; i < minutes && bonus < cap; i++) {
            if (Math.random() < OFFLINE_BONUS_RATE) bonus++;
        }
        return bonus;
    }

    private makeMature(slot: ILandSlot, bonus: number): void {
        slot.status = LandStatus.MATURE;
        slot.offlineBonusCount = Math.max(slot.offlineBonusCount, bonus);
    }

    private forceMatureLand(landId: number): boolean {
        const farm = smc.farm;
        if (!farm) return false;

        const slot = farm.XianLand.getSlot(landId);
        if (!slot || slot.status !== LandStatus.PLANTED) return false;

        const cfg = TablePlant.get(slot.plantId);
        if (!cfg) return false;

        slot.startTime = this.now() - cfg.growTime;
        this.makeMature(slot, slot.offlineBonusCount);
        return true;
    }

    private tryLevelUp(): void {
        const farm = smc.farm;
        if (!farm) return;

        let changed = false;
        let next = TableRoleExp.get(farm.XianUser.level + 1);
        while (next && farm.XianUser.exp >= next.needExp) {
            farm.XianUser.level = next.level;
            changed = true;
            next = TableRoleExp.get(farm.XianUser.level + 1);
        }

        if (changed) {
            oops.message.dispatchEvent(GameEvent.RoleLevelUp, farm.XianUser.level);
            oops.message.dispatchEvent(GameEvent.FloatingTip, "Realm breakthrough");
        }
    }

    private getBaseYield(cfg: PlantRecord): number {
        return Math.max(1, cfg.baseYield || 1);
    }

    private saveGameState(): void {
        const farm = smc.farm;
        if (!farm) return;
        this.saveOfflineTimestamp(this.now());
        farm.XianUser.save();
        farm.XianLand.save();
    }

    private saveOfflineTimestamp(now: number): void {
        const farm = smc.farm;
        if (!farm) return;
        farm.XianUser.lastOfflineTime = now;
        farm.XianUser.save();
    }

    private now(): number {
        return Math.floor(Date.now() / 1000);
    }

    private ensureOrders(): void {
        if (this.activeOrders.length === ORDER_COUNT) return;
        this.loadOrders();
    }

    private loadOrders(): void {
        const raw = oops.storage.get(GameStorageConfig.XianOrders);
        if (raw) {
            try {
                const parsed: unknown = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length === ORDER_COUNT && parsed.every(isActiveOrder)) {
                    this.activeOrders = parsed;
                    return;
                }
            } catch (_) {
                // Fall through to generated orders.
            }
        }
        this.initOrders();
    }

    private initOrders(): void {
        this.activeOrders = [];
        for (let i = 0; i < ORDER_COUNT; i++) {
            this.activeOrders.push(this.randomOrder());
        }
        this.saveOrders();
    }

    private saveOrders(): void {
        oops.storage.set(GameStorageConfig.XianOrders, JSON.stringify(this.activeOrders));
    }

    private randomOrder(): IActiveOrder {
        const orders = TableOrder.all();
        if (orders.length === 0) {
            return {
                orderId: 1,
                zongmenName: "Danding Sect",
                requirePlantId: 101,
                requireCount: 1,
                rewardStone: 100,
            };
        }

        const cfg = orders[Math.floor(Math.random() * orders.length)];
        return {
            orderId: cfg.id,
            zongmenName: cfg.zongmenName,
            requirePlantId: cfg.requirePlantId,
            requireCount: cfg.requireCount,
            rewardStone: cfg.rewardStone,
        };
    }
}
