import { _decorator } from "cc";
import { gui } from "db://oops-framework/core/gui/Gui";
import { LayerType } from "db://oops-framework/core/gui/layer/LayerEnum";
import { oops } from "db://oops-framework/core/Oops";
import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { CCView } from "db://oops-framework/module/common/CCView";
import { GameEvent } from "../../common/config/GameEvent";
import { FarmController, IActiveOrder } from "../controller/FarmController";
import { Farm } from "../Farm";

const { ccclass } = _decorator;

@ccclass('ZongMenOrderViewComp')
@ecs.register('ZongMenOrderView', false)
@gui.register('ZongMenOrderView', { layer: LayerType.Dialog, prefab: "gui/farm/order" })
export class ZongMenOrderViewComp extends CCView<Farm> {

    start() {
        this.refreshOrders();
        oops.message.on(GameEvent.OrderRefresh, this.onOrderRefresh, this);
        oops.message.on(GameEvent.UserDataChanged, this.onUserDataChanged, this);
    }

    protected onDestroy() {
        oops.message.off(GameEvent.OrderRefresh, this.onOrderRefresh, this);
        oops.message.off(GameEvent.UserDataChanged, this.onUserDataChanged, this);
    }

    private onOrderRefresh(_event: string, _args: unknown) {
        this.refreshOrders();
    }

    private onUserDataChanged(_event: string, _args: unknown) {
        this.refreshOrders();
    }

    private refreshOrders(): void {
        const user = this.entity?.XianUser;
        if (!user) return;

        const orders: IActiveOrder[] = FarmController.inst.getActiveOrders();
        for (const order of orders) {
            const have = user.bag[order.requirePlantId] || 0;
            const canSubmit = have >= order.requireCount;
            void canSubmit;
        }
    }

    onSubmitClick(orderId: number): void {
        FarmController.inst.submitOrder(orderId);
    }

    reset() {
        this.node.destroy();
    }
}
