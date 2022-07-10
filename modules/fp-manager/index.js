const { uuid } = require('oicq/lib/common');
const { client } = require('websocket');
const logger = new NIL.Logger('FakePlayerManager');
const path = require('path');
if (NIL.IO.exists("./Data/fp-manager") == false) {
    NIL.IO.createDir("./Data/fp-manager");
    NIL.IO.WriteTo("./Data/fp-manager/config.json", JSON.stringify({ url: "ws://127.0.0.1:54321", admin: [114514], version: 1 }, null, 4));
}

console.log(NIL.IO.readFrom(path.join(__dirname,"logo.txt")));

const config = JSON.parse(NIL.IO.readFrom("./Data/fp-manager/config.json"));

const ws = new client();

let connect;

const callbacks = new Map();

const StatCode = ['连接中', '已连接', '断开连接中', '已断开连接', '重新连接中', '停止中', '已停止'];

function sendMsg(str) {
    NIL.bots.getBot(NIL._vanilla.cfg.self_id).sendGroupMsg(NIL._vanilla.cfg.group.main, str);
}

function sendWS(str, cb) {
    if(connect.state != 'open'){
        sendMsg(`无法发送命令到假人客户端，请检查websocket连接是否正常`);
        return;
    }
    let id = uuid();
    str.id = id;
    callbacks.set(id, cb);
    try {
        connect.send(JSON.stringify(str));
    } catch (err) {
        logger.error(err);
    }
}

ws.on("connectFailed", (err) => {
    logger.error(err);
    logger.warn('与假人客户端连接失败，请检查假人是否开启以及端口是否正确');
    logger.info("将在5秒后重新连接");
    setTimeout(() => {
        ws.connect(config.url);
    }, 5e3);
});

ws.on("connect", (conn) => {
    connect = conn;
    logger.info('假人客户端连接成功');
    conn.on("message", (data) => {
        let dt = JSON.parse(data.utf8Data);
        if (dt.id) {
            if (callbacks.has(dt.id)) {
                try {
                    callbacks.get(dt.id)(dt.data);
                } catch (err) { logger.error(err); }
                callbacks.delete(dt.id);
            }
        }
    })
    conn.on('close', () => {
        logger.warn('与假人客户端连接失败，请检查假人是否开启以及端口是否正确');
        logger.info("将在5秒后重新连接");
        setTimeout(() => {
            ws.connect(config.url);
        }, 5e3);
    })
});

function onMain(e) {
    if (e.group.id !== NIL._vanilla.cfg.group.main) return;
    let msg = e.raw_message.split(' ');
    if (msg[0] != '/fp') return;
    if(config.admin.includes(e.sender.qq) == false)return;
    switch (msg[1]) {
        case 'list':
            sendWS({ type: 'list' }, (dt) => {
                e.reply(`所有假人列表：${dt.list.join(",")}`, true);
            });
            break;
        case 'add':
            if (msg[2]) {
                sendWS({ type: 'add', data: { name: msg[2], skin: 'steve', allowChatControl: msg[3] == '是' } }, (dt) => {
                    if (dt.success) {
                        e.reply(`假人[${dt.name}]添加成功`, true);
                    } else {
                        e.reply(`假人[${dt.name}]添加失败：${dt.reason}`, true);
                    }
                })
            } else {
                e.reply('用法：/fp add <假人名称> [是否允许聊天控制（是/否）]', true);
            }
            break;
        case "rem":
            if(msg[2]){
                sendWS({type:'remove',data:{name:msg[2]}},(dt)=>{
                    if (dt.success) {
                        e.reply(`假人[${dt.name}]移除成功`, true);
                    } else {
                        e.reply(`假人[${dt.name}]移除失败：${dt.reason}`, true);
                    }
                })
            }else{
                e.reply('用法：/fp rem <假人名称>', true);
            }
            break;
        case 'stall':
            sendWS({ type: 'getState_all' }, (dt) => {
                let re = '';
                for (let i in dt.playersData) {
                    let tmp = dt.playersData[i];
                    re += `[${i}]\n状态：${StatCode[tmp.state]}\n是否允许聊天控制：${tmp.allowChatControl ? '是' : '否'}\n皮肤样式：${tmp.skin}\n`;
                }
                e.reply(re, true);
            })
            break;
        case 'dis':
            if(msg[2]){
                sendWS({type:"disconnect",data:{name:msg[2]}},(dt)=>{
                    if(dt.success){
                        e.reply(`假人[${dt.name}]断开成功`, true);
                    }else{
                        e.reply(`假人[${dt.name}]断开失败：${dt.reason}`, true);
                    }
                });
            }else{
                e.reply(`/fp dis <假人名称>`,true);
            }
            break;
        case 'con':
            if(msg[2]){
                sendWS({type:"connect",data:{name:msg[2]}},(dt)=>{
                    if(dt.success){
                        e.reply(`假人[${dt.name}]连接成功`, true);
                    }else{
                        e.reply(`假人[${dt.name}]连接失败：${dt.reason}`, true);
                    }
                });
            }else{
                e.reply(`/fp con <假人名称>`,true);
            }
            break;
        case 'disall':
            sendWS({type:'disconnect_all'},(dt)=>{
                e.reply(`${dt.list.join(",")}已断开连接`,true);
            })
            break;
        case "conall":
            sendWS({type:'connect_all'},(dt)=>{
                e.reply(`${dt.list.join(",")}已连接`,true);
            });
            break;
    }
}

class fpmanager extends NIL.ModuleBase {
    can_reload_require = false;
    onStart(api) {
        ws.connect(config.url);
        api.listen('onMainMessageReceived', onMain);
    }
    onStop() {
        ws.abort();
    }
}

module.exports = new fpmanager;