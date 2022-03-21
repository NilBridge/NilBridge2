"use strict" //oicq需要开启严格模式
const { createClient, segment, Message } = require('oicq');
const logger = new NIL.Logger("QQManager");
NIL.EventManager.addEvent('QQManager', 'onRotboOnline');
NIL.EventManager.addEvent('QQManager', 'onGroupMessageReceived');
NIL.EventManager.addEvent('QQManager', 'onFriendMessageReceived');
NIL.EventManager.addEvent('QQManager', 'onMainMessageReceived');
NIL.EventManager.addEvent('QQManager', 'onChatMessageReceived');
if (NIL.IO.exists('./Data/QQ.json') == false) {
    NIL.IO.WriteTo('./Data/QQ.json', JSON.stringify({ qq: 114514, pwd: '1234567', platform: 2, qrcode: true ,group:{main:114514,chat:114514},admin:[114514]}, null, '\t'));
}

const cfg = JSON.parse(NIL.IO.readFrom('./Data/QQ.json'));

const client = createClient(cfg.qq, {//机器人内部配置
    platform: 2,//QQ登录协议。1:安卓手机 2:安卓平板 3:安卓手表 4:MacOS 5:iPad
    kickoff: false,
    ignore_self: true,
    resend: true,
    brief: true
});
/**
 * 
 * @param {GroupMessageEvent} e 
 * @returns 
 */
function getEventObj(e){
    return {
        atme:e.atme,
        atall:e.atall,
        id:e.message_id,
        message: e.message,
        sender:{
            isNBAdmin : cfg.admin.indexOf(e.user_id)!=-1,
            isQQAdmin: e.sender.role != 'member',
            send(msg){
                NIL.bot.sendFriendMessage(e.user_id,msg);
            }
        },
        group:{
            id:e.group_id,
            name:e.group_name
        },
        recall(){
            e.recall();
        },
        reply(msg,at=false){
            e.reply(msg,at);
        }
    }
}


client.on("system.login.qrcode", function (e) {
    //扫码后按回车登录
    process.stdin.once("data", (e) => {
        this.login();
    })
}).login();

client.on("system.online", () => {
    logger.info('登陆成功！');
    NIL.EventManager.on('onRotboOnline',{});
});//登录成功提示

client.on('message.group', (e) => {
    let obj =  getEventObj(e);
    NIL.EventManager.on('onGroupMessageReceived',obj);
    switch(e.group_id){
        case cfg.group.main:
            NIL.EventManager.on('onMainMessageReceived',obj);
            break;
        case cfg.group.chat:
            NIL.EventManager.on('onChatMessageReceived',obj);
            break;
    }
});

NIL.bot = {};

/**
 * 发送群聊消息
 * @param group 群号
 * @param msg   要发送的消息
 */
NIL.bot.sendGroupMessage = function (group, msg) {
    if (client.status != 11) { throw new Error('插件在QQ未登录时调用了API');}//直接返回防止oicq崩溃
    if (msg == "#") return;
    if (group == undefined || msg == undefined) { logger.warn('数据为空！！！'); return; }
    client.sendGroupMsg(group, msg);
}

/**
 * 获取群员对象
 * @param g 群号
 * @param q 成员QQ号
 * @returns 成员对象
 */
NIL.bot.GetGroupMember = function (g, q) {
    if (client.status != 11) { logger.warn('插件在QQ未登录时调用了API'); return; }
    return client.pickMember(g, q);
}
/**
 * 发送私聊消息
 * @param friend 好友QQ号
 * @param msg   要发送的消息
 */
NIL.bot.sendFriendMessage = function (friend, msg) {
    if (client.status != 11) { logger.warn('插件在QQ未登录时调用了API'); return; }
    if (friend == undefined || msg == undefined) { logger.warn('数据为空！！！'); return; }
    client.sendPrivateMsg(friend, msg);
}

/**
 * 发消息到主群(GROUP_MAIN)
 * @param msg   要发送的消息
 */
NIL.bot.sendMainMessage = function (msg) {
    NIL.bot.sendGroupMessage(cfg.group.main, msg);
}

/**
 * 发消息到聊天群(GROUP_CHAT)
 * @param msg   要发送的消息
 */
NIL.bot.sendChatMessage = function (msg) {
    NIL.bot.sendGroupMessage(cfg.group.chat, msg);
}

/**
 * 获取群列表
 */
NIL.bot.getGroupList = function () {
    if (client.status != 11) { logger.warn('插件在QQ未登录时调用了API'); return; }
    return client.getGroupList();
}

/**
 * 获取好友列表
 */
NIL.bot.getFriendList = function () {
    if (client.status != 11) { logger.warn('插件在QQ未登录时调用了API'); return; }
    return client.getFriendList();
}

/**
 * 下线机器人
 */
NIL.bot.logout = function () {
    client.logout(false);
}

/**
 * 直接监听事件
 * @param eventkey 事件名称
 * @param callback 回调函数
 */
 NIL.bot.listen = function(eventkey, callback){
    client.on(eventkey, (e) => {
      try {
        callback(null,e);
      } catch (err) {
        callback(err);
      }
    });
  }