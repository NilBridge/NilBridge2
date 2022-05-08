const logger = new NIL.Logger('EventManager');

let Events = {};

function addEvent(plname,evt){
    if(Events[evt]==undefined){
        Events[evt] = [];
        return true;
    }else{
        logger.warn(`alreay has the same event : ${evt.yellow}, at plugin ${plname.red}`);
        return false;
    }
}

function remEvent(evt){
    if(Events[evt]==undefined){
        return false;
    }else{
        delete Events[evt];
        return true;
    }
}

/**
 * 
 * @param {String} evt 
 * @param {Object} parmas 
 * @returns 
 */
function on(evt,parmas){
    if(Events[evt]==undefined){
        logger.warn('no such event : '+evt);
        return;
    }
    logger.info(`calling event : ${evt.bgGreen}`);
    //console.log(parmas);
    for(var i in Events[evt]){
        let tmp = Events[evt][i];
        try{
            tmp.callback(parmas);
        }catch(err){
            logger.warn(`callback failed, at plugin : ${tmp.plugin.bgRed}, at event ${evt.bgYellow}`);
            logger.error(err);
        }
    }
}

/** 
* 生成一个GUID
* @returns GUID
*/
function GUID() {
    return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function addCallback(plname,evt,cb){
    let id = GUID();
    Events[evt].push({
        plugin:plname,
        callback:cb,
        id
    });
    return id;
}

function remCallback(id){
    for(let i in Events){
        let tmp = Events[i];
        for(let s in tmp){
            if(tmp[s].id == id){
                tmp.splice(s);
                return true;
            }
        }
    }
    return false;
}

/**
 * 
 * @param {String} plname 模块名称
 * @param {String} evt 事件名称
 * @param {function(param)} callback 事件回调
 * @returns 
 */
function listen(plname,evt,callback){
    if(Events[evt]==undefined){
        logger.warn(`no such event : ${evt.bgRed}, ${plname.bgYellow} listen failed`);
        return;
    }
    return addCallback(plname,evt,callback);
}

addEvent('MAIN','onNilBridgeStart');
addEvent('MAIN','onNilBridgeStop');

NIL.EventManager = {
    listen,
    on,
    addEvent,
    remEvent,
    remCallback
}
