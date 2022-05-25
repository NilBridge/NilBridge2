const version = '1.1.2';

function onStart(api) {
    api.regCMD("backup",'备份', (arg) => {
        return new Promise((res,rej)=>{
            if (NIL.SERVERS.has(arg[0]) == false) {
                rej(`没有名为${arg[0]}的服务器`);
            }
            backup_item(arg[0]);
            res('备份已执行');
        })
    });
    api.logger.info(`BackupHelper存档备份助手-已装载  当前版本${version}`);
    api.logger.info('作者：Lition   发布平台：MineBBS/Github');
    api.logger.info('欲联系作者可前往MineBBS论坛或Github');
}


function backup_item(ser) {
    let pack = getBackupPack();
    NIL.SERVERS.get(ser).sendCustomPack(pack);
}

function getBackupPack() {
    return JSON.stringify({
        action: 'backuprequest',
        type: 'pack',
        params: {}
    });
}

class backuphelper extends NIL.ModuleBase{
    onStart = onStart
}

module.exports = new backuphelper;