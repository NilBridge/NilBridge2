const dbhelper = require('./leveldb');

module.exports = {
    onStart(api) {
        api.logger.info('listening onWebsocketConnected');
        api.listen('onWebsocketConnected', (data) => {
            if (data.server == 'aaa') {
                api.logger.info('ok!')
                NIL.SERVERS.get(data.server).sendCMD('list', (dt) => {
                    api.logger.info(`>>callbacking...<<\n${dt}\n>>end callback<<`);
                });
            }
        });
        api.listen('onWebsocketReceived',(dt)=>{
            api.logger.info(dt.message);
        });
    }
}