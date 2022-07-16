const WebSocketClient = require('websocket').client;
 
module.exports = class{
    constructor(url,name,func){
        this.url =  url;
        this.name = name;
        this._ifAlive = false;
        this._logger = new NIL.Logger(name);
        this._reConnectTime = 5000;
        this.ws = new WebSocketClient();
        this.onmessage = func;
        this.ws.on('connect',(con)=>{
            this.con = con;
            this._ifAlive = true;
            this._logger.info('connect!');
            NIL.EventManager.on('onWebsocketConnected',{server:this.name});
            con.on('close',(code,desc)=>{
                this._ifAlive= false;
                this._logger.warn('connect lost!!');
                NIL.EventManager.on('onWebsocketClosed',{server:this.name});
                this._logger.warn(`connect lost with code ${code}(${desc}), restart connect in ${(this._reConnectTime/1000).toFixed(1)} seconds`);
                setTimeout(()=>{
                    this.ws.connect(this.url);
                },this._reConnectTime);
            });
            con.on('message',(message)=>{
                try{
                    this.onmessage(message.utf8Data);
                }catch(err){
                    this._logger.error(err);
                }
            });
            con.on('error',(err)=>{
                this._logger.error(err);
                NIL.EventManager.on('onWebsocketError',{server:this.name,err});
            });
        });
        this.ws.on('connectFailed',(err)=>{
            this._ifAlive = false;
            this._logger.error(err);
            this._logger.warn(`连接失败，将在 ${(this._reConnectTime/1000).toFixed(1)} 秒后重新连接`);
            setTimeout(()=>{
                this.ws.connect(this.url);
            },this._reConnectTime);
        });
        this.ws.connect(this.url);
    }
    get ifAlive(){
        return this._ifAlive;
    }
    setReconnectTime(time){
        if(typeof time != 'number'){
            throw new Error('Parameter error');
        }else{
            this._reConnectTime = time;
        }
    }
    send(data){
        try{
            this.con.send(data);
        }catch(err){
            this._logger.info('无法向服务器发送数据，请检查连接是否正常');
        }
    }
}