module.exports = {
    onStart(api){
        api.listen('onServerStart',()=>{
            api.logger.info('ok');
        });
    }
}