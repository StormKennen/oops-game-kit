import { _decorator, profiler } from 'cc';
import { DEBUG } from 'cc/env';
import { oops } from '../../extensions/oops-plugin-framework/assets/core/Oops';
import { Root } from '../../extensions/oops-plugin-framework/assets/core/Root';
import { ecs } from '../../extensions/oops-plugin-framework/assets/libs/ecs/ECS';
import { Account } from './game/account/Account';
import { smc } from './game/common/SingletonModuleComp';
import { UIConfigData } from './game/common/config/GameUIConfig';
import { Farm } from './game/farm/Farm';
import { FarmController } from './game/farm/controller/FarmController';
import { Initialize } from './game/initialize/Initialize';

const { ccclass } = _decorator;

@ccclass('Main')
export class Main extends Root {
    start() {
        if (DEBUG) profiler.showStats();
    }

    protected run() {
        smc.initialize = ecs.getEntity<Initialize>(Initialize);
        smc.account = ecs.getEntity<Account>(Account);
        smc.farm = ecs.getEntity<Farm>(Farm);
        FarmController.inst.initialize();
    }

    protected initGui() {
        oops.gui.init(UIConfigData);
    }

    protected onDestroy() {
        FarmController.inst.shutdown();
    }

    update(dt: number) {
        FarmController.inst.update(dt);
    }
}
