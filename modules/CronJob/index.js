const CronJob=require('cron').CronJob;
const SELF_ID=NIL._vanilla.cfg.self_id;
const MAIN_GROUP_ID=NIL._vanilla.cfg.group.main;
const DIR_PATH='./Data/CronJob'
const CFG_PATH='./Data/CronJob/data.json';
const TIME_ZONE='Asia/Hong_Kong';
const ENCODE="utf8";
const LOGGER = new NIL.Logger("CronJob");
const CONFIG= {
    "test":{
        "enable":false,//是否启用该定时任务
        "severName":"测试",//对应服务器名字
        "cronEx":"0 * * * * *",//cron表达式
        "chatJob":{
            "enable":true,
            "chatMsg":"测试",//发送的聊天信息
        },
        "cmdJob":{//对服务器发送指令
            "enable":false,
            "cmd":""
        },
        "serverJob":{//服务器开关操作
            "enable":false,
            "type":1//-1 关服,1 开服
        },
    },
    "test1":{
        "enable":false,//是否启用该定时任务
        "severName":"测试",//对应服务器名字
        "cronEx":"0 * * * * *",//cron表达式
        "chatJob":{
            "enable":true,
            "chatMsg":"测试",//发送的聊天信息
        },
        "cmdJob":{//对服务器发送指令
            "enable":false,
            "cmd":""
        },
        "serverJob":{//服务器开关操作
            "enable":false,
            "type":1//-1 关服,1 开服
        },
    }
}

let cronJobList=[];
let config=null;


function main(){//启动函数
    try{
        LOGGER.info("开始加载定时任务...");
        init();
        configFileParsing();
        assignJobByConfig();
    }catch (err){
        LOGGER.error("定时任务加载失败:"+err);
    }
}

/**
 * @description IO操作
 */

function init(){//初始化配置文件
    if (!NIL.IO.exists(DIR_PATH))
        NIL.IO.createDir(DIR_PATH);
    if (!NIL.IO.exists(CFG_PATH))
        NIL.IO.WriteTo(CFG_PATH,JSON.stringify(CONFIG));
}

function configFileParsing(){
    let buffer=NIL.IO.readFrom(CFG_PATH,ENCODE);
    if (!buffer)return;
    config=JSON.parse(buffer);
}


/**
 * @description 定时任务分配
 */

function assignJobByConfig(){//根据config分配定时任务
    if (!config)return;
    let jobs = Object.keys(config);
    jobs.forEach(jobName=>{
        let job = config[jobName];
        if (!job.enable)return;
        createCronJob(//创建任务
            jobName,
            job.cronEx,
            job.severName,
            job.chatJob,
            job.cmdJob,
            job.serverJob
        );
    });
    LOGGER.info(`读取到${jobs.length}个,成功加载${cronJobList.length}个至任务列表中`);
}

function createCronJob(jobName,cronEx,serverName,chatJob,cmdJob,serverJob) {//创建定时任务
    if (isConflictJobs(chatJob,cmdJob,serverJob))return;
    let job = new CronJob(cronEx, () => {//创建新的定时任务
        LOGGER.info(`定时任务 ${jobName} 已触发, 正在执行回调...`);
        executeChatJob(chatJob);
        executeCmdJob(serverName,cmdJob);
        executeServerJob(serverName,serverJob);
    }, null, false, TIME_ZONE);
    cronJobList.push(job);//添加到任务列表中
    LOGGER.info(`定时任务 ${jobName} 分配成功,已加载至任务列表!`);
}

function startAllJobs(){//将所有添加至任务列表中的任务开启
    cronJobList.forEach(cronJob=>{
        cronJob.start();
    });
    LOGGER.info(`成功启动 ${cronJobList.length} 个 定时任务`);
}

/**
 * @description 底层操作封装
 */

function isConflictJobs(chatJob,cmdJob,serverJob){//判断任务之间是否相互冲突
    return cmdJob.enable && serverJob.enable;//命令任务与服务器任务不能同时执行
}

function executeChatJob(chatJob){//执行聊天任务
    if (!chatJob.enable)return;
    LOGGER.info(`正在向主群 发送消息 ${chatJob.chatMsg}`);
    sendMsgToMainGroup(chatJob.chatMsg);
}

function executeCmdJob(serverName,cmdJob){//执行命令任务
    if (!cmdJob.enable)return;
    LOGGER.info(`正在向服务器 ${serverName} 发送命令 ${cmdJob.cmd}`);
    sendCmdToServer(serverName,cmdJob.cmd);
}

function executeServerJob(serverName,serverJob){//执行服务器任务
    if (!serverJob.enable)return;
    LOGGER.info(`正在向服务器 ${serverName} 发送操作 ${serverJob.type>0?'开启': '关闭' }`);
    sendOperationToServer(serverName,serverJob.type);
}

function sendMsgToMainGroup(msg){//向主群发送消息
    NIL.bots.getBot(SELF_ID).sendGroupMsg(MAIN_GROUP_ID,msg);
}

function sendCmdToServer(serverName,cmd){//向服务器发送一条命令并将运行结果发送主群
    NIL.SERVERS.get(serverName).sendCMD(cmd,sendMsgToMainGroup);
}

function sendOperationToServer(serverName,type){//向服务器发送开关服操作
    let server=NIL.SERVERS.get(serverName);
    type>0?server.sendStart():server.sendStop();
}

/**
 * @description 初始化数据并执行
 */

main();
module.exports = {
    onStart(api){api.listen('onRotboOnline',startAllJobs)},//机器人登陆成功后才会开启任务
    onStop(){}
}