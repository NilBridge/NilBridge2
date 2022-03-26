const readline = require('readline');
const fs = require('fs');

var lang = {};

function isNullorEmpty(str){
    if(str.trim() == "") return true;
    if(str == null) return true;
    return false;
}

/**
 * 设置语言文件
 * @param k 键
 * @param v 值
 */
var set = function(k,v){
    lang[k] = v;
}

/**
 * 获取格式化的语言字符串
 */
var get = function(){
    let args = Object.values(arguments);
    let text = lang[args[0]];
    for(i=0;i<args.length-1;i++){
        text = text.replace(`{${i}}`,args[i+1]);
    }
    return text;
}
/**
 * 装载Lang文件
 */
function init(){
    const newpath = __dirname+'\\lang.ini';
    let input = fs.createReadStream(newpath,{encoding:"utf8"});
    const rl = readline.createInterface({
      input: input
    });
    rl.on('line', (line) => {
      try{
        if(line.startsWith("#")) return;
        if(!isNullorEmpty(line)){
            var l = line.split('=');
            lang[l[0]] = l[1];
        }
      }catch(err){
          console.error(err);
      }
    });
    rl.on('close',()=>{});
}

module.exports = {
    get,
    set,
    init
}
