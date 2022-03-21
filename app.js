global.NIL = {};
require('./Utils/Logger');
var logger = new NIL.Logger('Main');
require('./Utils/EventManager');
require('./Utils/FileSystem');
if(NIL.IO.exists('./Data')==false)NIL.IO.createDir('./Data');
require('./Utils/ServerManager');
require('./Utils/QQManager');
require('./Utils/ModulesManager');
NIL.EventManager.on('onServerStart');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})


rl.on('line',(input)=>{
    switch(input){
        case 'stop':
            NIL.bot.logout();
            process.exit();
        case 'plunload':
            NIL.modulesManager.unloadAll();
            //NIL.modulesManager.loadAll();
            break;
            case 'plload':
            NIL.modulesManager.loadAll();
            break;
    }
});
