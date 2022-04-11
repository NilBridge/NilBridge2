global.NIL = {};
NIL.version = [1, 0, 2];
require('./Utils/Logger');
const http = require('http');
const { ErrorCode } = require('oicq');
var logger = new NIL.Logger('Main');
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
    output: process.stdout
});

logger.info(`NilBridge2 v${NIL.version.join('.')}`);

NIL.EventManager.on('onNilBridgeStart', {});

rl.on('line', (input) => {
    NIL.NBCMD.run_cmd(input, (err, callback) => {
        if (err) {
            logger.error(err.message);
        } else {
            switch (Object.prototype.toString.call(callback)) {
                case '[object Array]':
                    callback.forEach(element => {
                        logger.info(element);
                    });
                    break;
                case '[object String]':
                    logger.info(callback);
                    break;
            }
        }
    });
});

NIL.NBCMD.regUserCmd('stop', '关闭NilBridge', () => {
    NIL.EventManager.on('onNilBridgeStop', {});
    NIL.bots.logoutAll();
    setTimeout(() => {
        process.exit();
    }, 1000);
    return '正在退出';
})


process.on('unhandledRejection', (reason, promise) => {
    logger.warn(`看到这条消息表明，您的参数出现了${'null'.bgRed}或者${'undefined'.bgRed}，请检查`);
    logger.warn(`error type :${ErrorCode[reason.code].bgYellow}`);
    logger.warn(`errorcode : ${reason.code.toString().yellow},descr : ${reason.message.bgRed}`);
});

