interface RewardedVideoAdCloseResult {
    isEnded?: boolean;
}

interface RewardedVideoAd {
    show(): Promise<void>;
    load(): Promise<void>;
    onClose(callback: (result: RewardedVideoAdCloseResult) => void): void;
    onError(callback: () => void): void;
}

interface WechatMiniGameGlobal {
    createRewardedVideoAd(options: { adUnitId: string }): RewardedVideoAd;
}

declare const wx: WechatMiniGameGlobal | undefined;

const REWARD_VIDEO_AD_UNIT_ID = "xian_farm_reward_video";

export class XianSdkManager {
    static showRewardVideoAd(onSuccess: () => void, onFailure?: () => void): void {
        if (typeof wx !== "undefined" && wx) {
            const ad = wx.createRewardedVideoAd({ adUnitId: REWARD_VIDEO_AD_UNIT_ID });
            ad.onClose(result => {
                if (result.isEnded !== false) {
                    onSuccess();
                } else if (onFailure) {
                    onFailure();
                }
            });
            ad.onError(() => {
                if (onFailure) onFailure();
            });
            ad.show().catch(() => {
                ad.load()
                    .then(() => ad.show())
                    .catch(() => {
                        if (onFailure) onFailure();
                    });
            });
            return;
        }

        setTimeout(() => {
            onSuccess();
        }, 2000);
    }
}
