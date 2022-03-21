"use strict" //oicq需要开启严格模式
const { createClient, segment, Message } = require('oicq');
const logger = new NIL.Logger("QQManager");
NIL.EventManager.addEvent('QQManager','onRotboOnline');
NIL.EventManager.addEvent('QQManager','onGroupMessageReceived');
NIL.EventManager.addEvent('QQManager','onFriendMessageReceived');
if(NIL.IO.exists('./Data/QQ.json')==false){
    NIL.IO.WriteTo('./Data/QQ.json',JSON.stringify({qq:114514,pwd:'1234567',platform:2,qrcode:true},null,'\t'));
}

const cfg = JSON.parse(NIL.IO.readFrom('./Data/QQ.json'));

const client = createClient(cfg.qq,{//机器人内部配置
    platform: 2,//QQ登录协议。1:安卓手机 2:安卓平板 3:安卓手表 4:MacOS 5:iPad
    kickoff: false,
    ignore_self: true,
    resend: true,
    brief: true
});


client.on("system.login.qrcode", function (e) {
    //扫码后按回车登录
    process.stdin.once("data", (e) => {
        this.login();
    })
}).login();

client.on("system.online", () => {
    logger.info('登陆成功！');
    NIL.EventManager.on('onRotboOnline');
});//登录成功提示

client.on('message.group',(e)=>{
    NIL.EventManager.on('onGroupMessageReceived',e);
});

NIL.bot = {};

/**
 * 发送群聊消息
 * @param group 群号
 * @param msg   要发送的消息
 */
 NIL.bot.sendGroupMessage = function (group, msg) {
    if (client.status != 11) { logger.warn('插件在QQ未登录时调用了API'); return; }//直接返回防止oicq崩溃
    if (msg == "#") return;
    if (group == undefined || msg == undefined) { logger.error('数据为空！！！'); return; }
    client.sendGroupMsg(group, msg);
  }
  
  /**
   * 获取群员对象
   * @param g 群号
   * @param q 成员QQ号
   * @returns 成员对象
   */
  NIL.bot.GetGroupMember = function (g, q) {
    if (client.status != 11) { logger.warn( '插件在QQ未登录时调用了API'); return; }
    return client.pickMember(g, q);
  }
  /**
   * 发送私聊消息
   * @param friend 好友QQ号
   * @param msg   要发送的消息
   */
  NIL.bot.sendFriendMessage = function (friend, msg) {
    if (client.status != 11) { logger.warn('插件在QQ未登录时调用了API'); return; }
    if (friend == undefined || msg == undefined) { logger.error('数据为空！！！'); return; }
    client.sendPrivateMsg(friend, msg);
  }
  
  /**
   * 发消息到主群(GROUP_MAIN)
   * @param msg   要发送的消息
   */
  NIL.bot.sendMainMessage = function (msg) {
    NIL.bot.sendGroupMessage(NIL.CONFIG.GROUP_MAIN, msg);
  }
  
  /**
   * 发消息到聊天群(GROUP_CHAT)
   * @param msg   要发送的消息
   */
  NIL.bot.sendChatMessage = function (msg) {
    NIL.bot.sendGroupMessage(NIL.CONFIG.GROUP_CHAT, msg);
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
  
  