const dbhelper = require('./leveldb');
const langhelper = require('./Lang');
langhelper.init();
const path = require('path');
function checkFile(file, text) {
    if (NIL.IO.exists(path.join(__dirname, file)) == false) {
        NIL.IO.WriteTo(path.join(__dirname, file), text);
    }
}

checkFile('config.json', JSON.stringify({
    self_id:114514,
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

const cfg = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'config.json')));

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
                    NIL.bots.getBot(cfg.self_id).sendGroupMsg(cfg.group.chat,langhelper.get('MEMBER_CHAT',dt.server,data.params.sender,data.params.text));
                    send2Other(dt.server,data.cause,data.params.sender.data.params.text);
                    NIL.EventManager.on('onPlayerChat', dt);
                    break;
                case 'join':
                    NIL.bots.getBot(cfg.self_id).sendGroupMsg(cfg.group.chat,langhelper.get('MEMBER_JOIN',dt.server,data.params.sender));
                    send2Other(dt.server,data.cause,data.params.sender);
                    NIL.EventManager.on('onPlayerJoin', dt);
                    break;
                case 'left':
                    NIL.bots.getBot(cfg.self_id).sendGroupMsg(cfg.group.chat,langhelper.get('MEMBER_LEFT',dt.server,data.params.sender));
                    send2Other(dt.server,data.cause,data.params.sender);
                    NIL.EventManager.on('onPlayerLeft', dt);
                    break;
                case 'server_start':
                    NIL.bots.getBot(cfg.self_id).sendGroupMsg(cfg.group.main,langhelper.get("SERVER_START",dt.server));
                    NIL.EventManager.on('onServerStart', dt);
                    break;
                case 'server_stop':
                    NIL.bots.getBot(cfg.self_id).sendGroupMsg(cfg.group.main,langhelper.get("SERVER_STOP",dt.server));
                    NIL.EventManager.on('onServerStop', dt);
                    break;
                case 'plantext':
                    NIL.bots.getBot(cfg.self_id).sendGroupMsg(cfg.group.main,data.params.text);
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
        NIL._vanilla = {
            cfg:cfg,
            wl_add,
            wl_exists,
            wl_remove,
            get_xboxid
        };
    },
    onStop() {}
}
function send2Other(ser,mode,pl,t){
    var txt = '';
    switch(mode){
        case "chat":
            txt = langhelper.get('SERVER_MEMBER_CHAT',ser,pl,t);
            break;
        case "join":
            txt = langhelper.get('SERVER_MEMBER_JOIN',ser,pl);
            break;
        case "left":
            txt = langhelper.get('SERVER_MEMBER_LEFT',ser,pl);
            break;
    }
    NIL.SERVERS.forEach((v,k)=>{
        v.sendText(txt);
    });
}

var GetFormatText = function(e){
    var rt = '';
    for(i in e.message){
        switch(e.message[i].type){
            case "at":
                if(e.message[i].qq.toString() == 'all'){
                    rt+=langhelper.get("MESSAGE_AT_ALL");
                    continue;
                }
                rt+= langhelper.get('MESSAGE_AT',e.message[i].text);
                break;
            case"image":
                rt+= langhelper.get("MESSAGE_IMAGE");
                break;
            case"text":
                rt+= e.message[i].text;
                break;
        }
    }
    return rt;
}

function onChat(e){
    SendTextAll(langhelper.get('GROUP_MEMBER_CHAT',e.sender.nick,GetFormatText(e)));
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

function wl_remove(qq){
    dbhelper.del(qq,(err)=>{});
}

function RuncmdAll(cmd,self) {
    NIL.SERVERS.forEach(s => {
        s.sendCMD(cmd, (dt) => {NIL.bots.getBot(self).sendGroupMsg(cfg.group.main,dt)});
    });
}

function SendTextAll(text) {
    NIL.SERVERS.forEach(s => {
        s.sendText(text);
    });
}

function isAdmin(qq) {
    return cfg.admins.indexOf(qq) != -1;
}

function get_xboxid(qq, cb) {
    dbhelper.get(qq, cb);
}

function xbox_exists(id, cb) {
    dbhelper.get(id, (err, dt) => {
        if (err) {
            cb(false);
        } else {
            cb(true);
        }
    });
}

function listKey(cb) {
    let rt = {};
    dbhelper.find(new Date(), (k, v) => {
        rt[k] = v;
        if (k == null) {
            cb(rt);
        }
    });
}

function wl_exists(qq, cb) {
    listKey((list) => {
        if (list[qq] == undefined) {
            cb(false);
        } else {
            cb(true);
        }
    });
}

function wl_add(qq, xboxid) {
    dbhelper.put(qq, xboxid, console.log);
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
    if(e.self_id != cfg.self_id)return;
    let text = getText(e);
    let pt = text.split(' ');
    switch (pt[0]) {
        case cfg.check:
            NIL.SERVERS.forEach((s,n) => {
                s.sendCMD('list', (re)=>{
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
                NIL.SERVERS.forEach((s,k) => {
                    e.reply(langhelper.get("COMMAND_SENDTO_SERVER", cmd, k), true);
                    s.sendCMD(cmd, (dt) => {
                        e.reply(dt);
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
                        e.reply(langhelper.get("CMD_FEEDBACK",pt[1], dt));
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
            e.reply(`命令${cmd}已执行`,true);
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
            wl_exists(e.sender.qq, (has) => {
                if (has) {
                    get_xboxid(e.sender.qq, (err, id) => {
                        e.reply(langhelper.get('MEMBER_ALREADY_IN_WHITELIST', id), true);
                    })
                } else {
                    var xbox = text.substring(cfg.bind.length + 1);
                    xbox_exists(xbox, (has) => {
                        if (has) {
                            e.reply(langhelper.get('XBOXID_ALREADY_BIND'), true);
                        } else {
                            wl_add(e.sender.qq, xbox);
                            if (cfg.auto_rename) e.member.setCard(xbox);
                            e.reply(langhelper.get('MEMBER_BIND_SUCCESS', xbox), true);
                            if(cfg.auto_wl){
                                RuncmdAll(`whitelist remove "${xbox}"`,e.self_id);
                                e.reply(langhelper.get('REMOVE_WL_TO_SERVER', e.sender.qq, xbox));
                            }
                        }
                    })
                }
            });
            break;
        case cfg.unbind:
            wl_exists(e.sender.qq, (has) => {
                if (has==false) {
                    e.reply(langhelper.get('MEMBER_NOT_BIND'), true);
                } else {
                    get_xboxid(e.sender.qq, (err, id) => {
                        wl_remove(e.sender.qq);
                        e.reply(langhelper.get('MEMBER_UNBIND'), true);
                        RuncmdAll(`whitelist remove "${id}"`,e.self_id);
                        e.reply(langhelper.get('REMOVE_WL_TO_SERVER', e.sender.qq, id));
                    });
                }
            })
            break;
        case cfg.add_wl:
            if (isAdmin(e.sender.qq) == false) {
                e.reply(langhelper.get('MEMBER_NOT_ADMIN'));
                return;
            }
            var at = getAt(e);
            if (e.length != 0) {
                at.forEach(element => {
                    wl_exists(element, (has) => {
                        if (has) {
                            get_xboxid(element, (err, xbox) => {
                                RuncmdAll(`allowlist add "${xbox}"`,e.self_id);
                                e.reply(langhelper.get('ADD_WL_TO_SERVER', element, xbox));
                            });
                        } else {
                            e.reply(langhelper.get('MEMBER_NOT_BIND_WHEN_REMOVE', element));
                        }
                    })
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
                wl_exists(element,(has)=>{
                    if (!has) {
                        e.reply(langhelper.get('MEMBER_NOT_BIND_WHEN_REMOVE', element));
                    } else {
                        get_xboxid(element,(err,xbox)=>{
                            e.reply(langhelper.get('REMOVE_WL_TO_SERVER', element, xbox));
                            RuncmdAll(`whitelist remove "${xbox}"`,e.self_id);
                            wl_remove(element);
                        })
                    }
                })
            });
            break;
    }
}
