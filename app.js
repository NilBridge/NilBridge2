global.NIL = {};
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
})


rl.on('line',(input)=>{
    switch(input){
        case 'stop':
            NIL.bots.logoutAll();
            process.exit();
        default:
            NIL.NBCMD.run_cmd(input,(err,cb)=>{
                if(err){
                    logger.warn(err);
                }
            });
            break;
    }
});

process.on('unhandledRejection', (reason, promise) => {
	console.log(reason);
    console.log(promise);
});