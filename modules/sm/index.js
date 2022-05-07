const md5 = require("md5-node");
const path = require("path");
const { AESdecrypt } = require("../../Utils/AES");
let old_path = path.join(__dirname,"playerdata.xdb");
const dbkey ={k: md5("20040614").toUpperCase().substring(0,16),v:md5("20040614").toUpperCase().substring(16,32)}

function onStart(api){
    if(NIL.IO.exists(old_path)){
        api.logger.info('检测到旧版数据，开始转换');
        let new_data = {};
        let old_data = JSON.parse(AESdecrypt(dbkey.k,dbkey.v,NIL.IO.readFrom(old_path)));
        for(let member in old_data){
            let tmp = old_data[member];
            new_data[member] = {join:tmp.count.join,xboxid:tmp.xboxid,period:tmp.count.duration};
        }
        NIL.IO.delete(old_path);
        NIL.IO.WriteTo(path.join(__dirname,'playerdata.json'),JSON.stringify(new_data,null,4));
        api.logger.info('数据转换完毕');
    }    
}

module.exports = {
    onStart,
    onStop(){}
}