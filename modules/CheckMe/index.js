function timeFormat(dur){
    if (dur!==0){
        let hour=3600*1000;
        return (dur/hour).toFixed(2);
    }
    return 0;
}

class checkme extends NIL.ModuleBase{
    onStart(api){  
        api.logger.info('加载成功');
        api.listen('onMainMessageReceived',(e)=>{
            if(e.raw_message=='我的统计'){
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
    onStop(){

    }
}

module.exports = new checkme;
