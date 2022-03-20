const AES = require('./AES');
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

/** 
* 构建`runcmdrequest`数据包
* @param k 加密密匙
* @param iv 加密偏移量
* @param cmd 要执行的命令
* @param ifback 是否发送反馈到群聊
*/
function GetRuncmdPack(k,iv,cmd,id = GUID()){
    var p = {
        type : "pack",
        action : "runcmdrequest",
        params : {
            cmd : cmd,
            id
        }
    }
    return GetEncryptPack(k,iv,JSON.stringify(p))
}
/** 
* 构建`sendtext`数据包
* @param k 加密密匙
* @param iv 加密偏移量
* @param text 发送到服务端的文本
*/
function GetSendTextPack(k,iv,text){
    var p = {
        type : "pack",
        action : "sendtext",
        params : {
            text : text,
            id : GUID()
        }
    }
    return GetEncryptPack(k,iv,JSON.stringify(p))
}

function GetStartPack(k,iv){
    var p = {
        type : "pack",
        action : "startrequest",
        params : {
            id : GUID()
        }
    }
    return GetEncryptPack(k,iv,JSON.stringify(p))
}

function GetStopPack(k,iv){
    var p = {
        type : "pack",
        action : "stoprequest",
        params : {
            id : GUID()
        }
    }
    return GetEncryptPack(k,iv,JSON.stringify(p))
}

function GetEncryptPack(k,iv,pack){
    var p = {
        type : "encrypted",
        params : {
            mode : "aes_cbc_pck7padding",
            raw : AES.AESencrypt(k,iv,pack)
        }
    };
    return JSON.stringify(p);
}


module.exports = {
    GetEncryptPack,
    GetRuncmdPack,
    GetSendTextPack,
    GetStartPack,
    GetStopPack,
    GUID
}
