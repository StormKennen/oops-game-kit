import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export interface PlantRecord {
    id: number;
    name: string;
    growTime: number;
    seedCost: number;
    expReward: number;
    baseYield: number;
    requireLevel: number;
}

export class TablePlant {
    static TableName: string = "Plant";

    private data: PlantRecord = {
        id: 0,
        name: "",
        growTime: 0,
        seedCost: 0,
        expReward: 0,
        baseYield: 1,
        requireLevel: 1,
    };

    static get(id: number): PlantRecord | null {
        const table = JsonUtil.get(TablePlant.TableName) as Partial<Record<number, PlantRecord>> | null;
        if (!table) return null;
        return table[id] ?? null;
    }

    static all(): PlantRecord[] {
        const table = JsonUtil.get(TablePlant.TableName) as Partial<Record<number, PlantRecord>> | null;
        if (!table) return [];
        return Object.values(table).filter((row): row is PlantRecord => row !== undefined);
    }

    init(id: number) {
        const row = TablePlant.get(id);
        if (!row) return;
        this.data = row;
        this.id = id;
    }

    id: number = 0;

    get name(): string {
        return this.data.name;
    }
    get growTime(): number {
        return this.data.growTime;
    }
    get seedCost(): number {
        return this.data.seedCost;
    }
    get expReward(): number {
        return this.data.expReward;
    }
    get baseYield(): number {
        return this.data.baseYield;
    }
    get requireLevel(): number {
        return this.data.requireLevel;
    }
}
