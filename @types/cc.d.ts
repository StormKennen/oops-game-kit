/**
 * Cocos Creator engine type stubs (for CI type-checking only).
 * These are minimal declarations so that `tsc --noEmit` passes
 * without the actual Cocos Creator editor/engine.
 */

declare module "cc" {
    export function _decorator(): void;
    export namespace _decorator {
        function ccclass(name?: string): ClassDecorator;
        function property(target: any): PropertyDecorator;
        function property(options: any): PropertyDecorator;
    }
    export class Component {
        node: Node;
        onLoad?(): void;
        start?(): void;
        update?(dt: number): void;
        protected onDestroy?(): void;
        schedule(callback: (...args: any[]) => void, interval: number, repeat?: number, delay?: number): void;
        unschedule(callback: (...args: any[]) => void): void;
    }
    export class Node {
        getChildByName(name: string): Node | null;
        destroy(): void;
        getComponent<T extends Component>(type: new () => T): T | null;
    }
    export class Label extends Component {
        string: string;
    }
    export class Button extends Component {
        interactable: boolean;
    }
    export class profiler {
        static showStats(): void;
    }
    export const game: any;
}

declare module "cc/env" {
    export const DEBUG: boolean;
}
