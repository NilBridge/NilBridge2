const client = require('./websocket');
const md5 = require("md5-node");
const helper = require('./PackHelper');
const { AESdecrypt } = require('./AES');
const logger = new NIL.Logger('ServerManager');
NIL.EventManager.addEvent('MAIN','onWebsocketConnected');
NIL.EventManager.addEvent('MAIN','onWebsocketClosed');
NIL.EventManager.addEvent('MAIN','onWebsocketReceived');
NIL.EventManager.addEvent('MAIN','onWebsocketError');

if(NIL.IO.exists('./Data/servers.json')==false){
    NIL.IO.WriteTo('./Data/servers.json',JSON.stringify({生存服务器:{url:"ws://127.0.0.1:8123/mc",pwd:'password'}},null,'\t'));
}

let cfg = JSON.parse(NIL.IO.readFrom('./Data/servers.json'));

NIL.SERVERS = new Map();

/** 
* 生成一个GUID
* @returns GUID
*/
function GUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

let callbacks = {};

class SERVER {
    constructor(url,name,pwd){
        this._k = md5(pwd).substring(0,16).toUpperCase();
        this._iv = md5(pwd).substring(16,32).toUpperCase();
        this._url = url;
        this._name = name;
        this._ws = new client(url,name,onmessage(name,this._k,this._iv));
    }
    get _ifConnect(){
        return this._ws.ifAlive;
    }
    get k(){
        return this._k;
    }
    get iv(){
        return this._iv;
    }
    sendCMD(cmd,callback){
        let id = GUID();
        this._ws.send(helper.GetRuncmdPack(this._k,this._iv,cmd,id));
        callbacks[id] = callback;
    }
    sendStart(){
        this._ws.send(helper.GetStartPack(this._k,this._iv))
    }
    sendStop(){
        this._ws.send(helper.GetStopPack(this._k,this._iv));
    }
    sendText(text){
        this._ws.send(helper.GetSendTextPack(this._k,this._iv,text));
    }
    sendCustomPack(pack){
        this._ws.send(helper.GetEncryptPack(this._k,this._iv,pack));
    }
}

function onmessage(name,k,iv){
    return (data)=>{
        NIL.EventManager.on('onWebsocketReceived',{server:name,message:AESdecrypt(k,iv,JSON.parse(data).params.raw)});
    }
}

NIL.EventManager.listen('MAIN','onWebsocketReceived',(dt)=>{
    let data = JSON.parse(dt.message);
    if(data.params.id == undefined)return;
    if(callbacks[data.params.id] != undefined){
        callbacks[data.params.id](data.params.result);
        delete callbacks[data.params.id];
    }
});

for(let ser in cfg){
    logger.info('loading server ->',ser);
    NIL.SERVERS.set(ser,new SERVER(cfg[ser].url,ser,cfg[ser].pwd));
}