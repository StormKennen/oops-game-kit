import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { oops } from "db://oops-framework/core/Oops";

const STORAGE_KEY_USER = "xian_user";

export interface IXianUserData {
    spiritStone: number;
    exp: number;
    bag: { [plantId: number]: number };
}

/** 修士属性数据组件 */
@ecs.register('XianUser')
export class XianUserComp extends ecs.Comp {
    /** 灵石 */
    spiritStone: number = 1000;
    /** 修仙阅历 */
    exp: number = 0;
    /** 灵物背包 { plantId: count } */
    bag: { [plantId: number]: number } = {};

    reset() {
        this.spiritStone = 1000;
        this.exp = 0;
        this.bag = {};
    }

    /** 从本地存储恢复 */
    load(): void {
        const raw = oops.storage.get(STORAGE_KEY_USER);
        if (raw) {
            try {
                const d: IXianUserData = JSON.parse(raw);
                this.spiritStone = d.spiritStone ?? 1000;
                this.exp = d.exp ?? 0;
                this.bag = d.bag ?? {};
            } catch (_) {
                // 数据损坏则使用默认值
            }
        }
    }

    /** 持久化到本地存储 */
    save(): void {
        const d: IXianUserData = {
            spiritStone: this.spiritStone,
            exp: this.exp,
            bag: this.bag,
        };
        oops.storage.set(STORAGE_KEY_USER, JSON.stringify(d));
    }
}
