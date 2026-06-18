import { LayerType } from "db://oops-framework/core/gui/layer/LayerEnum";
import { UIConfig } from "db://oops-framework/core/gui/layer/UIConfig";

/** 界面唯一标识 */
export enum UIID {
    /** 提示弹窗 */
    Alert,
    /** 确认弹窗 */
    Confirm,
    /** 主农场界面 */
    Farm,
    /** 宗门订单弹窗 */
    ZongMenOrder,
}

/** 打开界面的配置数据 */
export var UIConfigData: { [key: number]: UIConfig } = {
    [UIID.Alert]: { layer: LayerType.Dialog, prefab: "common/prefab/alert" },
    [UIID.Confirm]: { layer: LayerType.Dialog, prefab: "common/prefab/confirm" },
    [UIID.Farm]: { layer: LayerType.UI, prefab: "gui/farm/farm" },
    [UIID.ZongMenOrder]: { layer: LayerType.Dialog, prefab: "gui/farm/order" },
}
