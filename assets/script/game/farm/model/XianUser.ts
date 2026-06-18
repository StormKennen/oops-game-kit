import { oops } from "db://oops-framework/core/Oops";
import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { GameStorageConfig } from "../../common/config/GameStorageConfig";

export interface XianBag {
    [plantId: number]: number;
}

export interface IXianUserData {
    spiritStone: number;
    exp: number;
    level: number;
    bag: XianBag;
    lastOfflineTime: number;
}

function isNumberRecord(value: unknown): value is XianBag {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    return Object.values(value).every(v => typeof v === "number");
}

function isUserData(value: unknown): value is Partial<IXianUserData> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const data = value as Partial<IXianUserData>;
    const hasRequired = typeof data.spiritStone === "number"
        && typeof data.exp === "number"
        && isNumberRecord(data.bag);
    if (!hasRequired) return false;
    if (data.level !== undefined && typeof data.level !== "number") return false;
    if (data.lastOfflineTime !== undefined && typeof data.lastOfflineTime !== "number") return false;
    return true;
}

@ecs.register('XianUser')
export class XianUserComp extends ecs.Comp {
    spiritStone: number = 1000;
    exp: number = 0;
    level: number = 1;
    bag: XianBag = {};
    lastOfflineTime: number = 0;

    reset() {
        this.spiritStone = 1000;
        this.exp = 0;
        this.level = 1;
        this.bag = {};
        this.lastOfflineTime = 0;
    }

    load(): void {
        const raw = oops.storage.get(GameStorageConfig.XianUser);
        if (!raw) return;

        try {
            const parsed: unknown = JSON.parse(raw);
            if (!isUserData(parsed)) return;
            this.spiritStone = parsed.spiritStone ?? 1000;
            this.exp = parsed.exp ?? 0;
            this.level = parsed.level ?? 1;
            this.bag = parsed.bag ?? {};
            this.lastOfflineTime = parsed.lastOfflineTime ?? 0;
        } catch (_) {
            this.reset();
        }
    }

    save(): void {
        const data: IXianUserData = {
            spiritStone: this.spiritStone,
            exp: this.exp,
            level: this.level,
            bag: this.bag,
            lastOfflineTime: this.lastOfflineTime,
        };
        oops.storage.set(GameStorageConfig.XianUser, JSON.stringify(data));
    }
}
