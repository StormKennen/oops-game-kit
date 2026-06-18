import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { oops } from "db://oops-framework/core/Oops";

const STORAGE_KEY_LAND = "xian_land";
const LAND_COUNT = 6;

/** 单块土地状态枚举 */
export enum LandStatus {
    EMPTY = 0,
    PLANTED = 1,
    MATURE = 2,
}

/** 单块土地数据 */
export interface ILandSlot {
    landId: number;
    status: LandStatus;
    plantId: number;
    startTime: number;
}

/** 灵田状态数据组件 */
@ecs.register('XianLand')
export class XianLandComp extends ecs.Comp {
    slots: ILandSlot[] = [];

    reset() {
        this.slots = [];
        this.initSlots();
    }

    /** 初始化 6 块土地 */
    initSlots(): void {
        this.slots = [];
        for (let i = 1; i <= LAND_COUNT; i++) {
            this.slots.push({
                landId: i,
                status: LandStatus.EMPTY,
                plantId: 0,
                startTime: 0,
            });
        }
    }

    getSlot(landId: number): ILandSlot | undefined {
        return this.slots.find(s => s.landId === landId);
    }

    /** 从本地存储恢复 */
    load(): void {
        const raw = oops.storage.get(STORAGE_KEY_LAND);
        if (raw) {
            try {
                const arr: ILandSlot[] = JSON.parse(raw);
                if (Array.isArray(arr) && arr.length === LAND_COUNT) {
                    this.slots = arr;
                    return;
                }
            } catch (_) {
                // ignore
            }
        }
        this.initSlots();
    }

    /** 持久化到本地存储 */
    save(): void {
        oops.storage.set(STORAGE_KEY_LAND, JSON.stringify(this.slots));
    }
}
