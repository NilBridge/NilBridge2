"use strict" //oicq需要开启严格模式
const { createClient, segment, Message } = require('oicq');
const logger = new NIL.Logger("QQManager");
NIL.EventManager.addEvent('QQManager','onRotboOnline');
NIL.EventManager.addEvent('QQManager','onGroupMessageReceived');
NIL.EventManager.addEvent('QQManager','onFriendMessageReceived');
if(NIL.IO.exists('./Data/QQ.json')==false)NIL.IO.WriteTo('./Data/QQ.json',JSON.stringify({qq:114514,pwd:'1234567',platform:2,qrcode:true},null,'\t'));

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
