module.exports = {
    onStart(api) {
        api.logger.info('onWebsocketConnected');
        api.listen('onWebsocketConnected', (data) => {
            if (data.server == 'aaa') {
                api.logger.info('ok!')
                NIL.SERVERS.get(data.server).sendCMD('list', (dt) => {
                    api.logger.info('>>', dt);
                });
            }
        });
    }
}