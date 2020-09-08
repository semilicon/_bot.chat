global.config=require('../config.json');
global.btoken=Number(config.token.split(':')[0]);
const coffea= require('coffea');

const include = require(__path+'lib/include.lib.js');
const msgs  = require(__path+'lib/messages.lib.js');
//const msgUtil  = require(__path+'lib/messageUtil.lib.js');
const userLib  = require(__path+'lib/user.lib.js');
const icLib  = require(__path+'spaces/lib/infocollect.lib.js');
const chLog  = require(__path+'lib/chLog.lib.js');
const globalCommands  = require(__path+'globalCommands.js');
const time  = require(__path+'lib/time.lib.js');


global.pgToolsLib=require(__path+"lib/dbtools.postgresql.lib.js");
global.DB=pgToolsLib.newPostgresPool('bot_chat');
const startDB=async function(callback){
  (await PS(pgToolsLib,pgToolsLib.postgresConnect)(DB));
  if(typeof callback!="undefined")callback();
}

const spaces  = include.actionsTree(__path+'spaces');

const parseEvent = (rawEvent) => {
  if (typeof rawEvent === 'string') return { type: 'message', text: rawEvent }
  else return rawEvent
}

const isForwarded = (evt) =>
    evt && evt.raw && (evt.raw.forward_from || evt.raw.forward_from_chat)

global.updateMessage=async (msg,evt)=>{
  try{
    var msgNew = await networks.send({
      type: (msg.text)?'editMessageText':'editMessageReplyMarkup',
      text: msg.text,
      options:{
        chat_id:evt.user,
        message_id:evt.raw.message.message_id,
        reply_markup: msg.options.reply_markup
      }
    })
    return msgNew;
  }catch(err){
    console.log('Error:',err);
  }
};
global.sendMessage=async (user_id,evt) =>{
  evt = parseEvent(evt);
  if(typeof user_id=='object'){
    var result={};
    for(let i in user_id){
      result[user_id[i]]=await sendMessage(user_id[i],evt);
    }
    return result;
  }else{
    let promises
    if (isForwarded(evt)) {
      promises = networks.send({
        type: 'forwardMessage',
        chat: user_id,
        fromChatId: evt.chat,
        messageId: evt && evt.raw && evt.raw.message_id
      })
    } else {
      promises = networks.send({
        ...evt,
        chat: user_id,
        options: {
          ...evt.options,
          caption: evt.raw && evt.raw.caption
        }
      })
    }
    return await promises[0];
  }
}

const relay = (type) => {
  networks.on(type, async (evt, reply) => {
    var reply2=async function(msg){msg=await userLib.getKeyboard(msg,user);reply(msg);}
    
    var user = await userLib.getUser(evt.user);
    if (user && typeof msgs[user.lang]=='undefined')user.lang='en';
    if (user && user.rank < 0) return reply(msgs[user.lang].common.blacklisted)
    if (type !== 'message' || (evt && evt.text && evt.text.charAt(0) !== '/')) { // don't parse commands again
      
      if (!userLib.isActive(user)) { // make sure user is in the group chat
        return reply(msgs[user.lang].common.user_not_in_chat)
      }else if (user && user.banned >= Date.now()) {
        return reply(msgs[user.lang].common.user_banned_from_chat + ' ' + time.formatDateTime(user.banned))
      }else if(typeof spaces[user.space]!='undefined' && typeof spaces[user.space].command=="function"){
        return spaces[user.space].message(user, evt,reply2);
      }
      
    }
  })
}



var networks=null;
startDB(function(){
  networks = coffea.connect(config);
  ['message', 'audio', 'document', 'photo', 'sticker', 'video', 'voice','location'].map(relay);
  networks.on('callback_query', async (evt) => {
    var user = await userLib.getUser(evt.user);
    if (user && typeof msgs[user.lang]=='undefined')user.lang='en';
    try{
      var data = JSON.parse(evt.raw.data);
      //console.log(data);
      var actions=data.action.split('/');
      let space=actions[0];
      actions.shift();
      data.action=actions;
      if(typeof spaces[space]!='undefined' && typeof spaces[space].callback=="function"){
        return spaces[space].callback(user, data, evt);
      }else{
        console.log("Error: wrong callback space.");
      }
    }catch(err){
      console.log("Error: json error in data.",err)
    }
    
  });
  networks.on('command', async (evt, reply) => {
    var reply2=async function(msg){msg=await userLib.getKeyboard(msg,user);reply(msg);}
    chLog.command(evt);
    var user = await userLib.getUser(evt.user);
    if (user && typeof msgs[user.lang]=='undefined')user.lang='en';
    if (evt && evt.cmd) evt.cmd = evt.cmd.toLowerCase()
    if (user && user.rank < 0) return reply(msgs[user.lang].common.blacklisted)
    if (evt && evt.cmd === 'start') {
      if (userLib.isActive(user)){
        reply(msgs[user.lang].common.you_already_in_bot)
        if(user.space=='infocollect') await icLib.sendCurrentQuestion(reply2, user);
        return;
      }
      else if (!user) await userLib.addUser(evt.user,evt)
      else await userLib.rejoinUser(evt.user)

      if(!user)user = await userLib.getUser(evt.user);
      if (typeof msgs[user.lang]=='undefined')user.lang='en';
      reply(msgs[user.lang].afterStart);
      if(user.space=='infocollect') await icLib.sendCurrentQuestion(reply2, user);
      return;
    }
    
    
    if(user.space!='infocollect'&& typeof globalCommands[evt.cmd]=="function"){
      return globalCommands[evt.cmd](user, evt, reply2);
    }else if(user && user.banned >= Date.now()){
      return reply(msgs[user.lang].common.user_banned_from_chat + ' ' + time.formatDateTime(user.banned))
    }else if(typeof spaces[user.space]!='undefined' && typeof spaces[user.space].command=="function"){
      return spaces[user.space].command(user, evt, reply2);
    }

  })
  
  networks.on('message', async (evt, reply) => {
    await userLib.updateUserFromEvent(evt)
  })
});

