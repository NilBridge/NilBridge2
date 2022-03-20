const fs = require('fs');
const path = require('path');

const logger = new NIL.Logger('PluginsManager');

var cfg = {};

if(NIL.IO.exists('./plugins/config.json')==false){
    NIL.IO.WriteTo('./plugins/config.json','{}');
}

var pls = JSON.parse(fs.readFileSync('./plugins/config.json','utf8'));

class Plugin{
    constructor(name){
        this._name = name;
        this._EventIDs = [];
        this._logger = new NIL.Logger(this._name);
    }
    listen(evt,eventCallback){
        console.log(`listening ${evt}`);
        let id = NIL.EventManager.listen(this._name,evt,eventCallback);
        if(typeof id == 'undefined'){
            return false;
        }else{  
            this._EventIDs.push(id);
            return true;
        }
    }
    unload(){
        this._EventIDs.forEach(NIL.EventManager.remCallback);
        var pt = path.join(__dirname,'../plugins',this._name);
        delete require.cache[require.resolve(pt)];
    }
    get logger(){
        return this._logger;
    }
}

let plugins = {};

function loadAll(){
    fs.readdirSync('./plugins/').forEach(p => {
        try {
            var pt = path.join(__dirname, '../plugins', p);
            if ( p != 'config.json') {
                if (pls[p] == false) { cfg[p] = false; return };
                logger.info(`loading ${p}`);
                var part = require(pt);
                plugins[p] = new Plugin(p.split(".")[0]);
                part.onStart(plugins[p]);
                cfg[p] = true
            }
        } catch (err) {
           logger.error(err);
        }
    });
    fs.writeFileSync('./plugins/config.json', JSON.stringify(cfg, null, '\t'), 'utf8');
}

loadAll();

function unloadAll(){
    for(let pl in plugins){
        plugins[pl].unload();
    }
}

NIL.PluginsManager = {
    unloadAll,
    loadAll
}