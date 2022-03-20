const colors = require('colors');
const silly = require("silly-datetime");
NIL.Logger = class{
    constructor(Name){
        this.ModuleName = Name;
        this.Format = ' ';
        this.TimeFormat = 'HH:mm:ss';
    }
    info(){
        console.log(silly.format(new Date(),this.TimeFormat).cyan ,'INFO'.green,`[${this.ModuleName}]`,Object.values(arguments).join(this.Format));
    }
    error(){
        console.log(silly.format(new Date(),this.TimeFormat).cyan ,'INFO'.bgRed,`[${this.ModuleName}]`,arguments[0].stack);
    }
    warn(){
        console.log(silly.format(new Date(),this.TimeFormat).cyan ,'WARN'.bgYellow,`[${this.ModuleName}]`,Object.values(arguments).join(this.Format));
    }
    setFormat(mat){
        this.Format = mat;
    }
    setTimeFormat(fmt){
        this.TimeFormat = fmt;
    }
    setTitle(title){
        this.ModuleName = title;
    }
}