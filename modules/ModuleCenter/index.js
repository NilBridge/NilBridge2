const urllib = require('urllib');
const compressing = require('compressing');
const path = require('path');
const http = require('http');

const logger = new NIL.Logger('ModulesCenter');

function httpDownloadModule(url,callback) {
    let targetDir = path.join(__dirname, '..');
    if(NIL.IO.exists(targetDir)==false) NIL.IO.createDir(targetDir);
    urllib.request(url, {
        streaming: true,
        followRedirect: true,
    }).then(result => compressing.tgz.uncompress(result.res, targetDir))
    .then(callback).catch(console.error);
}

let api_data = {};

let here_modules = [];

function tick_do(){
    http.get('http://modules.nilbridge.site/info.json',(res)=>{
        let page = '';
        const { statusCode } = res;
        if(statusCode != 200){
            throw new Error(new Error(`Request Failed.Status Code: ${statusCode}`));
        }
        res.on('data',(dt)=>{
            page += dt;
        });
        res.on('end',()=>{
            try{
                api_data = JSON.parse(page);
            }catch(err){logger.error(err);}
        });
    }).on('error', (e) => {
        console.log(e);
        logger.error(`Got error: ${e.message}`);
    });
    NIL.NBCMD.run_cmd('module list',(err,list)=>{
        if(err){

        }else{
            here_modules = list;
        }
    })
}

tick_do();

let int = setInterval(tick_do,1000 * 60 * 3);

function onCMD(args){
    switch(args[0]){
        case 'install':
        case 'i':
            let moduleName = args[1];
            if(moduleName){
                if(Object.keys(api_data.modules).includes(moduleName)){
                    if(here_modules.includes(moduleName) == false){
                        httpDownloadModule(`http://modules.nilbridge.site${api_data.modules[moduleName].build.path}`,()=>{
                            logger.info(`模块 ${moduleName} 安装完成`);
                        });
                        return '正在从模块中心安装：'+moduleName+'，可能需要一段时间';
                    }else{
                        return '已经安装了这个模块！'
                    }
                }else{
                    return `模块中心没有名为 ${moduleName} 的模块`
                }
            }else{
                return '使用方法：mgm install <模块名称>';
            }
        case 'help':
            return ['mgm install <模块名称> - 从模块中心安装模块','mgm list - 查看模块中心的已有模块'];
        case 'list':
            return Object.keys(api_data.modules);
        default:
            return `没有这个命令，使用 mgm help 查看可用命令`
    }
}


class module_center extends NIL.ModuleBase{
    can_be_reload = false;
    onStart(api){
        api.regCMD('mgm','包管理工具',onCMD);
    }
    onStop(){
        clearInterval(int);
    }
}



module.exports = new module_center;