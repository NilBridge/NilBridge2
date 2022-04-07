const onMain = require('./onMain');
let bot = NIL.bots.getBot(2837945976);
bot.on('guild.message',(e)=>{
    if(e.guild_id == '41929441648861097' &&  e.channel_name== '测试房间'){
        let ex = {
            sender:{
                qq:e.sender.tiny_id,
                nick : e.sender.nickname
            },
            message:e.message,
            reply(msg){
                e.reply(msg);
            }
        }
        onMain(ex);
    }
});

module.exports = {
    onStart(){},
    onStop(){}
}