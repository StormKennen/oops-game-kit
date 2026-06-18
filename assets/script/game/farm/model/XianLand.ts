import { oops } from "db://oops-framework/core/Oops";
import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { GameStorageConfig } from "../../common/config/GameStorageConfig";

const LAND_COUNT = 6;

export enum LandStatus {
    EMPTY = 0,
    PLANTED = 1,
    MATURE = 2,
}

export interface ILandSlot {
    landId: number;
    status: LandStatus;
    plantId: number;
    startTime: number;
    offlineBonusCount: number;
}

function isLandStatus(value: unknown): value is LandStatus {
    return value === LandStatus.EMPTY || value === LandStatus.PLANTED || value === LandStatus.MATURE;
}

function isLandSlot(value: unknown): value is Partial<ILandSlot> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const slot = value as Partial<ILandSlot>;
    const hasRequired = typeof slot.landId === "number"
        && isLandStatus(slot.status)
        && typeof slot.plantId === "number"
        && typeof slot.startTime === "number";
    if (!hasRequired) return false;
    if (slot.offlineBonusCount !== undefined && typeof slot.offlineBonusCount !== "number") return false;
    return true;
}

function normalizeSlot(slot: Partial<ILandSlot>): ILandSlot {
    return {
        landId: slot.landId ?? 0,
        status: slot.status ?? LandStatus.EMPTY,
        plantId: slot.plantId ?? 0,
        startTime: slot.startTime ?? 0,
        offlineBonusCount: slot.offlineBonusCount ?? 0,
    };
}

@ecs.register('XianLand')
export class XianLandComp extends ecs.Comp {
    slots: ILandSlot[] = [];

    reset() {
        this.initSlots();
    }

    initSlots(): void {
        this.slots = [];
        for (let i = 1; i <= LAND_COUNT; i++) {
            this.slots.push({
                landId: i,
                status: LandStatus.EMPTY,
                plantId: 0,
                startTime: 0,
                offlineBonusCount: 0,
            });
        }
    }

    getSlot(landId: number): ILandSlot | undefined {
        return this.slots.find(s => s.landId === landId);
    }

    load(): void {
        const raw = oops.storage.get(GameStorageConfig.XianLand);
        if (!raw) {
            this.initSlots();
            return;
        }

        try {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length === LAND_COUNT && parsed.every(isLandSlot)) {
                this.slots = parsed.map(normalizeSlot);
                return;
            }
        } catch (_) {
            // Fall through to default state.
        }
        this.initSlots();
    }

    save(): void {
        oops.storage.set(GameStorageConfig.XianLand, JSON.stringify(this.slots));
    }
}
