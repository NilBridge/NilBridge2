function onStart(api){
  api.regCMD('stop_server','关闭服务器',(args)=>{
    return new Promise((res,rej)=>{
      if(args.length == 0){
        res('参数不足，格式：stop_server <服务器名称>');
      }else{
        if(NIL.SERVERS.has(args[0])){
          NIL.SERVERS.get(args[0]).sendStop();
          res(`服务器关闭请求已发送到[${args[0]}]`);
        }else{
          res(`没有名为${args[0]}的服务器`);
        }
      }
    })
  });
  api.regCMD('start_server','开启服务器',(args)=>{
    return new Promise((res,rej)=>{
      if(args.length == 0){
        res('参数不足，格式：start_server <服务器名称>');
      }else{
        if(NIL.SERVERS.has(args[0])){
          NIL.SERVERS.get(args[0]).sendStart();
          res(`服务器开启请求已发送到[${args[0]}]`);
        }else{
          res(`没有名为${args[0]}的服务器`);
        }
      }
    })

  });
}


class StartStop extends NIL.ModuleBase{
  onStart = onStart
}

module.exports = new StartStop;