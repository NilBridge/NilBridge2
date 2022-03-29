const fs = require('fs');
const path = require('path');

const logger = new NIL.Logger('ModulessManager');

if (NIL.IO.exists('./modules/config.json') == false) {
    NIL.IO.WriteTo('./modules/config.json', '{}');
}

class Plugin {
    constructor(name, module) {
        this._module = module;
        this._name = name;
        this._EventIDs = [];
        this._Cmds = [];
        this._regEvents = [];
        this._logger = new NIL.Logger(this._name);
    }
    listen(evt, eventCallback) {
        logger.info(`${this._name.bgMagenta} listening ${evt}`);
        let id = NIL.EventManager.listen(this._name, evt, eventCallback);
        if (typeof id == 'undefined') {
            return false;
        } else {
            this._EventIDs.push(id);
            return true;
        }
    }
    addEvent(name){
        this._regEvents.push(name);
        NIL.EventManager.addEvent(this._name,name);
    }
    unload() {
        try{
            this._module.onStop();
        }catch(err){
            this._logger.error(err);
        }
        this._regEvents.forEach(NIL.EventManager.remEvent);
        this._Cmds.forEach(NIL.NBCMD.remUserCmd);
        this._EventIDs.forEach(NIL.EventManager.remCallback);
        var pt = path.join(__dirname, '../modules', this._name);
        delete require.cache[require.resolve(pt)];
    }
    regCMD(cmd,desc,callback){
        if(NIL.NBCMD.regUserCmd(cmd,desc,callback)){
            this._Cmds.push(cmd);
            return true;
        }
        return false;
    }
    get logger() {
        return this._logger;
    }
}

let modules = {};

function loadAll() {
    var cfg = {};
    var pls = require('../modules/config.json');
    load('vanilla');
    fs.readdirSync('./modules/').forEach(p => {
        if (p != 'config.json' && p != 'vanilla'){
            try {
                if(pls[p]==false){cfg[p] = false; return; }       
                cfg[p] = load(p);
            } catch (err) {
                logger.error(err);
            }
        }
    });
    fs.writeFileSync('./modules/config.json', JSON.stringify(cfg, null, '\t'), 'utf8');
}

function unloadAll() {
    for (let pl in modules) {
        unload(pl);
    }
}

function unload(name) {
    if (typeof modules[name] == 'undefined'){
        logger.warn(`模块 [${name}] 未找到`);
        return;
    }
    delete require.cache[require.resolve(path.join(__dirname,'../modules',name))];
    logger.info(`unloadinging ${name.green}`);
    modules[name].unload();
    delete modules[name];
    logger.info(`module ${name.green} unload`);
    return true;
}

function load(p) {
    var pt = path.join(__dirname, '../modules', p);
    if(NIL.IO.exists(pt)==false) throw new Error(`模块${p}未找到`);
    logger.info(`loading ${p}`);
    try{
        var part = require(pt);
        modules[p] = new Plugin(p.split(".")[0], part);
        part.onStart(modules[p]);
        return true;
    }catch(err){
        logger.error(err);
        return false;
    }

}

loadAll();

NIL.NBCMD.regUserCmd('module','模块管理器',(arg)=>{
    switch(arg[0]){
        case 'load':
            if(modules[arg[1]] != undefined){
                return `模块 [${arg[1]}] 已被加载`;
            }else{
                if(load(arg[1])){
                    return `模块 [${arg[1]}] 加载成功`;
                }else{
                    return `模块 [${arg[1]}] 加载失败`;
                }
            }
        case 'unload':
            if(modules[arg[1]] == undefined){
                return `模块 [${arg[1]}] 未找到`;
            }else{
                if(unload(arg[1])){
                    return `模块 [${arg[1]}] 卸载成功`;
                }else{
                    return `模块 [${arg[1]}] 卸载失败`;
                }
            }
        case 'list':
            let str = [];
            for(let i in modules){
                str.push(i);
            }
            return str;
        case 'reload':
            unloadAll();
            loadAll();
            return '重载完毕';
        case 'help':
            let str2 = [];
            str2.push('module load <module> - 加载一个模块');
            str2.push('module unload <module> - 卸载一个模块');
            str2.push('module reload - 重新加载所有模块');
            str2.push('module list - 列出所有装载的模块');
            return str2;
        default:
            return '指令参数不足，键入module help查看命令';
    }
});

NIL.modulesManager = {
    unloadAll,
    loadAll,
    load,
    unload
}