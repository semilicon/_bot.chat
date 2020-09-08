const msgUtil  = require(__path+'lib/messageUtil.lib.js');
const msgs  = require(__path+'lib/messages.lib.js');



const commands={
  help:async function(user, evt, reply){
    return reply(msgs[user.lang].help);
  },
  profile:async function(user, evt, reply){
    let info=(await DB.query('SELECT * FROM users_info WHERE btoken='+btoken+' AND id='+user.id+';')).rows[0];
    var text='';
    text+=msgs[user.lang].globalCommands.profile.your+'\n\n';
    text+=msgs[user.lang].globalCommands.profile.gender+': <b>'+((info.gender==1)?msgs[user.lang].infocollect.questions.sex.variables[0]:msgs[user.lang].infocollect.questions.sex.variables[1])+'</b>\n';
    text+=msgs[user.lang].globalCommands.profile.age+': <b>';
    switch(info.age_group){
      case 1:
        text+='13-18';
      break;
      case 2:
        text+='19-25';
      break;
      case 3:
        text+='26-36';
      break;
      case 4:
        text+='37+';
      break;
    }
    text+='</b>\n';
   
    if(!info.location||info.location==''){
      text+=msgs[user.lang].globalCommands.profile.city+': <b>';
      text+=msgs[user.lang].globalCommands.profile.indefined;
    }else if(info.location.indexOf('{')>-1){
      info.location=JSON.parse(info.location);
      text+=msgs[user.lang].globalCommands.profile.location+': <b>'+info.location.latitude+','+info.location.longitude;
    }else{
      text+=msgs[user.lang].globalCommands.profile.city+': <b>'+info.location;
    }
    text+='</b>\n';
    return reply(msgUtil.htmlMessage(text));
  },
  rules:async function(user, evt, reply){
    return reply(msgs[user.lang].rules);
  },
  pay:async function(user, evt, reply){
    if(user.banned >= Date.now()){
      let message=evt.args.join(' ').trim(' ');
      if(message.length>0){
        let items=(await DB.query('SELECT id,lang FROM users WHERE btoken='+btoken+' AND payresponse =1;')).rows;
        //let users=[];
        for(let i in items){
          try{
            await sendMessage(items[i].id,msgUtil.htmlMessage('#'+user.id+'\n<b>'+msgs[items[i].lang].globalCommands.pay.from_user_to_admin+' <a href="tg://user?id='+user.id+'">'+user.realname+'</a></b>\n\n'+message));
          }catch(err){}
          
          //users.push(items[i].id);
        }
        
      }else{
        return reply(msgs[user.lang].globalCommands.pay.pay_mistake);
      }
    }else{
      return reply(msgs[user.lang].globalCommands.pay.you_are_active);
    }
  },
  sendtoall:async function(user, evt, reply){
    if(user.rank==100){
      let message=evt.args.join(' ').trim(' ');
      let items=(await DB.query('SELECT id,lang FROM users WHERE btoken='+btoken+' AND rank<100 AND banned<'+Date.now()+';')).rows;
      //let users=[];
      for(let i in items){
        
        try{
          await sendMessage(items[i].id,msgUtil.htmlMessage('<b>'+msgs[items[i].lang].globalCommands.sendtoall.from_admin+'</b>\n\n'+message));
        }catch(err){
          
        }
        //users.push(items[i].id);
      }
      
    }
  },
  users:async function(user, evt, reply){
    if(user.rank==100){
      let items=(await DB.query('SELECT COUNT(*) FROM users WHERE btoken='+btoken+';')).rows;
      let items_new=(await DB.query('SELECT COUNT(*) FROM users WHERE btoken='+btoken+' AND date>'+(Date.now()-86400000)+';')).rows;
      let items_talk=(await DB.query('SELECT COUNT(*) FROM users WHERE btoken='+btoken+' AND status=1;')).rows;
      let items_search=(await DB.query('SELECT COUNT(*) FROM users WHERE btoken='+btoken+' AND status=2;')).rows;
      reply("Всего пользователей: <b>"+items[0].count+"</b>\nНовых (за 24 часа): <b>"+items_new[0].count+'</b>\nСейчас общаются: <b>'+items_talk[0].count+'</b>\nСейчас в поиске: <b>'+items_search[0].count+'</b>');
      
    }
  },
  
}
module.exports=commands;