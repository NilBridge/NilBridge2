# NilBridge2

## 什么是NilBridge？

 - NilBridge是与基岩版服务端Bedrock Dedicated Server与QQ通讯的基础框架，拥有海量十几个API接口。

 - 通过使用js等语言编写插件，开发者可以方便地对NilBridge进行功能拓展与特性定制，容易上手，并且具有极高的灵活性.

 - 对于用户来说，NilBridge可以做到简易上手，开箱即用，对于新手用户非常友好。


## NilBridge的优点

   -  基于Node.js，全平台兼容
   - 全开源代码
   - 性能优化极佳
   - 文档完善
   - 支持插件拓展
   - 开箱即用

## 示例
``` js
NIL.SERVERS.get('生存服务器').sendCMD('list',(result)=>{
    NIL.bots.getBot(114541).sendGroupMsg(11451419,result);
});
```

这个例子获取了名为`生存服务器`的服务器，并且发送了一条`list`指令

在处理指令回调时，获取了QQ号为`114514`的机器人，并且发送指令返回到群`11451419`

``` js

function onStart(api){
    api.logger.info('我被加载啦！');
    api.listen('onMainMessageReceived',(e)=>{
        e.reply(`收到${e.sender.qq}(${e.sender.nick})的消息！`);
    });
}

function onStop(){
    //做些什么
}

module.exports = {
    onStart,
    onStop
}

```


这是一个最基础的插件例子

在加载时注册了`onMainMessageReceived`监听器，监听主群消息

并在收到消息后向群聊中回复。

在`modules`文件夹新建一个文件夹，取你插件的名字，然后把这个写入`index.js`中

这就是一个最简单的插件