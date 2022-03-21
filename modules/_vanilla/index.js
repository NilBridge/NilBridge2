const dbhelper = require('./leveldb');

module.exports = {
    onStart(api) {
        api.logger.info('listening onWebsocketConnected');
        api.listen('onWebsocketConnected', (data) => {
            if (data.server == 'aaa') {
                api.logger.info('ok!')
                NIL.SERVERS.get(data.server).sendCMD('list', (dt) => {
                    api.logger.info(`get callback!!`);
                    NIL.bot.sendGroupMessage(1020160254,dt);
                });
            }
        });
        api.listen('onWebsocketReceived',(dt)=>{
            api.logger.info(dt.message);
            let data = JSON.parse(dt.message);
            if(data.cause == 'server_start'){
                throw new Error('server start');
            }
        });
    }
}