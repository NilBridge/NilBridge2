var user_cmds = new Map();
const logger = new NIL.Logger('CMDManager');

/**
 * 
 * @param {String} cmd 
 * @returns {Promise} callback 
 */
function run_cmd(cmd){
    const args = Parser(cmd);
    if(user_cmds.has(args[0])){
        return user_cmds.get(args[0]).callback(args.slice(1,args.length))
    }else{
        return new Promise((res,rej)=>{rej(`没有这样的命令：${args[0]}，键入help查看可用命令。`)})
    }
}

function regUserCmd(key,desc,callback){
    if(user_cmds.has(key))return false;
    user_cmds.set(key,{callback,desc});
    return true;
}

function remUserCmd(key) {
    if (user_cmds.has(key)) {
        user_cmds.delete(key);
        return true;
    }
    return false;
}

function Parser(raw) {
    var cmds = [];
    var isInSYH = false;
    var stringItem = "";
    for (let index = 0; index < raw.length; index++) {
        let i = raw[index];
        if (typeof i != 'string') continue;
        switch (i) {
            case '"':
                if (isInSYH) {
                    isInSYH = false;
                    cmds.push(stringItem);
                    stringItem = "";
                } else {
                    isInSYH = true;
                }
                break;
            case " ":
                if (isInSYH) {
                    stringItem += i;
                } else {
                    if (stringItem == "") continue;
                    cmds.push(stringItem);
                    stringItem = "";
                }
                break;
            default:
                stringItem += i;
                break;
        }
    }
    if (stringItem != "") cmds.push(stringItem);
    return cmds;
}

NIL.NBCMD = {
    regUserCmd,
    remUserCmd,
    run_cmd,
}

regUserCmd('help', '帮助列表', (arg) => {
    return new Promise((res,rej)=>{
        let cmds = [];
        try{
            user_cmds.forEach((v, k) => {
                cmds.push(`${k} - ${v.desc}`);
            });
            res(cmds);
        }catch(err){
            rej(err);
        }
    })
});

regUserCmd('?', '帮助列表', (arg) => {
    return new Promise((res,rej)=>{
        let cmds = [];
        try{
            user_cmds.forEach((v, k) => {
                cmds.push(`${k} - ${v.desc}`);
            });
            res(cmds);
        }catch(err){
            rej(err);
        }
    })
});



const OverLoadType = {
    Bool: 0,
    String: 1,
    Number: 2,
    Enum: 3,
    Player: 4
}

class CMDRegister {
    names = [];
    description = '';
    args = [];
    #callbacks = [];
    constructor(myName,desc){
        this.names.push(myName);
        this.description = desc;
    }
    setup(){
    }
    overload(func){
    }
}