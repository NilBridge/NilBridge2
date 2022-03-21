const readline = require('readline');
const fs = require('fs');

var lang = {};

/**
 * 原型：字符串格式化
 * @param args 格式化参数值
 */
var format = function(result,args) {
	for (var key in args) {
		var value = args[key];
		if (value) {
			result = result.replace("{" + key + "}", value);
		}
	}
	return result;
}

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
    if(lang[arguments[0]] == undefined) return arguments[0];
    var gs = {};
    for(i=1;i<arguments.length;i++){
        gs[(i-1).toString()] = arguments[i];
    }
    if(Object.keys(gs).length ==0) return lang[arguments[0]];
    return format(lang[arguments[0]],gs);
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
