import { _decorator, Label } from "cc";
import { gui } from "db://oops-framework/core/gui/Gui";
import { LayerType } from "db://oops-framework/core/gui/layer/LayerEnum";
import { oops } from "db://oops-framework/core/Oops";
import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { CCView } from "db://oops-framework/module/common/CCView";
import { Farm } from "../Farm";
import { GameEvent } from "../../common/config/GameEvent";
import { LandStatus } from "../model/XianLand";
import { FarmController } from "../controller/FarmController";

const { ccclass, property } = _decorator;

/** 主农场界面逻辑 */
@ccclass('MainFarmViewComp')
@ecs.register('MainFarmView', false)
@gui.register('MainFarmView', { layer: LayerType.UI, prefab: "gui/farm/farm" })
export class MainFarmViewComp extends CCView<Farm> {

    @property(Label)
    labelStone: Label | null = null;

    @property(Label)
    labelExp: Label | null = null;

    start() {
        this.refreshUserInfo();
        this.refreshAllLands();
        oops.message.on(GameEvent.UserDataChanged, this.onUserDataChanged, this);
        oops.message.on(GameEvent.LandRefresh, this.onLandRefresh, this);
    }

    protected onDestroy() {
        oops.message.off(GameEvent.UserDataChanged, this.onUserDataChanged, this);
        oops.message.off(GameEvent.LandRefresh, this.onLandRefresh, this);
    }

    private onUserDataChanged(_event: string, _args: any) {
        this.refreshUserInfo();
    }

    private onLandRefresh(_event: string, landId: any) {
        this.refreshLand(landId as number);
    }

    /** 刷新灵石 / 阅历 */
    private refreshUserInfo(): void {
        const user = this.entity?.XianUser;
        if (!user) return;
        if (this.labelStone) this.labelStone.string = `灵石: ${user.spiritStone}`;
        if (this.labelExp) this.labelExp.string = `阅历: ${user.exp}`;
    }

    /** 刷新全部土地 */
    private refreshAllLands(): void {
        const land = this.entity?.XianLand;
        if (!land) return;
        for (const slot of land.slots) {
            this.refreshLand(slot.landId);
        }
    }

    /** 刷新指定土地 UI */
    private refreshLand(landId: number): void {
        const land = this.entity?.XianLand;
        if (!land) return;
        const slot = land.getSlot(landId);
        if (!slot) return;
        // UI 节点绑定将在 Prefab 中完成；这里仅演示逻辑骨架
        // e.g. const landNode = this.node.getChildByName(`land_${landId}`);
    }

    /**
     * 土地点击事件（由 Prefab 按钮绑定）
     * 根据状态决定播种或收获
     */
    onLandClick(landId: number, selectedPlantId: number): void {
        const land = this.entity?.XianLand;
        if (!land) return;
        const slot = land.getSlot(landId);
        if (!slot) return;

        const ctrl = FarmController.inst;
        if (!ctrl) return;

        switch (slot.status) {
            case LandStatus.EMPTY:
                ctrl.plantSeed(landId, selectedPlantId);
                break;
            case LandStatus.MATURE:
                ctrl.harvestPlant(landId);
                break;
            default:
                break;
        }
    }

    reset() {
        this.node.destroy();
    }
}
