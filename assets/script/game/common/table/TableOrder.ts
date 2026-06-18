import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class TableOrder {
    static TableName: string = "Order";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TableOrder.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号 */
    id: number = 0;

    /** 宗门名 */
    get zongmenName(): string {
        return this.data.zongmenName;
    }
    /** 需求灵草ID */
    get requirePlantId(): number {
        return this.data.requirePlantId;
    }
    /** 需求数量 */
    get requireCount(): number {
        return this.data.requireCount;
    }
    /** 奖励灵石 */
    get rewardStone(): number {
        return this.data.rewardStone;
    }
}
