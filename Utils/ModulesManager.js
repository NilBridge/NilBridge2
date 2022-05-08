const fs = require('fs');
const path = require('path');

const logger = new NIL.Logger('ModulessManager');

let debug = false;

if (NIL.IO.exists('./modules/config.json') == false) {
    NIL.IO.WriteTo('./modules/config.json', '{}');
}

function debug_log(input) {
    if (debug)
        logger.info('debug'.grey, input);
}

// 又在copy代码啦，休息一下好不好呀
class Module {
    constructor(name, module,dir) {
        this._module = module;
        this._name = name;
        this._EventIDs = [];
        this._Cmds = [];
        this._regEvents = [];
        this._logger = new NIL.Logger(this._name);
        this._dir = dir;
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
    addEvent(name) {
        this._regEvents.push(name);
        NIL.EventManager.addEvent(this._name, name);
    }
    unload() {
        try {
            this._module.onStop();
        } catch (err) {
            this._logger.error(err);
        }
        this._regEvents.forEach(NIL.EventManager.remEvent);
        this._Cmds.forEach(NIL.NBCMD.remUserCmd);
        this._EventIDs.forEach(NIL.EventManager.remCallback);
        var pt = path.join(__dirname, '../modules', this._dir);
        delete require.cache[require.resolve(pt)];
    }
    regCMD(cmd, desc, callback) {
        if (NIL.NBCMD.regUserCmd(cmd, desc, callback)) {
            this._Cmds.push(cmd);
            return true;
        }
        return false;
    }
    get logger() {
        return this._logger;
    }
}

NIL.ModuleBase = class {
    /**
     * 模块加载时调用
     * @param {Module} api 初始API
     */
    onStart(api) {

    };
    /**
     * 模块卸载时调用
     */
    onStop() {

    };
    /**
     * 可以被`module reload`命令重载
     */
    can_be_reload = true;
    /**
     * 可以重载`require`项目
     */
    can_reload_require = true;
};
/**
 * 全部模块
 */
let modules = {};

function loadAll() {
    var cfg = {};
    var pls = JSON.parse(NIL.IO.readFrom(path.join(__dirname,'../modules/config.json')));
    load('vanilla');
    let count = 0;
    fs.readdirSync('./modules/').forEach(p => {
        if (p != 'config.json' && p != 'vanilla') {
            try {
                if (pls[p] == false) { cfg[p] = false; return; }
                cfg[p] = load(p);
                count+=1;
            } catch (err) {
                logger.error(err);
            }
        }
    });
    fs.writeFileSync('./modules/config.json', JSON.stringify(cfg, null, '\t'), 'utf8');
    logger.info(`成功载入了${count.toString().gray} 个模块`);
}

function unloadAll() {
    for (let pl in modules) {
        if(modules[pl]._module.can_be_reload){
            debug_log(`开始卸载 ${modules[pl]._name}`);
            unload(pl);
        }else{
            debug_log(`插件 ${modules[pl]._name} 设置了禁止重载，已跳过`);
        }
    }
}

function unload(name) {
    if (typeof modules[name] == 'undefined') {
        logger.warn(`模块 [${name}] 未找到`);
        return false;
    }
    let full_path = path.join(__dirname, '../modules', modules[name]._dir);
    debug_log(`找到插件 [${name}] 位于 ${full_path}`);
    let index_path = require.resolve(full_path);
    if (require.cache[index_path] != undefined) {
        try{
            debug_log(`检测到 ${name} 加载了 ${require.cache[index_path].children.length}个子模块`);
            if(modules[name]._module.can_reload_require){
                delete_require(index_path);
            }
        }catch(err){logger.error(err);};
        logger.info(`unloadinging ${name.green}`);
        modules[name].unload();
        delete modules[name];
        logger.info(`module ${name.green} unload`);
        return true;
    }
    else return false;
}

function delete_require(index_path) {
    debug_log(`开始执行卸载 ${index_path}`.green);
    if (index_path.includes('oicq\\lib\\index.js')) return;
    if (require.cache[index_path] == undefined) return;
    require.cache[index_path].children.forEach(m => {
        if (m.loaded) {
            delete_require(m.filename);
            debug_log('delete ' + m.filename);
            delete require.cache[m.filename];
        }
    });
    debug_log(`卸载 ${index_path} 完成`.yellow)
    delete require.cache[index_path];
}

function load(p) {
    var pt = path.join(__dirname, '../modules', p);
    if (NIL.IO.exists(pt) == false) throw new Error(`模块${p}未找到`);
    let jsonpath = path.join(__dirname, '../modules', p, 'package.json');
    if (NIL.IO.exists(jsonpath)) {
        let package = JSON.parse(NIL.IO.readFrom(jsonpath));
        if(modules[package.name] != undefined){
            debug_log(`模块 ${package.name.green} 已被载入，跳过加载`);
            return false;
        }
        logger.info(`loading ${package.name.green} by ${package.author.cyan}`);
        try {
            var part = require(pt);
            debug_log(`自动设置 [${p.cyan}] Logger头 为 [${package.name.green}]`);
            modules[p] = new Module(package.name, part,p);
            part.onStart(modules[p]);
            return true;
        } catch (err) {
            logger.error(err);
            return false;
        }
    } else {
        throw new Error(`无法找到 package.json 位于 ${p} 中`)
    }
}

loadAll();

NIL.NBCMD.regUserCmd('module', '模块管理器', (arg) => {
    switch (arg[0]) {
        case 'load':
            if (modules[arg[1]] != undefined) {
                return `模块 [${arg[1]}] 已被加载`;
            } else {
                if (load(arg[1])) {
                    return `模块 [${arg[1]}] 加载成功`;
                } else {
                    return `模块 [${arg[1]}] 加载失败`;
                }
            }
        case 'unload':
            if (modules[arg[1]] == undefined) {
                return `模块 [${arg[1]}] 未找到`;
            } else {
                if (unload(arg[1])) {
                    return `模块 [${arg[1]}] 卸载成功`;
                } else {
                    return `模块 [${arg[1]}] 卸载失败`;
                }
            }
        case 'list':
            let str = [];
            for (let i in modules) {
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
        case 'debug':
            switch (arg[1]) {
                case 'on':
                    debug = true;
                    return '调试模式已开启';
                default:
                    return '调试模式已关闭';
            }
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