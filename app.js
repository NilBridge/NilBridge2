global.NIL = {};
NIL.version = [1, 1, 4];
require('./Utils/Logger');
const { ErrorCode } = require('oicq');
var logger = new NIL.Logger('MAIN');
require('./Utils/CMDManager');
require('./Utils/EventManager');
require('./Utils/FileSystem');
if (NIL.IO.exists('./Data') == false) NIL.IO.createDir('./Data');
require('./Utils/ServerManager');
require('./Utils/QQManager');
require('./Utils/ModulesManager');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>> '.yellow
});

logger.info(`NilBridge2 v${NIL.version.join('.')}`);

NIL.EventManager.on('onNilBridgeStart', {});

rl.on('line', (input) => {
    NIL.NBCMD.run_cmd(input).then(result=>{
            switch (Object.prototype.toString.call(result)) {
                case '[object Array]':
                    result.forEach(element => {
                        logger.info(element);
                    });
                    break;
                case '[object String]':
                    logger.info(result);
                    break;
            }
        }).catch(err=>{
            logger.error(err);
        });
    });

NIL.NBCMD.regUserCmd('stop', '关闭NilBridge', () => {
    return new Promise((res,rej)=>{
        NIL.EventManager.on('onNilBridgeStop', {});
        NIL.bots.logoutAll();
        setTimeout(() => {
            process.exit();
        }, 1000);
        res('正在退出');
    })
})


process.on('unhandledRejection', (reason, promise) => {
    console.log(reason);
    logger.warn(`看到这条消息表明，您的参数出现了${'null'.bgRed}或者${'undefined'.bgRed}，请检查`);
    logger.warn(`error type : ${ErrorCode[reason.code]}`);
    logger.warn(`errorcode : ${reason.code},descr : ${reason.message}`);
});