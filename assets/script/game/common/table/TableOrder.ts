import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export interface OrderRecord {
    id: number;
    zongmenName: string;
    requirePlantId: number;
    requireCount: number;
    rewardStone: number;
}

export class TableOrder {
    static TableName: string = "Order";

    private data: OrderRecord = {
        id: 0,
        zongmenName: "",
        requirePlantId: 0,
        requireCount: 0,
        rewardStone: 0,
    };

    static get(id: number): OrderRecord | null {
        const table = JsonUtil.get(TableOrder.TableName) as Partial<Record<number, OrderRecord>> | null;
        if (!table) return null;
        return table[id] ?? null;
    }

    static all(): OrderRecord[] {
        const table = JsonUtil.get(TableOrder.TableName) as Partial<Record<number, OrderRecord>> | null;
        if (!table) return [];
        return Object.values(table).filter((row): row is OrderRecord => row !== undefined);
    }

    init(id: number) {
        const row = TableOrder.get(id);
        if (!row) return;
        this.data = row;
        this.id = id;
    }

    id: number = 0;

    get zongmenName(): string {
        return this.data.zongmenName;
    }
    get requirePlantId(): number {
        return this.data.requirePlantId;
    }
    get requireCount(): number {
        return this.data.requireCount;
    }
    get rewardStone(): number {
        return this.data.rewardStone;
    }
}
