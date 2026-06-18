/** 游戏全局事件 */
export enum GameEvent {
    /** 游戏服务器连接成功 */
    GameServerConnected = "GameServerConnected",
    /** 登录成功 */
    LoginSuccess = "LoginSuccess",
    /** 修士数据变更（灵石/阅历/背包） */
    UserDataChanged = "UserDataChanged",
    /** 指定土地状态刷新 */
    LandRefresh = "LandRefresh",
    /** 宗门订单列表刷新 */
    OrderRefresh = "OrderRefresh",
}
