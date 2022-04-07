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
                at.push(e.message[i].id);
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

function RuncmdAll(cmd, reply) {
    NIL.SERVERS.forEach((s, k) => {
        s.sendCMD(cmd, (dt) => {reply(`${k}\n${fomatCMD(dt)}`) });
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
    return result;
}

let playerdata = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'playerdata.json')))

function save_playerdata() {
    NIL.IO.WriteTo(path.join(__dirname, 'playerdata.json'), JSON.stringify(playerdata, null, '\t'));
}

function wl_remove(qq) {
    delete playerdata[qq];
    save_playerdata();
}

function isAdmin(qq) {
    return cfg.admins.indexOf(qq) != -1;
}

function get_xboxid(qq) {
    return playerdata[qq].xboxid;
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
    save_playerdata();
}


function onRegex(str,e){
    for(let i in regexs.group){
        if(isAdmin(e.sender.qq)==false && regexs.group[i].permission ==1)continue;
        let tmp = str.match(regexs.group[i].Regex);
        if(tmp == null)continue;
        regexs.group[i].actions.forEach(item=>{
            switch(item.type){
                case 'reply':
                    e.reply(buildString(item.text,tmp));
                    break;
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
            if (isAdmin(e.sender.qq) == false) {
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
            if (isAdmin(e.sender.qq) == false) {
                e.reply(langhelper.get('MEMBER_NOT_ADMIN'), true);
                return;
            }
            let cmd = text.substring(cfg.nbcmd.length + 1);
            NIL.NBCMD.run_cmd(cmd, (err, result) => {
                if (err) {
                    e.reply(err.message, true);
                }else{
                    if(Array.isArray(result)){
                        e.reply(result.join('\n'),true);
                    }else{
                        e.reply(result,true);
                    }
                }
            });
            break;
        case cfg.bind:
            if (pt.length < 2) {
                e.reply(langhelper.get('COMMAND_OVERLOAD_NOTFIND'), true);
                return;
            }
            var xbox = text.substring(cfg.bind.length + 1);
            if (wl_exists(e.sender.qq)) {
                //let id = get_xboxid(e.sender.qq);
                e.reply(langhelper.get('MEMBER_ALREADY_IN_WHITELIST',get_xboxid(e.sender.qq)), true);
            } else {
                if (xbox_exists(xbox)) {
                    e.reply(langhelper.get('XBOXID_ALREADY_BIND'), true);
                } else {
                    wl_add(e.sender.qq, xbox);
                    if (cfg.auto_rename) e.member.setCard(xbox);
                    e.reply(langhelper.get('MEMBER_BIND_SUCCESS', xbox), true);
                    if (cfg.auto_wl) {
                        RuncmdAll(`whitelist add "${xbox}"`, e.reply);
                        e.reply(langhelper.get('ADD_WL_TO_SERVER', e.sender.qq, xbox));
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
                RuncmdAll(`whitelist remove "${id}"`, e.reply);
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
                        RuncmdAll(`allowlist add "${xbox}"`, e.reply);
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
                    RuncmdAll(`allowlist remove "${xbox}"`, e.reply);
                    wl_remove(element);
                }
            });
            break;
        default:
            onRegex(text,e);
            break;
    }
}

module.exports = onMain;