import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { CCEntity } from "db://oops-framework/module/common/CCEntity";
import { XianUserComp } from "./model/XianUser";
import { XianLandComp } from "./model/XianLand";

/** 农场实体 – 聚合修士属性与灵田状态 */
@ecs.register('Farm')
export class Farm extends CCEntity {
    XianUser!: XianUserComp;
    XianLand!: XianLandComp;

    protected init() {
        this.addComponents<ecs.Comp>(XianUserComp, XianLandComp);
        this.XianUser.load();
        this.XianLand.load();
    }
}
