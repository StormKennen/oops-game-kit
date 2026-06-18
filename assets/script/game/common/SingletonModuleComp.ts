import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { Account } from "../account/Account";
import { Initialize } from "../initialize/Initialize";
import { Farm } from "../farm/Farm";

/** 游戏单例业务模块 */
@ecs.register('SingletonModule')
export class SingletonModuleComp extends ecs.Comp {
    /** 游戏初始化模块 */
    initialize: Initialize = null!;
    /** 游戏账号模块 */
    account: Account = null!;
    /** 农场模块 */
    farm: Farm = null!;

    reset() { }
}

export var smc: SingletonModuleComp = ecs.getSingleton(SingletonModuleComp);
