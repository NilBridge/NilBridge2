/*!
 * playerdie
 * Copyright(c) 2020-2022 NilBridge
 * MIT Licensed
 */

mc.listen("onPlayerDie", (pl,source)=>{
	if(!source)return;
	log('[Die] player <'+pl.name+'> killed by <'+source.type.replace('minecraft:','')+'>');
});