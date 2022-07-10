const Lang = require('./Lang');
const path = require("path");
const langhelper = new Lang('lang.ini');
const cfg = require("./config.json");
const http = require('http');
let regex_path = path.join(__dirname, "regex.json");
if (NIL.IO.exists(regex_path) == false) {
    NIL.IO.WriteTo(regex_path, JSON.stringify({ cmds: { "(.*)There are (.*)\/(.*) players online:[\\r\n]+(.*)Server\\] (.*)": "有$2个玩家在线：$5", "Syntax error:(.+)": "执行出错：$1" }, group: [] }, null, '\t'));
}
let regexs = JSON.parse(NIL.IO.readFrom(regex_path));
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

/**
 * 
 * @param {String} str 
 * @param {RegExpMatchArray} reg 
 * @returns 
 */
function buildString(str, reg) {
    var i = 0;
    reg.forEach(s => {
        str = str.replace(`\$${i}`, s);
        i++
    });
    return str;
}


function fomatCMD(result) {
    for (let i in regexs.cmds) {
        let tmp = result.match(i);
        if (tmp == null) continue;
        return buildString(regexs.cmds[i], tmp);
    }
    return result;
}


/**
 * 
 * @param {String} str 
 * @param {*} e 
 */
function onRegex(str, e) {
    for (let i in regexs.group) {
        if (NIL._vanilla.isAdmin(e.sender.qq) == false && regexs.group[i].permission == 1) continue;
        if(regexs.group[i].permission == 3){
            if(regexs.group[i].members == undefined){
                throw new Error('permission 为 3 时，需要有member参数确定执行者');
            }
            if(regexs.group[i].members.indexOf(e.sender.qq) == -1)continue;
        }
        let tmp = str.match(regexs.group[i].Regex);
        if (tmp == null) continue;
        regexs.group[i].actions.forEach(item => {
            switch (item.type) {
                case 'reply':
                    e.reply(buildString(item.text, tmp));
                    break;
                case 'group':
                    NIL.bots.getBot(e.self_id).sendGroupMsg(item.id, buildString(item.text, tmp));
                    break;
                case "nbcmd":
                    NIL.NBCMD.run_cmd(buildString(item.text, tmp)).then((result)=>{
                        if (Array.isArray(result)) {
                            e.reply(result.join('\n'), true);
                        } else {
                            e.reply(result, true);
                        }
                    }).catch((err)=>{
                        e.reply(`执行出错：${err}`, true);
                    });
                    break;
                case "runcmd":
                    let result = '';
                    let sends = {};
                    item.servers.forEach(s=>{
                        sends[s.name] = null;
                        if(NIL.SERVERS.has(s.name)==false){
                            e.reply(`没有名为 ${s.name} 的服务器！！正则表达式执行失败！！`);
                            return;
                        }
                        NIL.SERVERS.get(s.name).sendCMD(buildString(s.cmd,tmp),(re)=>{
                            if(s.reply){
                                sends[s.name] = `[${s.name}]：${fomatCMD(re)}\n`;
                            }else{
                                sends[s.name] = '您设置了忽略获取结果';
                            }
                        });
                    });
                    let timeout = item.timeout == undefined ? 3000 : item.timeout;
                    if(item.reply){
                        setTimeout(() => {
                            for(let i in sends){
                                if(sends[i] != null){
                                    result += sends[i];
                                }else{
                                    result += `[${i}]：执行结果获取超时`;
                                }
                            }
                            e.reply(result);
                        }, timeout);
                    }
                    break;
                case 'http_get':
                    http.get(item.url, (res) => {
                        let html = ""
                        res.on("data", (data) => {
                            html += data
                        })
                        res.on("end", () => {
                            e.reply(item.text.replcae('{data}',html),true);
                        })
                    }).on("error", (e) => {
                        e.reply(`获取数据失败: ${e.message}`,true);
                    })
                    break;
            }
        });
    }
}

NIL.NBCMD.regUserCmd('regexreload', '重载正则表达式', (arg) => {
    return new Promise((res,rej)=>{
        try{
            regexs = JSON.parse(NIL.IO.readFrom(path.join(__dirname, "regex.json")));
            res('正则表达式重载完成');
        }catch(err){
            rej(err);
        }
    })
});

function onMain(e) {
    if (e.self_id != cfg.self_id) return;
    let text = getText(e);
    let pt = text.split(' ');
    switch (pt[0]) {
        case cfg.check:
            NIL.SERVERS.forEach((s, n) => {
                s.sendCMD('list', (re) => {
                    e.reply(`[${n}]\n${fomatCMD(re)}`);
                });
            });
            break;
        case cfg.cmd:
            if (NIL._vanilla.isAdmin(e.sender.qq) == false) {
                e.reply(langhelper.get('MEMBER_NOT_ADMIN', NIL._vanilla.get_xboxid(e.sender.qq)));
                return;
            }
            if (NIL.SERVERS.size == 1) {
                let cmd = text.substring(cfg.cmd.length + 1);
                NIL.SERVERS.forEach((s, k) => {
                    e.reply(langhelper.get("COMMAND_SENDTO_SERVER", cmd, k), true);
                    s.sendCMD(cmd, (dt) => {
                        e.reply(`[${k}]\n${fomatCMD(dt)}`);
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
            NIL.NBCMD.run_cmd(cmd).then(result=>{
                if (Array.isArray(result)) {
                    e.reply(result.join('\n'), true);
                } else {
                    e.reply(result, true);
                }
            }).catch((err)=>{
                e.reply(err, true);
            })
            break;
        case cfg.bind:
            if (pt.length < 2) {
                e.reply(langhelper.get('COMMAND_OVERLOAD_NOTFIND'), true);
                return;
            }
            var xbox = text.substring(cfg.bind.length + 1);
            if (NIL._vanilla.wl_exists(e.sender.qq)) {
                //let id = NIL._vanilla.get_xboxid(e.sender.qq);
                e.reply(langhelper.get('MEMBER_ALREADY_IN_WHITELIST',NIL._vanilla.get_xboxid(e.sender.qq)), true);
            } else {
                if (NIL._vanilla.xbox_exists(xbox)) {
                    e.reply(langhelper.get('XBOXID_ALREADY_BIND'), true);
                } else {
                    NIL._vanilla.wl_add(e.sender.qq, xbox);
                    if (cfg.auto_rename) e.member.setCard(xbox);
                    e.reply(langhelper.get('MEMBER_BIND_SUCCESS', xbox), true);
                    NIL.EventManager.on('onMemberBinding',{member:e.sender,xboxid:xbox});
                    if (cfg.auto_wl) {
                        RuncmdAll(`whitelist add "${xbox}"`, e.self_id);
                        e.reply(langhelper.get('ADD_WL_TO_SERVER', e.sender.qq, xbox));
                    }
                }
            }
            break;
        case cfg.unbind:
            if (NIL._vanilla.wl_exists(e.sender.qq) == false) {
                e.reply(langhelper.get('MEMBER_NOT_BIND'), true);
            } else {
                let id = NIL._vanilla.get_xboxid(e.sender.qq);
                NIL._vanilla.wl_remove(e.sender.qq);
                NIL.EventManager.on('onMemberUnBinding',{member:e.sender,xboxid:id});
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
                    NIL.EventManager.on('onMemberUnBinding',{member:{qq:element},xboxid:xbox});
                    e.reply(langhelper.get('REMOVE_WL_TO_SERVER', element, xbox));
                    RuncmdAll(`allowlist remove "${xbox}"`, e.self_id);
                    NIL._vanilla.wl_remove(element);
                }
            });
            break;
        default:
            onRegex(text, e);
            break;
    }
}


module.exports = onMain;