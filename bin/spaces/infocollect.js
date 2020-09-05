const icLib  = require('./lib/infocollect.lib.js');
const msgUtil  = require(__path+'lib/messageUtil.lib.js');
const msgs  = require(__path+'lib/messages.lib.js');

const space={
  command:async function(user, evt, reply){
    let info=(await DB.query('SELECT * FROM users_info WHERE btoken='+btoken+' AND id='+user.id+';')).rows[0];
    if(typeof info=="undefined")info=icLib.createUserInfoRecord(user);
    switch(info.step_position){
      case 0:
			case 1:
				switch (evt.cmd) {
          default:
            reply(`Сперва ответте на вопрос`)
            return await icLib.sendCurrentQuestion(reply, user);
        }
			break;
			case 2:
				switch (evt.cmd) {
          default:
            reply(`Сперва ответте на вопрос`)
            return await icLib.sendCurrentQuestion(reply, user);
        }
			break;
			case 3:
				switch (evt.cmd) {
          case 'skip':
            (await DB.query('UPDATE users_info SET location =\'\',step_position=4 WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
            return await icLib.sendCurrentQuestion(reply, user);
          break;
          default:
            reply(`Сперва ответте на вопрос`)
            return await icLib.sendCurrentQuestion(reply, user);
        }
      break;
      case 4:
        return await icLib.sendCurrentQuestion(reply, user);
      break;
    }      
  },
  message:async function(user, evt, reply){
    let info=(await DB.query('SELECT * FROM users_info WHERE btoken='+btoken+' AND id='+user.id+';')).rows[0];
    if(typeof info=="undefined")info=icLib.createUserInfoRecord(user);
    
    switch(info.step_position){
      case 0:
			case 1:
				evt.text=evt.text.trim().toLowerCase();
        if(evt.text=='male'||evt.text=='men'||evt.text=='муж'||evt.text=='мужчина'||evt.text=='мужской'||evt.text=='мужской'||evt.text=='парень'){
          var gender=1;
        }else if(evt.text=='female'||evt.text=='women'||evt.text=='жен'||evt.text=='женщина'||evt.text=='женский'||evt.text=='девушка'){
          var gender=2;
        }else{
          return reply('Введите корректный пол');
        }
        (await DB.query('UPDATE users_info SET gender ='+gender+',step_position=2 WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
        user.step_position=2;
			break;
			case 2:
				if(parseInt(evt.text)==evt.text&&Number(evt.text)>0&&Number(evt.text)<150){
          let age =Number(evt.text);
          let age_group=0;
          if(age<18){
            age_group=1;
          }else if(age>=18&&age<25){
            age_group=2;
          }else if(age>=25&&age<36){
            age_group=3;
          }else if(age>=36){
            age_group=4;
          }
          (await DB.query('UPDATE users_info SET age_group ='+age_group+',step_position=3 WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
          user.step_position=3;
        }else if(["13-18","18-25","25-36","36+"].includes(evt.text)){
          let age_group=0;
          switch(evt.text){
            case "13-18":
              age_group=1;
            break;
            case "18-25":
              age_group=2;
            break;
            case "25-36":
              age_group=3;
            break;
            case "36+":
              age_group=4;
            break;
            default:
              return reply('Введите корректный возраст или диапазон');
          }
          (await DB.query('UPDATE users_info SET age_group ='+age_group+',step_position=3 WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
          user.step_position=3;
        }
      break;
      case 3:
				if(evt.type=='location'){
          (await DB.query('UPDATE users_info SET location =\''+JSON.stringify(evt.data)+'\',step_position=4 WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
          user.step_position=4;
        }else if(typeof evt.text!='undefined'&&evt.text.trim().toLowerCase()=='skip'){
          (await DB.query('UPDATE users_info SET location =\'\',step_position=4 WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
          user.step_position=4;
        }else if(typeof evt.text!='undefined'&&evt.text!=''){
          (await DB.query('UPDATE users_info SET location =\''+evt.text.trim()+'\',step_position=4 WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
          user.step_position=4;
        }else{
          return reply('Введите корректный город');
        }
			break;
      case 4:
        return await icLib.sendCurrentQuestion(reply, user);
      break;
    }
    return await icLib.sendCurrentQuestion(reply, user);
  },
}
module.exports=space;