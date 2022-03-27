const langhelper = require('./Lang');
langhelper.init();
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
    admins: []
}, null, '\t'));

let playerdata = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'playerdata.json')))
const cfg = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'config.json')));

function save_playerdata() {
    NIL.IO.WriteTo(path.join(__dirname, 'playerdata.json'), JSON.stringify(playerdata, null, '\t'));
}

let times = new Map();

module.exports = {
    onStart(api) {
        api.addEvent('onMainMessageReceived');
        api.addEvent('onChatMessageReceived');
        api.addEvent('onMemberBind');
        api.addEvent('onMemberUnbind');
        api.addEvent('onServerStart');
        api.addEvent('onServerStop');
        api.addEvent('onPlayerJoin');
        api.addEvent('onPlayerLeft');
        api.addEvent('onPlayerChat');
        api.listen('onWebsocketReceived', (dt) => {
            let data = JSON.parse(dt.message);
            switch (data.cause) {
                case 'chat':
                    NIL.bots.getBot(cfg.self_id).sendGroupMsg(cfg.group.chat, langhelper.get('MEMBER_CHAT', dt.server, data.params.sender, data.params.text));
                    send2Other(dt.server, data.cause, data.params.sender,data.params.text);
                    NIL.EventManager.on('onPlayerChat', dt);
                    break;
                case 'join':
                    times.set(data.params.sender,new Date().getTime());
                    add_time(data.params.sender,0,1);
                    NIL.bots.getBot(cfg.self_id).sendGroupMsg(cfg.group.chat, langhelper.get('MEMBER_JOIN', dt.server, data.params.sender,playerdata[get_qq(data.params.sender)].join));
                    send2Other(dt.server, data.cause, data.params.sender);
                    NIL.EventManager.on('onPlayerJoin', dt);
                    break;
                case 'left':
                    NIL.bots.getBot(cfg.self_id).sendGroupMsg(cfg.group.chat, langhelper.get('MEMBER_LEFT', dt.server, data.params.sender));
                    send2Other(dt.server, data.cause, data.params.sender);
                    NIL.EventManager.on('onPlayerLeft', dt);
                    if(times.has(data.params.sender)){
                        add_time(data.params.sender,1,new Date().getTime() - times.get(data.params.sender));
                        times.delete(data.params.sender);
                    }
                    break;
                case 'server_start':
                    NIL.bots.getBot(cfg.self_id).sendGroupMsg(cfg.group.main, langhelper.get("SERVER_START", dt.server));
                    NIL.EventManager.on('onServerStart', dt);
                    break;
                case 'server_stop':
                    NIL.bots.getBot(cfg.self_id).sendGroupMsg(cfg.group.main, langhelper.get("SERVER_STOP", dt.server));
                    NIL.EventManager.on('onServerStop', dt);
                    break;
                case 'plantext':
                    NIL.bots.getBot(cfg.self_id).sendGroupMsg(cfg.group.main, data.params.text);
                    break;
            }
        });
        api.listen('onGroupMessageReceived', (e) => {
            if (cfg.group.main == e.group.id) {
                group_main(e);
                NIL.EventManager.on('onMainMessageReceived', e);
            }
            if (e.group.id == cfg.group.chat) {
                onChat(e);
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
    },
    onStop() {
        save_playerdata();
    }
}
function send2Other(ser, mode, pl, t) {
    var txt = '';
    switch (mode) {
        case "chat":
            txt = langhelper.get('SERVER_MEMBER_CHAT', ser, pl, t);
            break;
        case "join":
            txt = langhelper.get('SERVER_MEMBER_JOIN', ser, pl);
            break;
        case "left":
            txt = langhelper.get('SERVER_MEMBER_LEFT', ser, pl);
            break;
    }
    NIL.SERVERS.forEach((v, k) => {
        if(k != ser)
            v.sendText(txt);
    });
}

var GetFormatText = function (e) {
    var rt = '';
    for (i in e.message) {
        switch (e.message[i].type) {
            case "at":
                if (e.message[i].qq.toString() == 'all') {
                    rt += langhelper.get("MESSAGE_AT_ALL");
                    continue;
                }
                rt += langhelper.get('MESSAGE_AT', e.message[i].text);
                break;
            case "image":
                rt += langhelper.get("MESSAGE_IMAGE");
                break;
            case "text":
                rt += e.message[i].text;
                break;
        }
    }
    return rt;
}

function onLeft(e){
    if(e.group_id == cfg.group.main && e.self_id == cfg.self_id){
        if (wl_exists(e.user_id)) {
            NIL.bots.getBot(cfg.self_id).sendGroupMsg(langhelper.get('MEMBER_LEFT_GROUP', get_xboxid(e.user_id)))
            RuncmdAll(`allowlist remove "${get_xboxid(e.user_id)}"`);
            wl_remove(e.user_id);
          }
    }
}

function onChat(e) {
    let xbox = get_xboxid(e.sender.qq);
    SendTextAll(langhelper.get('GROUP_MEMBER_CHAT',xbox == undefined? e.sender.nick:xbox, GetFormatText(e)));
}

function getText(e) {
    var rt = '';
    for (i in e.message) {
        switch (e.message[i].type) {
            case "text":
                rt += e.message[i].text;
                break;
        }
    }
    return rt;
}

function wl_remove(qq) {
    delete playerdata[qq];
}

function RuncmdAll(cmd, self) {
    NIL.SERVERS.forEach((s, k) => {
        s.sendCMD(cmd, (dt) => { NIL.bots.getBot(self).sendGroupMsg(cfg.group.main, dt) });
    });
}

function SendTextAll(text) {
    NIL.SERVERS.forEach((s, k) => {
        s.sendText(text);
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
    if(qq==undefined)return;
    return playerdata[qq];
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
    return Object.values(playerdata).indexOf(id) != -1;
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

var getAt = function (e) {
    var at = [];
    for (i in e.message) {
        switch (e.message[i].type) {
            case "at":
                at.push(e.message[i].qq);
                break;
        }
    }
    return at;
};


function group_main(e) {
    if (e.self_id != cfg.self_id) return;
    let text = getText(e);
    let pt = text.split(' ');
    switch (pt[0]) {
        case cfg.check:
            NIL.SERVERS.forEach((s, n) => {
                s.sendCMD('list', (re) => {
                    e.reply(`${n}\n${re}`);
                });
            });
            break;
        case cfg.cmd:
            if (isAdmin(e.sender.qq) == false) {
                e.reply(langhelper.get('MEMBER_NOT_ADMIN'));
                return;
            }
            if (NIL.SERVERS.size == 1) {
                let cmd = text.substring(cfg.cmd.length + 1);
                NIL.SERVERS.forEach((s, k) => {
                    e.reply(langhelper.get("COMMAND_SENDTO_SERVER", cmd, k), true);
                    s.sendCMD(cmd, (dt) => {
                        e.reply(`${k}\n${dt}`);
                    });
                });
            }
            else {
                if (pt.length > 2) {
                    if (NIL.SERVERS.has(pt[1]) == false) {
                        e.reply(`没有名为${pt[1]}的服务器`, true);
                        return;
                    }
                    e.reply(langhelper.get("COMMAND_SENDTO_SERVER", text.substring(`/cmd ${pt[1]} `.length), pt[1]), true);
                    NIL.SERVERS.get(pt[1]).sendCMD(text.substring(`${cfg.cmd} ${pt[1]} `.length), (dt) => {
                        e.reply(langhelper.get("CMD_FEEDBACK", pt[1], dt));
                    });
                } else {
                    e.reply(langhelper.get('COMMAND_OVERLOAD_NOTFIND'), true);
                }
            }
            break;
        case cfg.nbcmd:
            if (isAdmin(e.sender.qq) == false) {
                e.reply(langhelper.get('MEMBER_NOT_ADMIN'), true);
                return;
            }
            let cmd = text.substring(cfg.nbcmd.length + 1);
            e.reply(`命令${cmd}已执行`, true);
            NIL.NBCMD.run_cmd(cmd, (err, cb) => {
                if (err) {
                    e.reply(err.stack, true);
                }
            });
            break;
        case cfg.bind:
            if (pt.length < 2) {
                e.reply(langhelper.get('COMMAND_OVERLOAD_NOTFIND'), true);
                return;
            }
            var xbox = text.substring(cfg.bind.length + 1);
            if (xbox_exists(xbox)) {
                let id = get_xboxid(e.sender.qq);
                e.reply(langhelper.get('MEMBER_ALREADY_IN_WHITELIST', id), true);
            } else {
                if (xbox_exists(xbox)) {
                    e.reply(langhelper.get('XBOXID_ALREADY_BIND'), true);
                } else {
                    wl_add(e.sender.qq, xbox);
                    if (cfg.auto_rename) e.member.setCard(xbox);
                    e.reply(langhelper.get('MEMBER_BIND_SUCCESS', xbox), true);
                    if (cfg.auto_wl) {
                        RuncmdAll(`whitelist remove "${xbox}"`, e.self_id);
                        e.reply(langhelper.get('REMOVE_WL_TO_SERVER', e.sender.qq, xbox));
                    }
                }
            }
            break;
        case cfg.unbind:
            if (wl_exists(e.sender.qq) == false) {
                e.reply(langhelper.get('MEMBER_NOT_BIND'), true);
            } else {
                let id = get_xboxid(e.sender.qq);
                wl_remove(e.sender.qq);
                e.reply(langhelper.get('MEMBER_UNBIND'), true);
                RuncmdAll(`whitelist remove "${id}"`, e.self_id);
                e.reply(langhelper.get('REMOVE_WL_TO_SERVER', e.sender.qq, id));
            }
            break;
        case cfg.add_wl:
            if (isAdmin(e.sender.qq) == false) {
                e.reply(langhelper.get('MEMBER_NOT_ADMIN'));
                return;
            }
            var at = getAt(e);
            if (e.length != 0) {
                at.forEach(element => {
                    if (wl_exists(element)) {
                        let xbox = get_xboxid(element);
                        RuncmdAll(`allowlist add "${xbox}"`, e.self_id);
                        e.reply(langhelper.get('ADD_WL_TO_SERVER', element, xbox));
                    } else {
                        e.reply(langhelper.get('MEMBER_NOT_BIND_WHEN_REMOVE', element));
                    }
                });
            }
            break;
        case cfg.rem_wl:
            if (isAdmin(e.sender.qq) == false) {
                e.reply(langhelper.get('MEMBER_NOT_ADMIN'));
                return;
            }
            var at = getAt(e);
            at.forEach(element => {
                if (!wl_exists(element)) {
                    e.reply(langhelper.get('MEMBER_NOT_BIND_WHEN_REMOVE', element));
                } else {
                    let xbox = get_xboxid(element);
                    e.reply(langhelper.get('REMOVE_WL_TO_SERVER', element, xbox));
                    RuncmdAll(`whitelist remove "${xbox}"`, e.self_id);
                    wl_remove(element);
                }
            });
            break;
    }
}
