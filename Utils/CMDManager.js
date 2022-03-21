var user_cmds = new Map();
const logger = new NIL.Logger('CMDManager');

function run_cmd(cmd,callback){
    const args = Parser(cmd);
    if(user_cmds.has(args[0])){
        try{
            callback(null,user_cmds.get(args[0]).callback(args.slice(1,args.length)));
        }catch(err){
            callback(err);
        }
    }else{
        callback('没有这个命令：'+args[0]);
    }
}

function regUserCmd(key,desc,callback){
    if(user_cmds.has(key))return false;
    user_cmds.set(key,{callback,desc});
    return true;
}

function remUserCmd(key){
    if(user_cmds.has(key)){
        user_cmds.delete(key);
        return true;
    }
    return false;
}

function Parser(raw){
    var cmds = [];
    var isInSYH = false;
    var stringItem = "";
    for(let index =0; index < raw.length;index++){
        let i = raw[index];
        if(typeof i != 'string')continue;
        switch(i){
            case '"':
                if(isInSYH){
                    isInSYH = false;
                    cmds.push(stringItem);
                    stringItem = "";
                }else{
                    isInSYH = true;
                }
                break;
            case " ":
                if(isInSYH){
                    stringItem += i;
                }else{
                    if(stringItem == "")continue;
                    cmds.push(stringItem);
                    stringItem = "";
                }
                break;
            default:
                stringItem += i;
                break;
        }
    }
    if(stringItem != "")cmds.push(stringItem);
    return cmds;
}

NIL.NBCMD = {
    regUserCmd,
    remUserCmd,
    run_cmd,
}