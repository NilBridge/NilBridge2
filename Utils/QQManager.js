"use strict" //oicq需要开启严格模式
const { createClient, segment, Message, Client } = require('oicq');
const logger = new NIL.Logger("QQManager");
NIL.EventManager.addEvent('QQManager', 'onRotboOnline');
NIL.EventManager.addEvent('QQManager', 'onGroupMessageReceived');
NIL.EventManager.addEvent('QQManager', 'onFriendMessageReceived');
if (NIL.IO.exists('./Data/QQ.json') == false) {
    NIL.IO.WriteTo('./Data/QQ.json', '[]');
}

const Clients = new Map();

function AddConfig(qq){
    bots.push({
        "qq": qq,
        "pwd": "1234567",
        "platform": 2,
        "qrcode": true
    });
    NIL.IO.WriteTo('./Data/QQ.json', JSON.stringify(bots,null,'\t'));
}

function addClient(qq) {
    const client = createClient(qq, {//机器人内部配置
        platform: 2,//QQ登录协议。1:安卓手机 2:安卓平板 3:安卓手表 4:MacOS 5:iPad
        kickoff: false,
        ignore_self: true,
        resend: true,
        brief: true
    });
    Clients.set(qq,client);
    client.on("system.login.qrcode", function (e) {
        process.stdin.once("data", (e) => {
            this.login();
    });
    }).login();
    client.on("system.online", () => {
        logger.info(qq,'登陆成功！');
        NIL.EventManager.on('onRotboOnline', {qq});
    });
    client.on('message.group', getOnMessage(qq));
}

function autoLogin(qq,pwd,platform,qrcode=true){
    const client = createClient(qq, {//机器人内部配置
        platform,
        kickoff: false,
        ignore_self: true,
        resend: true,
        brief: true
    });
    client.on("system.online", () => {
        logger.info(qq,'登陆成功！');
        NIL.EventManager.on('onRotboOnline', {qq});
    });
    Clients.set(qq,client);
    client.on('message.group', getOnMessage(qq));
    if(qrcode){
        client.on("system.login.qrcode", function (e) {
            process.stdin.once("data", (e) => {
                this.login();
            })
        }).login();
    }else{
        client.login(pwd);
    }
}

let bots = JSON.parse(NIL.IO.readFrom('./Data/QQ.json'));

bots.forEach(bot => {
    autoLogin(bot.qq,bot.pwd,bot.platform,bot.qrcode);
});

/**
 * 
 * @param {GroupMessageEvent} e 
 * @returns 
 */
function getEventObj(e,qq) {
    return {
        self_id:qq,
        atme: e.atme,
        atall: e.atall,
        id: e.message_id,
        message: e.message,
        sender: {
            isAdmin: e.sender.role != 'member',
            send(msg) {
                NIL.bots.getBot(qq).sendPrivateMsg(e.user_id, msg);
            }
        },
        group: {
            id: e.group_id,
            name: e.group_name
        },
        recall() {
            e.recall();
        },
        reply(msg, at = false) {
            e.reply(msg, at);
        }
    }
}

function getOnMessage(qq){
    return (e)=>{
        let obj = getEventObj(e,qq);
        NIL.EventManager.on('onGroupMessageReceived', obj);
        /*
        switch (e.group_id) {
            case cfg.group.main:
                NIL.EventManager.on('onMainMessageReceived', obj);
                break;
            case cfg.group.chat:
                NIL.EventManager.on('onChatMessageReceived', obj);
                break;
        } */
    }
}

NIL.NBCMD.regUserCmd('qq', 'QQ机器人模块', (arg) => {
    switch (arg[0]) {
        case 'login':
            if(Clients.has(Number(arg[1]))){
                logger.warn('这个账号已经登录了');
                return;
            }
            addClient(Number(arg[1]));
            break;
        case 'logout':
            logout(Number(arg[1]));
            break;
        case 'autologin':
            switch(arg[1]){
                case "add":
                    if(arg[2]){
                        for(var i in bots){
                            if(bots[i].qq.toString() == arg[2]){
                                logger.warn('已存在一个自动登录项：',arg[2]);
                                return;
                            }
                        }
                        AddConfig(arg[2]);
                    }else{
                        logger.warn('参数错误：无法找到<qq>，键入qq autologin help查看帮助');         
                    }
                    break;
                case "remove":
                    for(var i in bots){
                        if(bots[i].qq.toString() == arg[2]){
                            bots.splice(i);
                            NIL.IO.WriteTo('./Data/QQ.json', JSON.stringify(bots,null,'\t'));
                            logger.info('移除登录项',arg[2],'成功');
                            return;
                        }
                    }
                    logger.warn('没有这样的登录项：',arg[2]);
                    break;
                case 'set':
                    break;
            }
            break;
        case 'help':
            logger.info('qq login <qq> - 登录一个QQ账号');
            logger.info('qq logout <qq> - 下线一个QQ账号');
            logger.info('qq autologin <add|remove|set> <qq> [opition] [value] - 自动登录设置');
            break;
        default:
            logger.warn('指令参数不足，键入qq help查看命令');
            break;
    }
});

function getBot(qq){
    return Clients.get(qq);
}

function logout(qq){
    Clients.get(qq).logout(false);
    Clients.delete(qq);
}

function logoutAll(){
    Clients.forEach((v,k)=>{logout(k)});
}

NIL.bots = {
    getBot,
    logout,
    logoutAll
};