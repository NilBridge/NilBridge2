"use strict" //oicq需要开启严格模式
const { createClient, segment, Message, Client } = require('oicq');
const logger = new NIL.Logger("QQManager");
NIL.EventManager.addEvent('QQManager', 'onRobotOnline');
NIL.EventManager.addEvent('QQManager', 'onGroupMessageReceived');
NIL.EventManager.addEvent('QQManager', 'onFriendMessageReceived');
NIL.EventManager.addEvent('QQManager', 'onGroupMemberLeft');
if (NIL.IO.exists('./Data/QQ.json') == false) {
    NIL.IO.WriteTo('./Data/QQ.json', '[]');
}

const Clients = new Map();

function AddConfig(qq) {
    bots.push({
        "qq": qq,
        "pwd": "1234567",
        "platform": 2,
        "qrcode": true
    });
    NIL.IO.WriteTo('./Data/QQ.json', JSON.stringify(bots, null, '\t'));
}

function addClient(qq) {
    const client = createClient(qq, { platform: 2, kickoff: false, ignore_self: true, resend: true, brief: true });
    Clients.set(qq, client);
    client.on("system.login.qrcode", function (e) {
        process.stdin.once("data", (e) => {
            this.login();
        });
    }).login();
    addOnEvent(client, qq);
}

/**
 * 
 * @param {Client} client 
 * @param {*} qq 
 */
function addOnEvent(client, qq) {
    client.on("system.online", getOnRobotOnline(qq));
    client.on('message.group',getOnMessage(qq));
    client.on('notice.group.decrease', getOnMemeberLeft());
}

function autoLogin(qq, pwd, platform, qrcode = true) {
    const client = createClient(qq, { platform, kickoff: false, ignore_self: true, resend: true, brief: true });
    Clients.set(qq, client);
    addOnEvent(client, qq);
    client.on("system.login.slider", () => {
        logger.warn(qq, '触发设备锁');
    });
    if (qrcode) {
        client.on("system.login.qrcode", function (e) {
            process.stdin.once("data", (e) => {
                this.login();
            })
        }).login();
    } else {
        client.login(pwd);
    }
}

let bots = JSON.parse(NIL.IO.readFrom('./Data/QQ.json'));

bots.forEach(bot => {
    autoLogin(bot.qq, bot.pwd, bot.platform, bot.qrcode);
});

class GroupMessageGroupArgs{
    constructor(e){
        /**
         * 群号
         */
        this.id = e.group_id;
        /**
         * 群名称
         */
        this.name = e.name;
    }
}

class GroupMessageReceivedEventArgs {
    constructor(e,qq){
        /**
         * 回复这条信息
         * @param {import('oicq').Sendable} content 要回复的消息
         * @param {boolean} qcote 是否引用原消息
         */
        this.reply = (content,qcote)=>{
            e.reply(content,qcote);
        };
        /**
         * 撤回消息
         */
        this.recall = ()=>{
            e.recall();
        };
        /**
         * 收信者QQ号
         */
        this.self_id = e.self_id;
        /**
         * 是否提及收信者
         */
        this.atme = e.atme;
        /**
         * 是否提及全体
         */
        this.atall = e.atall;
        /**
         * 消息id
         * 
         * 可用`client.getMsg`方法获取具体信息参数
         */
        this.id = e.message_id;
        /**
         * 消息对象
         * 
         * 详见：https://takayama-lily.github.io/oicq/classes/GroupMessage.html#message
         */
        this.message = e.message;
        /**
         * 成员对象
         * 
         * 详见：https://takayama-lily.github.io/oicq/index.html#class-member
         */
        this.member = e.member;
        /**
         * 字符串化的消息
         */
        this.raw_message = e.raw_message;
        this.sender = {
            qq: e.sender.user_id,
            /**
             * 群昵称
             */
            nick: e.sender.nickname,
            /**
             * 是否为群管理员
             */
            isAdmin: e.sender.role != 'member',
            /**
             * 
             * @param {import('oicq').Sendable} msg 发送的消息
             */
            send(msg) {
                NIL.bots.getBot(qq).sendPrivateMsg(e.user_id, msg);
            }
        }
        /**
         * 群聊对象
         */
        this.group = new GroupMessageGroupArgs(e.group);
    }
}


function getOnMessage(qq) {
    return (e) => {
        NIL.EventManager.on('onGroupMessageReceived', new GroupMessageReceivedEventArgs(e,qq));
    }
}

function getOnMemeberLeft() {
    return (e) => {
        NIL.EventManager.on('onGroupMemberLeft', e);
    }
}

function getOnRobotOnline(qq) {
    return () => {
        logger.info(qq, '登陆成功！');
        NIL.EventManager.on('onRobotOnline', { qq });
    }
}

NIL.NBCMD.regUserCmd('qq', 'QQ机器人模块', (arg) => {
    return new Promise((res,rej)=>{
        switch (arg[0]) {
            case 'login':
                if (Clients.has(Number(arg[1]))) {
                    res('这个账号已经登录了');
                    break;
                }
                addClient(Number(arg[1]));
                res(`账号：${arg[1]} 添加成功`);
                break;
            case 'logout':
                logout(Number(arg[1]));
                res(`账号：${arg[1]} 下线完毕`);
                break;
            case 'autologin':
                switch (arg[1]) {
                    case "add":
                        if (arg[2]) {
                            for (var i in bots) {
                                if (bots[i].qq.toString() == arg[2]) {
                                    res('已存在一个自动登录项：' + arg[2]);
                                }
                            }
                            AddConfig(arg[2]);
                            res(`添加登录项 ${arg[2]} 成功`);
                        } else {
                            res('参数错误：无法找到<qq>，键入qq autologin help查看帮助');
                        }
                        break;
                    case "remove":
                        for (var i in bots) {
                            if (bots[i].qq.toString() == arg[2]) {
                                bots.splice(i);
                                NIL.IO.WriteTo('./Data/QQ.json', JSON.stringify(bots, null, '\t'));
                                res(`移除登录项 ${arg[2]} 成功`);
                            }
                        }
                        res('没有这样的登录项：' + arg[2]);
                        break;
                    default:
                        res(`没有这样的指令：${arg[1]}`);
                        break;
                }
            case 'help':
                res(['qq login <qq> - 登录一个QQ账号', 'qq logout <qq> - 下线一个QQ账号', 'qq autologin <add|remove> <qq> - 自动登录设置']);
                break;
            default:
                break;
        }
    })
});

/**
 * 
 * @param {} qq 
 * @returns {Client}
 */
function getBot(qq) {
    return Clients.get(qq.toString());
}

function logout(qq) {
    Clients.get(qq).logout(false);
    Clients.delete(qq);
}

function logoutAll() {
    Clients.forEach((v, k) => { logout(k) });
}

NIL.bots = {
    getBot,
    logout,
    logoutAll,
};