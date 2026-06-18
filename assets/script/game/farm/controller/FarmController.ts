import { _decorator, Component, game } from "cc";
import { oops } from "db://oops-framework/core/Oops";
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";
import { TablePlant } from "../../common/table/TablePlant";
import { TableOrder } from "../../common/table/TableOrder";
import { LandStatus } from "../model/XianLand";
import { smc } from "../../common/SingletonModuleComp";
import { GameEvent } from "../../common/config/GameEvent";

const { ccclass } = _decorator;

const ORDER_STORAGE_KEY = "xian_current_orders";
const ORDER_COUNT = 3;

export interface IActiveOrder {
    orderId: number;
    zongmenName: string;
    requirePlantId: number;
    requireCount: number;
    rewardStone: number;
}

/**
 * 种田与订单控制器（挂载为全局组件或手动单例调用）
 */
@ccclass('FarmController')
export class FarmController extends Component {
    /** 当前活跃订单列表 */
    activeOrders: IActiveOrder[] = [];

    private static _inst: FarmController | null = null;
    static get inst(): FarmController | null { return FarmController._inst; }

    onLoad() {
        FarmController._inst = this;
        this.loadOrders();
    }

    onDestroy() {
        if (FarmController._inst === this) FarmController._inst = null;
    }

    // ===================== 时间轴心跳 =====================

    update(_dt: number) {
        const farm = smc.farm;
        if (!farm) return;

        const land = farm.XianLand;
        if (!land) return;

        const now = Math.floor(Date.now() / 1000);
        for (const slot of land.slots) {
            if (slot.status !== LandStatus.PLANTED) continue;

            const plantTable = JsonUtil.get(TablePlant.TableName);
            if (!plantTable) continue;

            const cfg = plantTable[slot.plantId];
            if (!cfg) continue;

            if (now - slot.startTime >= cfg.growTime) {
                slot.status = LandStatus.MATURE;
                land.save();
                oops.message.dispatchEvent(GameEvent.LandRefresh, slot.landId);
            }
        }
    }

    // ===================== 玩家交互接口 =====================

    /**
     * 播种
     * @returns 是否成功
     */
    plantSeed(landId: number, plantId: number): boolean {
        const farm = smc.farm;
        if (!farm) return false;

        const user = farm.XianUser;
        const land = farm.XianLand;
        if (!user || !land) return false;

        const slot = land.getSlot(landId);
        if (!slot || slot.status !== LandStatus.EMPTY) return false;

        const plantTable = JsonUtil.get(TablePlant.TableName);
        if (!plantTable) return false;

        const cfg = plantTable[plantId];
        if (!cfg) return false;

        if (user.spiritStone < cfg.seedCost) return false;

        user.spiritStone -= cfg.seedCost;
        slot.status = LandStatus.PLANTED;
        slot.plantId = plantId;
        slot.startTime = Math.floor(Date.now() / 1000);

        user.save();
        land.save();
        oops.message.dispatchEvent(GameEvent.UserDataChanged);
        oops.message.dispatchEvent(GameEvent.LandRefresh, landId);
        return true;
    }

    /**
     * 收获
     */
    harvestPlant(landId: number): void {
        const farm = smc.farm;
        if (!farm) return;

        const user = farm.XianUser;
        const land = farm.XianLand;
        if (!user || !land) return;

        const slot = land.getSlot(landId);
        if (!slot || slot.status !== LandStatus.MATURE) return;

        const plantTable = JsonUtil.get(TablePlant.TableName);
        if (!plantTable) return;

        const cfg = plantTable[slot.plantId];
        if (!cfg) return;

        const pid = slot.plantId;
        user.bag[pid] = (user.bag[pid] || 0) + 1;
        user.exp += cfg.expReward;

        slot.status = LandStatus.EMPTY;
        slot.plantId = 0;
        slot.startTime = 0;

        user.save();
        land.save();
        oops.message.dispatchEvent(GameEvent.UserDataChanged);
        oops.message.dispatchEvent(GameEvent.LandRefresh, landId);
    }

    /**
     * 交付宗门订单
     * @returns 是否成功
     */
    submitOrder(orderId: number): boolean {
        const farm = smc.farm;
        if (!farm) return false;

        const user = farm.XianUser;
        if (!user) return false;

        const idx = this.activeOrders.findIndex(o => o.orderId === orderId);
        if (idx < 0) return false;

        const order = this.activeOrders[idx];
        const have = user.bag[order.requirePlantId] || 0;
        if (have < order.requireCount) return false;

        user.bag[order.requirePlantId] = have - order.requireCount;
        user.spiritStone += order.rewardStone;
        user.save();

        this.activeOrders[idx] = this.randomOrder();
        this.saveOrders();

        oops.message.dispatchEvent(GameEvent.UserDataChanged);
        oops.message.dispatchEvent(GameEvent.OrderRefresh);
        return true;
    }

    /**
     * 提速（为微信看广告预留）
     */
    speedUpLand(landId: number): void {
        const farm = smc.farm;
        if (!farm) return;

        const land = farm.XianLand;
        if (!land) return;

        const slot = land.getSlot(landId);
        if (!slot || slot.status !== LandStatus.PLANTED) return;

        const plantTable = JsonUtil.get(TablePlant.TableName);
        if (!plantTable) return;

        const cfg = plantTable[slot.plantId];
        if (!cfg) return;

        slot.startTime -= cfg.growTime;
        land.save();
    }

    // ===================== 订单管理 =====================

    private loadOrders(): void {
        const raw = oops.storage.get(ORDER_STORAGE_KEY);
        if (raw) {
            try {
                const arr: IActiveOrder[] = JSON.parse(raw);
                if (Array.isArray(arr) && arr.length === ORDER_COUNT) {
                    this.activeOrders = arr;
                    return;
                }
            } catch (_) {
                // ignore
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
        oops.storage.set(ORDER_STORAGE_KEY, JSON.stringify(this.activeOrders));
    }

    private randomOrder(): IActiveOrder {
        const table = JsonUtil.get(TableOrder.TableName);
        if (!table) {
            return { orderId: 1, zongmenName: "未知", requirePlantId: 101, requireCount: 1, rewardStone: 100 };
        }
        const keys = Object.keys(table);
        const key = keys[Math.floor(Math.random() * keys.length)];
        const cfg = table[key];
        return {
            orderId: cfg.id,
            zongmenName: cfg.zongmenName,
            requirePlantId: cfg.requirePlantId,
            requireCount: cfg.requireCount,
            rewardStone: cfg.rewardStone,
        };
    }
}
