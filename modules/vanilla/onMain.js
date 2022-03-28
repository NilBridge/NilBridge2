const Lang = require('./Lang');
const path = require("path");
const langhelper = new Lang('lang.ini');
const cfg = require("./config.json");
let regex_path = path.join(__dirname,"regex.json");
if(NIL.IO.exists(regex_path)==false){
    NIL.IO.WriteTo(regex_path,JSON.stringify({cmds:{"(.*)There are (.*)\/(.*) players online:[\\r\n]+(.*)Server\\] (.*)":"有$2个玩家在线：$5","Syntax error:(.+)":"执行出错：$1"},group:[]},null,'\t'));
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

function buildString(str,reg){
    var i = 0;
    reg.forEach(s=>{
        str = str.replace(`\$${i}`,s);
        i++
    });
    return str;
}


function fomatCMD(result){
    for(let i in regexs.cmds){
        let tmp = result.match(i);
        if(tmp == null) continue;
        return buildString(regexs.cmds[i],tmp);
    }
}



function onRegex(str,e){
    for(let i in regexs.group){
        let tmp = str.match(regexs.group[i].Regex);
        if(tmp == null)continue;
        regexs.group[i].actions.forEach(item=>{
            switch(item.type){
                case 'reply':
                    e.reply(buildString(item.text,tmp));
                    break;
                case 'group':
                    NIL.bots.getBot(e.self_id).sendGroupMsg(item.id,buildString(item.text,tmp));
                    break;
                case "nbcmd":
                    NIL.NBCMD.run_cmd(buildString(item.text,tmp),(err,result)=>{
                        if(err){
                            e.reply(`执行出错：${err.stack}`,true);
                        }else{
                            if(Array.isArray(result)){
                                e.reply(result.join('\n'),true);
                            }else{
                                e.reply(result,true);
                            }
                        }
                    });
                    break;
            }
        });
    }
}

NIL.NBCMD.regUserCmd('regexreload','重载正则表达式',(arg)=>{
    regexs = JSON.parse(NIL.IO.readFrom(path.join(__dirname,"regex.json")));
    return '正则表达式重载完成';
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
                e.reply(langhelper.get('MEMBER_NOT_ADMIN'));
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
            if (NIL._vanilla.wl_exists(e.sender.qq)) {
                //let id = NIL._vanilla.get_xboxid(e.sender.qq);
                e.reply(langhelper.get('MEMBER_ALREADY_IN_WHITELIST'), true);
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
            if (NIL._vanilla.wl_exists(e.sender.qq) == false) {
                e.reply(langhelper.get('MEMBER_NOT_BIND'), true);
            } else {
                let id = NIL._vanilla.get_xboxid(e.sender.qq);
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
        default:
            onRegex(text,e);
            break;
    }
}


module.exports = onMain;