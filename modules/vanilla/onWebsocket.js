const Lang = require('./Lang');
const langhelper = new Lang('lang.ini');
const cfg = require("./config.json");
const mobs = require('./mobs.json');
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
        if (k != ser)
            v.sendText(txt);
    });
}

let times = new Map();

function onws(dt) {
    let data = JSON.parse(dt.message);
    switch (data.cause) {
        case 'chat':
            // NIL._vanilla.bot.id  NIL._vanilla.bot.isOnline
            if(cfg.onChat&&NIL._vanilla.bot.isOnline) NIL.bots.getBot(NIL._vanilla.bot.id).sendGroupMsg(NIL._vanilla.group.chat, langhelper.get('MEMBER_CHAT', dt.server, data.params.sender, data.params.text));
            send2Other(dt.server, data.cause, data.params.sender, data.params.text);
            NIL.EventManager.on('onPlayerChat', dt);
            break;
        case 'join':
            times.set(data.params.sender, new Date().getTime());
            NIL._vanilla.add_time(data.params.sender, 0, 1);
            if(cfg.onChat&&NIL._vanilla.bot.isOnline) NIL.bots.getBot(NIL._vanilla.bot.id).sendGroupMsg(NIL._vanilla.group.chat, langhelper.get('MEMBER_JOIN', dt.server, data.params.sender, NIL._vanilla.get_player(data.params.sender).join));
            send2Other(dt.server, data.cause, data.params.sender);
            NIL.EventManager.on('onPlayerJoin', dt);
            break;
        case 'left':
            if(cfg.onChat&&NIL._vanilla.bot.isOnline) NIL.bots.getBot(NIL._vanilla.bot.id).sendGroupMsg(NIL._vanilla.group.chat, langhelper.get('MEMBER_LEFT', dt.server, data.params.sender));
            send2Other(dt.server, data.cause, data.params.sender);
            NIL.EventManager.on('onPlayerLeft', dt);
            if (times.has(data.params.sender)) {
                NIL._vanilla.add_time(data.params.sender, 1, new Date().getTime() - times.get(data.params.sender));
                times.delete(data.params.sender);
            }
            break;
        case 'start':
            if(cfg.onMain&&NIL._vanilla.bot.isOnline) NIL.bots.getBot(NIL._vanilla.bot.id).sendGroupMsg(NIL._vanilla.group.main, langhelper.get("SERVER_START", dt.server));
            NIL.EventManager.on('onServerStart', dt);
            break;
        case 'stop':
            if(cfg.onMain&&NIL._vanilla.bot.isOnline) NIL.bots.getBot(NIL._vanilla.bot.id).sendGroupMsg(NIL._vanilla.group.main, langhelper.get("SERVER_STOP", dt.server));
            NIL.EventManager.on('onServerStop', dt);
            break;
        case "accident_stop":
            if(cfg.onMain&&NIL._vanilla.bot.isOnline) NIL.bots.getBot(NIL._vanilla.bot.id).sendGroupMsg(NIL._vanilla.group.main, langhelper.get("SERVER_STOP_ACCIDENT", dt.server));
            NIL.EventManager.on('onServerAccidentStop', dt);
            break;
        case 'plantext':
            if(cfg.onMain&&NIL._vanilla.bot.isOnline) NIL.bots.getBot(NIL._vanilla.bot.id).sendGroupMsg(NIL._vanilla.group.main, data.params.text);
            break;
        case 'mobdie':
            var mob = "entity." + data.params.srctype.toLowerCase() + ".name";
            if(mobs[mob] != undefined){
                if(cfg.onChat&&NIL._vanilla.bot.isOnline) NIL.bots.getBot(NIL._vanilla.bot.id).sendGroupMsg(NIL._vanilla.group.chat,langhelper.get('MEMBER_KILL_BY_MOBS',dt.server,data.params.mobname,mobs[mob]));
            }
            break;
    }
}

module.exports = onws;
