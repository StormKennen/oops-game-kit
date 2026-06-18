import { oops } from "db://oops-framework/core/Oops";
import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { GameStorageConfig } from "../../common/config/GameStorageConfig";

export interface XianBag {
    [plantId: number]: number;
}

export interface IXianUserData {
    spiritStone: number;
    exp: number;
    bag: XianBag;
}

function isNumberRecord(value: unknown): value is XianBag {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    return Object.values(value).every(v => typeof v === "number");
}

function isUserData(value: unknown): value is IXianUserData {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const data = value as Partial<IXianUserData>;
    return typeof data.spiritStone === "number"
        && typeof data.exp === "number"
        && isNumberRecord(data.bag);
}

@ecs.register('XianUser')
export class XianUserComp extends ecs.Comp {
    spiritStone: number = 1000;
    exp: number = 0;
    bag: XianBag = {};

    reset() {
        this.spiritStone = 1000;
        this.exp = 0;
        this.bag = {};
    }

    load(): void {
        const raw = oops.storage.get(GameStorageConfig.XianUser);
        if (!raw) return;

        try {
            const parsed: unknown = JSON.parse(raw);
            if (!isUserData(parsed)) return;
            this.spiritStone = parsed.spiritStone;
            this.exp = parsed.exp;
            this.bag = parsed.bag;
        } catch (_) {
            this.reset();
        }
    }

    save(): void {
        const data: IXianUserData = {
            spiritStone: this.spiritStone,
            exp: this.exp,
            bag: this.bag,
        };
        oops.storage.set(GameStorageConfig.XianUser, JSON.stringify(data));
    }
}
