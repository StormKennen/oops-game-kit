import { oops } from "db://oops-framework/core/Oops";
import { GameEvent } from "../../common/config/GameEvent";
import { GameStorageConfig } from "../../common/config/GameStorageConfig";
import { TableOrder } from "../../common/table/TableOrder";
import { TablePlant } from "../../common/table/TablePlant";
import { smc } from "../../common/SingletonModuleComp";
import { LandStatus } from "../model/XianLand";

const ORDER_COUNT = 3;

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

    private constructor() { }

    initialize(): void {
        if (this.initialized) return;
        this.initialized = true;
        this.loadOrders();
    }

    update(_dt: number): void {
        const farm = smc.farm;
        if (!farm) return;

        const now = Math.floor(Date.now() / 1000);
        let changed = false;

        for (const slot of farm.XianLand.slots) {
            if (slot.status !== LandStatus.PLANTED) continue;

            const cfg = TablePlant.get(slot.plantId);
            if (!cfg) continue;

            if (now - slot.startTime >= cfg.growTime) {
                slot.status = LandStatus.MATURE;
                changed = true;
                oops.message.dispatchEvent(GameEvent.LandRefresh, slot.landId);
            }
        }

        if (changed) farm.XianLand.save();
    }

    plantSeed(landId: number, plantId: number): boolean {
        const farm = smc.farm;
        if (!farm) return false;

        const slot = farm.XianLand.getSlot(landId);
        const cfg = TablePlant.get(plantId);
        if (!slot || !cfg) return false;
        if (slot.status !== LandStatus.EMPTY) return false;
        if (farm.XianUser.spiritStone < cfg.seedCost) return false;

        farm.XianUser.spiritStone -= cfg.seedCost;
        slot.status = LandStatus.PLANTED;
        slot.plantId = plantId;
        slot.startTime = Math.floor(Date.now() / 1000);

        farm.XianUser.save();
        farm.XianLand.save();
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
        farm.XianUser.bag[plantId] = (farm.XianUser.bag[plantId] || 0) + 1;
        farm.XianUser.exp += cfg.expReward;

        slot.status = LandStatus.EMPTY;
        slot.plantId = 0;
        slot.startTime = 0;

        farm.XianUser.save();
        farm.XianLand.save();
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
        farm.XianUser.save();

        this.activeOrders[index] = this.randomOrder();
        this.saveOrders();

        oops.message.dispatchEvent(GameEvent.UserDataChanged);
        oops.message.dispatchEvent(GameEvent.OrderRefresh);
        return true;
    }

    speedUpLand(landId: number): void {
        const farm = smc.farm;
        if (!farm) return;

        const slot = farm.XianLand.getSlot(landId);
        if (!slot || slot.status !== LandStatus.PLANTED) return;

        const cfg = TablePlant.get(slot.plantId);
        if (!cfg) return;

        slot.startTime = Math.floor(Date.now() / 1000) - cfg.growTime;
        slot.status = LandStatus.MATURE;
        farm.XianLand.save();
        oops.message.dispatchEvent(GameEvent.LandRefresh, landId);
    }

    getActiveOrders(): IActiveOrder[] {
        this.ensureOrders();
        return this.activeOrders;
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
