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


function onStart(api){
    api.listen('onMainMessageReceived',(e)=>{
        let t = getText(e);
        if(t=='我的统计'){
            if(NIL._vanilla.wl_exists(e.sender.qq)){
                var pl = NIL._vanilla.get_player(NIL._vanilla.get_xboxid(e.sender.qq));
                var str = `玩家名: ${pl.xboxid}\n进服次数: ${pl.join}\n游玩时间: ${timeFormat(pl.period)} 小时`;
                e.reply(str);
            }else{
                e.reply('你还没有绑定白名单，无法查看统计数据');
            }
        }
    });
}

function timeFormat(dur){
    if (dur!==0){
        let hour=3600*10000;
        return (dur/hour).toFixed(2);
    }
    return 0;
}


module.exports = {
    onStart,
    onStop(){}
}
