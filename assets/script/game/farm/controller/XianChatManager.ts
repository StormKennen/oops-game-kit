import { oops } from "db://oops-framework/core/Oops";
import { GameEvent } from "../../common/config/GameEvent";

const MIN_INTERVAL = 15;
const MAX_INTERVAL = 30;

export class XianChatManager {
    static readonly inst: XianChatManager = new XianChatManager();

    private readonly names: string[] = [
        "\u97e9\u8dd1\u8dd1",
        "\u5389\u98de\u96e8",
        "\u5f20\u5c0f\u51e1",
        "\u53f6\u51e1",
        "\u6797\u52a8",
        "\u8427\u708e",
    ];

    private readonly templates: string[] = [
        "\u73a9\u5bb6{0}\u6210\u529f\u7a81\u7834\u5230\u4e86\u7b51\u57fa\u671f\uff01",
        "\u73a9\u5bb6{0}\u521a\u521a\u6536\u83b7\u4e86\u6781\u54c1\u4e5d\u54c1\u83b2\u82b1\uff0c\u83b7\u5f97\u4e8610000\u7075\u77f3\uff01",
        "\u73a9\u5bb6{0}\u5728\u5b97\u95e8\u8ba2\u5355\u4e2d\u4e00\u591c\u66b4\u5bcc\uff01",
        "\u73a9\u5bb6{0}\u7684\u7075\u7530\u7075\u6c14\u6ea2\u51fa\uff0c\u6536\u6210\u7ffb\u500d\uff01",
        "\u73a9\u5bb6{0}\u770b\u5b8c\u5929\u9053\u663e\u7075\uff0c\u77ac\u95f4\u50ac\u719f\u6574\u7247\u7075\u7530\uff01",
    ];

    private elapsed: number = 0;
    private nextDelay: number = 0;
    private running: boolean = false;

    private constructor() { }

    initialize(): void {
        if (this.running) return;
        this.running = true;
        this.elapsed = 0;
        this.nextDelay = this.randomDelay();
    }

    shutdown(): void {
        this.running = false;
        this.elapsed = 0;
    }

    update(dt: number): void {
        if (!this.running) return;
        this.elapsed += dt;
        if (this.elapsed < this.nextDelay) return;

        this.elapsed = 0;
        this.nextDelay = this.randomDelay();
        oops.message.dispatchEvent(GameEvent.XianChatBroadcast, this.randomBroadcast());
    }

    randomBroadcast(): string {
        const template = this.pick(this.templates);
        return template.replace("{0}", this.pick(this.names));
    }

    private randomDelay(): number {
        return MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    }

    private pick(values: string[]): string {
        return values[Math.floor(Math.random() * values.length)] ?? "";
    }
}
