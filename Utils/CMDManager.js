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
    let cmds = [];
    user_cmds.forEach((v, k) => {
        cmds.push(`${k} - ${v.desc}`);
    });
    return cmds;
});

regUserCmd('?', '帮助列表', (arg) => {
    let cmds = [];
    user_cmds.forEach((v, k) => {
        cmds.push(`${k} - ${v.desc}`);
    });
    return cmds;
});


const OverLoadType = {
    Bool: 0,
    String: 1,
    Number: 2,
    Enum: 3,
    Player: 4
}

class CMDRegister {
    constructor(name, desc, permission = 0) {
        this._Enums = {};
        this._Overloads = {};
        this._cmds = [];
        this._name = name;
        this._desc = desc;
        this._permission = permission;
    }
    /**
     * 设置参数列表
     * @param {String} _name 参数代号
     * @param {Array} _enum 指令参数列表 
     */
    setEnum(_name, _enum, nesscary = true) {
        if (!Array.isArray(_enum)) throw new Error('指令参数必须为数组类型');
        this._Enums[_name] = _enum;
        if (nesscary) {
            this.mandatory(_name, 3);
        } else {
            this.optional(_name, 3);
        }
    }
    /**
     * 添加一个必选参数
     * @param {String} _name 指令代号
     * @param {Number} type 指令类型
     */
    mandatory(_name, type) {
        this._Overloads[_name] = { type, nesscary: true };
    }
    optional(_name, type) {
        this._Overloads[_name] = { type, nesscary: false };
    }
    overload(_aegs) {
        if (!Array.isArray(_aegs)) throw new Error('指令参数必须为数组类型');
        let tmp = [];
        _aegs.forEach(cmd => {
            if (this._Overloads[cmd] == undefined) {
                throw new Error("参数使用前必须注册");
            } else {
                tmp.push({
                    type: this._Overloads[cmd].type,
                    name: cmd,
                    overloads: this._Enums[cmd],
                    nesscary: this._Overloads[cmd]
                });
            }
        });
        this._cmds.push(tmp);
    }
    setCallback(callback) {
        this._callback = callback;
    }
    setup() {
        user_cmds.set(this._name, {
            desc: this._desc,
            permission: this._permission,
            callbacks: this._cmds,
            Callback: this._callback
        });
    }
    delete(){
        remUserCmd(this._name);
    }
}
