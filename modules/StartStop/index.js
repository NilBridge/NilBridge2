function onStart(api){
  api.regCMD('stop_server','开启服务器',(args)=>{
    if(args.length == 0){
      return '参数不足，格式：start_server <服务器名称>';
    }else{
      if(NIL.SERVERS.has(args[0])){
        NIL.SERVERS.get(args[0]).sendStop();
        return `服务器关闭请求已发送到[${args[0]}]`;
      }else{
        return `没有名为${args[0]}的服务器`;
      }
    }
  });
  api.regCMD('start_server','开启服务器',(args)=>{
    if(args.length == 0){
      return '参数不足，格式：start_server <服务器名称>';
    }else{
      if(NIL.SERVERS.has(args[0])){
        NIL.SERVERS.get(args[0]).sendStart();
        return `服务器开启请求已发送到[${args[0]}]`;
      }else{
        return `没有名为${args[0]}的服务器`;
      }
    }
  });
}

module.exports = {
  onStart,
  onStop(){}
}