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
        NIL.EventManager.addEvent(this._name,name);
    }
    unload() {
        this._EventIDs.forEach(NIL.EventManager.remCallback);
        var pt = path.join(__dirname, '../modules', this._name);
        delete require.cache[require.resolve(pt)];
    }
    get logger() {
        return this._logger;
    }
}

let modules = {};

function loadAll() {
    var cfg = {};
    var pls = JSON.parse(fs.readFileSync('./modules/config.json', 'utf8'));
    fs.readdirSync('./modules/').forEach(p => {
        if (p != 'config.json'){
            try {
                if(pls[p]==false)return;
                load(p);
                cfg[p] = true;
            } catch (err) {
                logger.error(err);
            }
        }
    });
    fs.writeFileSync('./modules/config.json', JSON.stringify(cfg, null, '\t'), 'utf8');
}

function unloadAll() {
    for (let pl in modules) {
        modules[pl].unload();
    }
}

function unload(name) {
    if (modules[name] == undefined) return false;
    modules[name].unload();
    return true;
}

function load(p) {
    var pt = path.join(__dirname, '../modules', p);
    logger.info(`loading ${p}`);
    var part = require(pt);
    modules[p] = new Plugin(p.split(".")[0], part);
    part.onStart(modules[p]);
}

loadAll();

NIL.modulesManager = {
    unloadAll,
    loadAll,
    load,
    unload
}