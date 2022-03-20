module.exports = {
    onStart(api){
        api.listen('onServerStart',()=>{
            api.logger.info('服务已开启');
        });
    }
}