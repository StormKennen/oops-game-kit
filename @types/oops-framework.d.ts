/**
 * Oops Framework type stubs (for CI type-checking only).
 */

// ==================== ECS ====================
declare module "db://oops-framework/libs/ecs/ECS" {
    export namespace ecs {
        interface Comp {
            reset(): void;
        }
        abstract class Comp {
            reset(): void;
        }
        interface IMatcher {}
        interface IEntityEnterSystem {
            filter(): IMatcher;
            entityEnter(e: any): void;
        }
        abstract class ComblockSystem {
            filter(): IMatcher;
        }
        class System {
            constructor();
            add(system: any): void;
        }
        function register(name: string, canNew?: boolean): ClassDecorator;
        function allOf(...comps: any[]): IMatcher;
        function getEntity<T>(ctor: new () => T): T;
        function getSingleton<T extends Comp>(ctor: new () => T): T;
        type Comp = Comp;
    }
}

// ==================== Core ====================
declare module "db://oops-framework/core/Oops" {
    export const oops: {
        gui: {
            init(config: any): void;
            open(uiid: number, params?: any, callbacks?: any): void;
        };
        res: {
            loadDir(path: string, onProgress?: Function, onComplete?: Function): void;
            loadDir(path: string, onComplete?: Function): void;
        };
        storage: {
            get(key: string): string | null;
            set(key: string, value: string): void;
        };
        language: {
            setLanguage(lang: string, callback?: Function): void;
            getLangByID(id: string): string;
        };
        message: {
            on(event: string, handler: Function, target?: any): void;
            off(event: string, handler: Function, target?: any): void;
            once(event: string, handler: Function, target?: any): void;
            dispatchEvent(event: string, ...args: any[]): void;
        };
        ecs: {
            add(system: any): void;
        };
    };
}

// ==================== GUI ====================
declare module "db://oops-framework/core/gui/Gui" {
    export namespace gui {
        function register(name: string, config: { layer: any; prefab: string }): ClassDecorator;
    }
}

declare module "db://oops-framework/core/gui/layer/LayerEnum" {
    export enum LayerType {
        Game = 0,
        UI = 1,
        PopUp = 2,
        Dialog = 3,
        System = 4,
        Notify = 5,
        Guide = 6,
    }
}

declare module "db://oops-framework/core/gui/layer/UIConfig" {
    export interface UIConfig {
        layer: number;
        prefab: string;
    }
}

// ==================== Collections ====================
declare module "db://oops-framework/libs/collection/AsyncQueue" {
    export type NextFunction = () => void;
    export class AsyncQueue {
        push(task: (next: NextFunction, params: any, args: any) => void): void;
        play(): void;
        complete: (() => void) | (() => Promise<void>);
    }
}

// ==================== Utils ====================
declare module "db://oops-framework/core/utils/JsonUtil" {
    export class JsonUtil {
        static get(tableName: string): any;
    }
}

// ==================== Entity & View ====================
declare module "db://oops-framework/module/common/CCEntity" {
    import { Component } from "cc";
    import { ecs } from "db://oops-framework/libs/ecs/ECS";
    export abstract class CCEntity {
        add(comp: any): void;
        addComponents<T>(...comps: any[]): void;
        remove(comp: any): void;
        addUi(comp: any): Promise<void>;
        protected abstract init(): void;
    }
}

declare module "db://oops-framework/module/common/CCView" {
    import { Component } from "cc";
    export abstract class CCView<T = any> extends Component {
        entity: T | null;
        abstract reset(): void;
    }
}

declare module "db://oops-framework/module/common/CCViewVM" {
    import { Component } from "cc";
    export abstract class CCViewVM<T = any> extends Component {
        entity: T | null;
        data: any;
        remove(): void;
        abstract reset(): void;
    }
}

// ==================== Root ====================
declare module "db://oops-framework/core/Root" {
    import { Component } from "cc";
    export abstract class Root extends Component {
        protected abstract run(): void;
        protected abstract initGui(): void;
    }
}
