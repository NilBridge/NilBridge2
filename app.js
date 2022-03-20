"use strict" //oicq需要开启严格模式
const { createClient, segment, Message } = require('oicq');



global.NIL = {};
require('./Utils/Logger');

var logger = new NIL.Logger('Main');

require('./Utils/EventManager');
require('./Utils/FileSystem');


require('./Utils/ServerManager');

require('./Utils/PluginsManager');

NIL.EventManager.on('onServerStart');

const client = createClient(2582152047,{//机器人内部配置
    platform: 2,//QQ登录协议。1:安卓手机 2:安卓平板 3:安卓手表 4:MacOS 5:iPad
    kickoff: false,
    ignore_self: true,
    resend: true,
    brief: true
  });
/*
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
client.on("system.login.qrcode", function (e) {
    //扫码后按回车登录
    process.stdin.once("data", (e) => {
        this.login();
    })
}).login();
client.on("system.online", () => console.log('OICQ', "登录成功!"));//登录成功提示

rl.on('line',(input)=>{
	NIL.PluginsManager.unloadAll();
    NIL.PluginsManager.loadAll();
});
*/