const Lang = require('./Lang');
const langhelper = new Lang('lang.ini');
const cfg = require("./config.json");
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

function RuncmdAll(cmd, self) {
    NIL.SERVERS.forEach((s, k) => {
        s.sendCMD(cmd, (dt) => { NIL.bots.getBot(self).sendGroupMsg(cfg.group.main, `${k}\n${dt}`) });
    });
}


function onMain(e) {
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
            if (NIL._vanilla.isAdmin(e.sender.qq) == false) {
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
            if (NIL._vanilla.isAdmin(e.sender.qq) == false) {
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
            if (NIL._vanilla.xbox_exists(xbox)) {
                let id = NIL._vanilla.get_xboxid(e.sender.qq);
                e.reply(langhelper.get('MEMBER_ALREADY_IN_WHITELIST', id), true);
            } else {
                if (NIL._vanilla.xbox_exists(xbox)) {
                    e.reply(langhelper.get('XBOXID_ALREADY_BIND'), true);
                } else {
                    NIL._vanilla.wl_add(e.sender.qq, xbox);
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
                NIL._vanilla.wl_remove(e.sender.qq);
                e.reply(langhelper.get('MEMBER_UNBIND'), true);
                RuncmdAll(`whitelist remove "${id}"`, e.self_id);
                e.reply(langhelper.get('REMOVE_WL_TO_SERVER', e.sender.qq, id));
            }
            break;
        case cfg.add_wl:
            if (NIL._vanilla.isAdmin(e.sender.qq) == false) {
                e.reply(langhelper.get('MEMBER_NOT_ADMIN'));
                return;
            }
            var at = getAt(e);
            if (e.length != 0) {
                at.forEach(element => {
                    if (NIL._vanilla.wl_exists(element)) {
                        let xbox = NIL._vanilla.get_xboxid(element);
                        RuncmdAll(`allowlist add "${xbox}"`, e.self_id);
                        e.reply(langhelper.get('ADD_WL_TO_SERVER', element, xbox));
                    } else {
                        e.reply(langhelper.get('MEMBER_NOT_BIND_WHEN_REMOVE', element));
                    }
                });
            }
            break;
        case cfg.rem_wl:
            if (NIL._vanilla.isAdmin(e.sender.qq) == false) {
                e.reply(langhelper.get('MEMBER_NOT_ADMIN'));
                return;
            }
            var at = getAt(e);
            at.forEach(element => {
                if (!NIL._vanilla.wl_exists(element)) {
                    e.reply(langhelper.get('MEMBER_NOT_BIND_WHEN_REMOVE', element));
                } else {
                    let xbox = NIL._vanilla.get_xboxid(element);
                    e.reply(langhelper.get('REMOVE_WL_TO_SERVER', element, xbox));
                    RuncmdAll(`whitelist remove "${xbox}"`, e.self_id);
                    NIL._vanilla.wl_remove(element);
                }
            });
            break;
    }
}


module.exports = onMain;