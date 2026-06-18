import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class TablePlant {
    static TableName: string = "Plant";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TablePlant.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号 */
    id: number = 0;

    /** 名称 */
    get name(): string {
        return this.data.name;
    }
    /** 成熟秒数 */
    get growTime(): number {
        return this.data.growTime;
    }
    /** 种子消耗灵石 */
    get seedCost(): number {
        return this.data.seedCost;
    }
    /** 收获阅历奖励 */
    get expReward(): number {
        return this.data.expReward;
    }
}
