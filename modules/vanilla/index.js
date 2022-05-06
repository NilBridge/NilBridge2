const Lang = require('./Lang');
const langhelper = new Lang('lang.ini');

const path = require('path');
function checkFile(file, text) {
    if (NIL.IO.exists(path.join(__dirname, file)) == false) {
        NIL.IO.WriteTo(path.join(__dirname, file), text);
    }
}
checkFile('playerdata.json', "{}");
checkFile('config.json', JSON.stringify({
    self_id: 114514,
    bind: '/bind',
    cmd: '/cmd',
    unbind: '/unbind',
    add_wl: 'wl+',
    rem_wl: 'wl-',
    check: '查服',
    nbcmd: '/nbcmd',
    auto_wl: false,
    auto_rename: true,
    auto_remove: true,
    group: {
        main: 114514,
        chat: 114514
    },
    admins: [],
    onMain:true,
    onChat:true
}, null, '\t'));

const onChat = require('./onChat');
const onMain = require('./onMain');
const onWebsocket = require("./onWebsocket");

let playerdata = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'playerdata.json')))
const cfg = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'config.json')));

function save_playerdata() {
    NIL.IO.WriteTo(path.join(__dirname, 'playerdata.json'), JSON.stringify(playerdata, null, '\t'));
}

class vanilla extends NIL.ModuleBase {
    onStart(api) {
        api.addEvent('onMainMessageReceived');
        api.addEvent('onChatMessageReceived');
        api.addEvent('onMemberBind');
        api.addEvent('onMemberUnbind');
        api.addEvent('onServerStart');
        api.addEvent('onServerStop');
        api.addEvent("onServerAccidentStop");
        api.addEvent('onPlayerJoin');
        api.addEvent('onPlayerLeft');
        api.addEvent('onPlayerChat');
        api.addEvent('onMemberBinding');
        api.addEvent('onMemberUnBinding');
        api.listen('onWebsocketReceived', (dt) => {
            onWebsocket(dt);
        });
        api.listen('onGroupMessageReceived', (e) => {
            if (cfg.group.main == e.group.id) {
                if(cfg.onMain) onMain(e);
                NIL.EventManager.on('onMainMessageReceived', e);
            }
            if (e.group.id == cfg.group.chat) {
                if(cfg.onChat) onChat(e);
                NIL.EventManager.on('onChatMessageReceived', e);
            }

        });
        api.listen('onNilBridgeStop', save_playerdata);
        if(cfg.auto_remove){
            api.listen('onGroupMemberLeft',onLeft);
        }
        NIL._vanilla = {
            cfg: cfg,
            wl_add,
            wl_exists,
            wl_remove,
            get_xboxid,
            get_player,
            get_qq,
            xbox_exists,
            add_time,
            get_all,
            isAdmin
        };
    }
    onStop() {
        save_playerdata();
    }
    can_reload_require = false;
}


function onLeft(e){
    if(e.group_id == cfg.group.main && e.self_id == cfg.self_id){
        if (wl_exists(e.user_id)) {
            NIL.bots.getBot(cfg.self_id).sendGroupMsg(langhelper.get('MEMBER_LEFT_GROUP', get_xboxid(e.user_id)));
            NIL.EventManager.on('onMemberUnBinding',{member:{qq:e.user_id},xboxid:get_xboxid(e.user_id)});
            RuncmdAll(`allowlist remove "${get_xboxid(e.user_id)}"`);
            wl_remove(e.user_id);
          }
    }
}

function wl_remove(qq) {
    delete playerdata[qq];
}

function RuncmdAll(cmd, self) {
    NIL.SERVERS.forEach((s, k) => {
        s.sendCMD(cmd, (dt) => { NIL.bots.getBot(self).sendGroupMsg(cfg.group.main, `${k}\n${dt}`) });
    });
}

function isAdmin(qq) {
    return cfg.admins.indexOf(qq) != -1;
}

function get_xboxid(qq) {
    return playerdata[qq].xboxid;
}

function get_player(xboxid){
    let qq = get_qq(xboxid);
    if(qq==undefined) return {join:0,period:0};
    return Object.assign({}, playerdata[qq]);
}

function get_qq(xboxid){
    for(var i in playerdata){
        let tmp = playerdata[i];
        if(tmp.xboxid == xboxid){
            return i;
        }
    }
}

function xbox_exists(id) {
    for(let i in playerdata){
        if(playerdata[i].xboxid == id)return true;
    }
    return false;
}


function wl_exists(qq) {
    return playerdata[qq] != undefined;
}

function wl_add(qq, xboxid) {
    playerdata[qq] = {xboxid,join:0,period:0};
}

function add_time(xboxid,mode,time){
    let qq = get_qq(xboxid);
    if(qq==undefined)return;
    switch(mode){
        case 0:
            playerdata[qq].join += time;
            break;
        case 1:
            playerdata[qq].period += time;
            break;
    }
}

function get_all(){
    return playerdata;
}

module.exports = new vanilla;