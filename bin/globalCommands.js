const msgUtil  = require(__path+'lib/messageUtil.lib.js');
const msgs  = require(__path+'lib/messages.lib.js');



const commands={
  help:async function(user, evt, reply){
    return reply(msgs.help);
  },
  profile:async function(user, evt, reply){
    let info=(await DB.query('SELECT * FROM users_info WHERE btoken='+btoken+' AND id='+user.id+';')).rows[0];
    var text='';
    text+='Ваш профиль\n\n';
    text+='Пол: <b>'+((info.gender==1)?'Мужской':'Женский')+'</b>\n';
    text+='Возраст: <b>';
    switch(info.age_group){
      case 1:
        text+='13-18';
      break;
      case 2:
        text+='18-25';
      break;
      case 3:
        text+='25-36';
      break;
      case 4:
        text+='36+';
      break;
    }
    text+='</b>\n';
   
    if(!info.location||info.location==''){
      text+='Город: <b>';
      text+='не указан';
    }else if(info.location.indexOf('{')>-1){
      info.location=JSON.parse(info.location);
      text+='Геолакация: <b>'+info.location.latitude+','+info.location.longitude;
    }else{
      text+='Город: <b>'+info.location;
    }
    text+='</b>\n';
    return reply(msgUtil.htmlMessage(text));
  },
  rules:async function(user, evt, reply){
    return reply(msgs.rules);
  },
  pay:async function(user, evt, reply){
    if(user.banned >= Date.now()){
      let message=evt.args.join(' ').trim(' ');
      if(message.length>0){
        let items=(await DB.query('SELECT * FROM users WHERE btoken='+btoken+' AND payresponse =1;')).rows;
        let users=[];
        for(let i in items){
          users.push(items[i].id);
        }
        await sendMessage(users,msgUtil.htmlMessage('#'+user.id+'\n<b>Сообщение от заблокированного пользователя <a href="tg://user?id='+user.id+'">'+user.realname+'</a></b>\n\n'+message));
      }else{
        return reply('Ошибка: Введите своё сообщение сразу после команды.\n <i>/pay ваше соощение</i>');
      }
    }else{
      return reply('<i>Ваш аккаунт активен</i>');
    }
  },
  sendtoall:async function(user, evt, reply){
    if(user.rank==100){
      let message=evt.args.join(' ').trim(' ');
      let items=(await DB.query('SELECT * FROM users WHERE btoken='+btoken+' AND rank<100 AND banned<'+Date.now()+';')).rows;
      let users=[];
      for(let i in items){
        users.push(items[i].id);
      }
      await sendMessage(users,msgUtil.htmlMessage('<b>Сообщение от администратора:</b>\n\n'+message));
    }
  },
  
}
module.exports=commands;