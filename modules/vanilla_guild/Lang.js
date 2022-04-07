const readline = require('readline');
const fs = require('fs');

class Lang{
    constructor(file){
        this.lang = {};
        this.init(file);
    }
    set(k,v){
        this.lang[k] = v;
    }
    get(){
        let args = Object.values(arguments);
        let text = this.lang[args[0]];
        if(args.length == 1)return text;
        for(let i=0;i<args.length-1;i++){
            text = text.replace(`{${i}}`,args[i+1]);
        }
        return text;
    }
    init(path){
        const newpath = __dirname+'\\'+path;
        let input = fs.createReadStream(newpath,{encoding:"utf8"});
        const rl = readline.createInterface({
          input: input
        });
        rl.on('line', (line) => {
          try{
            if(line.startsWith("#")) return;
            if(!isNullorEmpty(line)){
                var l = line.split('=');
                this.lang[l[0]] = l[1];
            }
          }catch(err){
              console.error(err);
          }
        });
        rl.on('close',()=>{});
    }
}

function isNullorEmpty(str){
    if(str.trim() == "") return true;
    if(str == null) return true;
    return false;
}

module.exports = Lang;
