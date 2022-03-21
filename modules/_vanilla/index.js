const dbhelper = require('./leveldb');
const path = require('path');
function checkFile(file,text){
    if(NIL.IO.exists(path.join(__dirname,file))==false){
        NIL.IO.WriteTo(path.join(__dirname,file),text);
    }
}

checkFile('config.json',JSON.stringify({
    bind:'/bind',
    cmd:'/cmd',
    unbind:'/unbind',
    add_wl:'wl+',
    rem_wl:'wl-',
    check:'查服',
    auto_wl:false,
    auto_rename:true,
    auto_remove:true,
    group:{
        main:114514,
        chat:114514
    }
},null,'\t'));

const cfg = JSON.parse(NIL.IO.readFrom(path.join(__dirname,'config.json')));

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
        api.listen('onWebsocketReceived', (dt) => {
            let data = JSON.parse(dt.message);
            switch(data.cause){
                case 'join':
                    break;
                case 'left':
                    break;
                case 'server_start':
                    break;
                case 'server_stop':
                    break;
            }
        });
        api.listen('onGroupMessageReceived',(e)=>{
            switch(e.group.id){
                case cfg.group.main:
                    NIL.EventManager.on('onMainMessageReceived',e);
                    break;
                case cfg.group.chat:
                    NIL.EventManager.on('onChatMessageReceived',e);
                    break;
            }
        });
    },
    onStop(){

    }
}
function getText(e){
    var rt = '';
    for(i in e.message){
        switch(e.message[i].type){
            case"text":
                rt+= e.message[i].text;
                break;
        }
    }
    return rt;
}

function group_main(e){
    let text = getText(e.message);
    switch(pt[0]){
        case "查服":

            break;
        case "/cmd":
            if(NIL.CONFIG.ADMIN.indexOf(e.sender.user_id)==-1){
                e.reply(NIL.LANG.get('MEMBER_NOT_ADMIN'));
                return;
            }
            if(Object.keys(NIL.SERVERS).length == 1){
                for(i in NIL.SERVERS){
                    NIL.SERVERS[i].sendCMD(e.raw_message.substr(5));
                    e.reply(NIL.LANG.get("COMMAND_SENDTO_SERVER",e.raw_message.substr(5),i),true);
                }
            }
            else{
                if(pt.length > 2){
                    if(NIL.SERVERS[pt[1]] == undefined){
                        e.reply(`没有名为${pt[1]}的服务器`,true);
                        return;
                    }
                    NIL.SERVERS[pt[1]].sendCMD(e.raw_message.substr(`/cmd ${pt[1]} `.length));
                    e.reply(NIL.LANG.get("COMMAND_SENDTO_SERVER",e.raw_message.substr(`/cmd ${pt[1]} `.length),pt[1]),true);
                }else{
                    e.reply(NIL.LANG.get('COMMAND_OVERLOAD_NOTFIND'),true);
                }
            }
            break;
        case "/nbcmd":
            if(NIL.CONFIG.ADMIN.indexOf(e.sender.user_id)==-1){
                e.reply(NIL.LANG.get('MEMBER_NOT_ADMIN'));
                return;
            }
            let cmd = e.raw_message.substr(7);
            NIL.NBCMD.run_cmd(cmd,(err,cb)=>{
                if(err==null){
                    e.reply(cb,true);
                }else{
                    e.reply(err,true);
                }
            });
            break;
        case "/bind":
            if(pt.length<2){
                e.reply(NIL.LANG.get('COMMAND_OVERLOAD_NOTFIND'),true);
                return;
            }
            if(NIL.XDB.wl_exsits(e.sender.user_id)){
                e.reply(NIL.LANG.get('MEMBER_ALREADY_IN_WHITELIST',NIL.XDB.get_xboxid(e.sender.user_id)),true);
                break;
            }
            var xbox = e.raw_message.substr(6);
            if(NIL.XDB.xboxid_exsits(xbox)){
                e.reply(NIL.LANG.get('XBOXID_ALREADY_BIND'),true);
                break;
            }
            NIL.XDB.wl_add(e.sender.user_id,xbox);
            if(NIL.CONFIG.AUTO_RENAME_AFTER_BIND) e.member.setCard(xbox);
            e.reply(NIL.LANG.get('MEMBER_BIND_SUCCESS',xbox),true);
            break;
        case "/unbind":
            if(NIL.XDB.wl_exsits(e.sender.user_id)==false){
                e.reply(NIL.LANG.get('MEMBER_NOT_BIND'),true);
                break;
            }
            var xbox = NIL.XDB.get_xboxid(e.sender.user_id);
            //console.log(xbox);
            NIL.XDB.wl_remove(e.sender.user_id);
            e.reply(NIL.LANG.get('MEMBER_UNBIND'),true);
            helper.RunCMDAll(`whitelist remove "${xbox}"`);
            e.reply(NIL.LANG.get('REMOVE_WL_TO_SERVER',e.sender.user_id,xbox));
            break;
        case "wl+":
            if(NIL.CONFIG.ADMIN.indexOf(e.sender.user_id)==-1){
                e.reply(NIL.LANG.get('MEMBER_NOT_ADMIN'));
                return;
            }
            var at = NIL.TOOL.getAt(e);
            if(e.length!=0){
                at.forEach(element => {
                    if(NIL.XDB.wl_exsits(element)){
                        var xbox = NIL.XDB.get_xboxid(element);
                        helper.RunCMDAll(`whitelist add "${xbox}"`);
                        e.reply(NIL.LANG.get('ADD_WL_TO_SERVER',element,xbox));
                    }else{
                        e.reply(NIL.LANG.get('MEMBER_NOT_BIND_WHEN_REMOVE',element));
                    }

                });
            }
            break;
        case "wl-":
            if(NIL.CONFIG.ADMIN.indexOf(e.sender.user_id)==-1){
                e.reply(NIL.LANG.get('MEMBER_NOT_ADMIN'));
                return;
            }
            var at = NIL.TOOL.getAt(e);
            if(e.length!=0){
                at.forEach(element => {
                    if(!NIL.XDB.wl_exsits(element)){
                        e.reply(NIL.LANG.get('MEMBER_NOT_BIND_WHEN_REMOVE',element));
                    }else{
                        e.reply(NIL.LANG.get('REMOVE_WL_TO_SERVER',element,NIL.XDB.get_xboxid(element)));
                        helper.RunCMDAll(`whitelist remove "${NIL.XDB.get_xboxid(element)}"`);
                        NIL.XDB.wl_remove(element);
                    }
                });
            }
            break;
    }
}
