global.NIL = {};
NIL.version = [1, 0, 1];
require('./Utils/Logger');
var logger = new NIL.Logger('Main');
require('./Utils/CMDManager');
require('./Utils/EventManager');
require('./Utils/FileSystem');
if (NIL.IO.exists('./Data') == false) NIL.IO.createDir('./Data');
require('./Utils/ServerManager');
require('./Utils/QQManager');
require('./Utils/ModulesManager');
//require('./Utils/PanelManager');
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
            logger.error(err);
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
    console.log(reason, promise);
});