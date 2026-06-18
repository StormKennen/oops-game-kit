import { _decorator, Label } from "cc";
import { gui } from "db://oops-framework/core/gui/Gui";
import { LayerType } from "db://oops-framework/core/gui/layer/LayerEnum";
import { oops } from "db://oops-framework/core/Oops";
import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { CCView } from "db://oops-framework/module/common/CCView";
import { GameEvent } from "../../common/config/GameEvent";
import { FarmController } from "../controller/FarmController";
import { Farm } from "../Farm";
import { LandStatus } from "../model/XianLand";

const { ccclass, property } = _decorator;

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

    private onUserDataChanged(_event: string, _args: unknown) {
        this.refreshUserInfo();
    }

    private onLandRefresh(_event: string, landId: unknown) {
        if (typeof landId !== "number") return;
        this.refreshLand(landId);
    }

    private refreshUserInfo(): void {
        const user = this.entity?.XianUser;
        if (!user) return;
        if (this.labelStone) this.labelStone.string = `\u7075\u77f3: ${user.spiritStone}`;
        if (this.labelExp) this.labelExp.string = `\u9605\u5386: ${user.exp}`;
    }

    private refreshAllLands(): void {
        const land = this.entity?.XianLand;
        if (!land) return;
        for (const slot of land.slots) {
            this.refreshLand(slot.landId);
        }
    }

    private refreshLand(landId: number): void {
        const land = this.entity?.XianLand;
        if (!land) return;
        const slot = land.getSlot(landId);
        if (!slot) return;
    }

    onLandClick(landId: number, selectedPlantId: number): void {
        const land = this.entity?.XianLand;
        if (!land) return;
        const slot = land.getSlot(landId);
        if (!slot) return;

        switch (slot.status) {
            case LandStatus.EMPTY:
                FarmController.inst.plantSeed(landId, selectedPlantId);
                break;
            case LandStatus.MATURE:
                FarmController.inst.harvestPlant(landId);
                break;
            default:
                break;
        }
    }

    reset() {
        this.node.destroy();
    }
}
