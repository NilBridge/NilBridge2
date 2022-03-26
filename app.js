global.NIL = {};
NIL.version = [1,0,0];
require('./Utils/Logger');
var logger = new NIL.Logger('Main');
require('./Utils/CMDManager');
require('./Utils/EventManager');
require('./Utils/FileSystem');
if(NIL.IO.exists('./Data')==false)NIL.IO.createDir('./Data');
require('./Utils/ServerManager');
require('./Utils/QQManager');
require('./Utils/ModulesManager');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

logger.info(`NilBridge2 v${NIL.version.join('.')}`);

NIL.EventManager.on('onNilBridgeStart',{});
rl.on('line',(input)=>{
    NIL.NBCMD.run_cmd(input,(err)=>{
        if(err){
            logger.warn(err);
        }
    });
});

NIL.NBCMD.regUserCmd('stop','关闭NilBridge',()=>{
    logger.info('正在退出');
    NIL.EventManager.on('onNilBridgeStop',{});
    NIL.bots.logoutAll();
    process.exit();
})

process.on('unhandledRejection', (reason, promise) => {
	console.log(reason,promise);
});