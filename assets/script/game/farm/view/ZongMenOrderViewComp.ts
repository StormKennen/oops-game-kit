import { _decorator } from "cc";
import { gui } from "db://oops-framework/core/gui/Gui";
import { LayerType } from "db://oops-framework/core/gui/layer/LayerEnum";
import { oops } from "db://oops-framework/core/Oops";
import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { CCView } from "db://oops-framework/module/common/CCView";
import { Farm } from "../Farm";
import { GameEvent } from "../../common/config/GameEvent";
import { FarmController, IActiveOrder } from "../controller/FarmController";

const { ccclass } = _decorator;

/** 宗门悬赏榜弹窗 */
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

    private onOrderRefresh() {
        this.refreshOrders();
    }

    private onUserDataChanged() {
        this.refreshOrders();
    }

    /** 渲染当前订单列表 */
    private refreshOrders(): void {
        const ctrl = FarmController.inst;
        if (!ctrl) return;
        const user = this.entity?.XianUser;
        if (!user) return;

        for (let i = 0; i < ctrl.activeOrders.length; i++) {
            const order: IActiveOrder = ctrl.activeOrders[i];
            const have = user.bag[order.requirePlantId] || 0;
            const canSubmit = have >= order.requireCount;
            // UI 节点绑定将在 Prefab 中完成
            // e.g. orderNode.getChildByName("btnSubmit").getComponent(Button).interactable = canSubmit;
            void canSubmit;
        }
    }

    /** 交付按钮点击 */
    onSubmitClick(orderId: number): void {
        const ctrl = FarmController.inst;
        if (!ctrl) return;
        ctrl.submitOrder(orderId);
    }

    reset() {
        this.node.destroy();
    }
}
