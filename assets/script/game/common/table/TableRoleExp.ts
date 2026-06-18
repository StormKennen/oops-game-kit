import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export interface RoleExpRecord {
    level: number;
    title: string;
    needExp: number;
    maxLandCount: number;
}

export class TableRoleExp {
    static TableName: string = "RoleExp";

    private data: RoleExpRecord = {
        level: 1,
        title: "",
        needExp: 0,
        maxLandCount: 3,
    };

    static get(level: number): RoleExpRecord | null {
        const table = JsonUtil.get(TableRoleExp.TableName) as Partial<Record<number, RoleExpRecord>> | null;
        if (!table) return null;
        return table[level] ?? null;
    }

    static all(): RoleExpRecord[] {
        const table = JsonUtil.get(TableRoleExp.TableName) as Partial<Record<number, RoleExpRecord>> | null;
        if (!table) return [];
        return Object.values(table).filter((row): row is RoleExpRecord => row !== undefined);
    }

    init(level: number) {
        const row = TableRoleExp.get(level);
        if (!row) return;
        this.data = row;
        this.level = level;
    }

    level: number = 1;

    get title(): string {
        return this.data.title;
    }
    get needExp(): number {
        return this.data.needExp;
    }
    get maxLandCount(): number {
        return this.data.maxLandCount;
    }
}
