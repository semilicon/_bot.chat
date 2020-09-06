const msgUtil  = require(__path+'lib/messageUtil.lib.js');
const msgs  = require(__path+'lib/messages.lib.js');
const chLog  = require(__path+'lib/chLog.lib.js');
const time  = require(__path+'lib/time.lib.js');




const space={
  command:async function(user, evt, reply){
    switch(user.status){
      case 0:
				switch (evt.cmd) {
          case 'search':
            (await DB.query('UPDATE users SET status = 2 WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
            (await DB.query({text:'INSERT INTO searching_list (btoken,user_id) VALUES($1, $2)',values: [btoken, user.id]}));
            return reply(msgs[user.lang].chat.unactive.press_search);
          break;
          case 'next':
            return reply(msgs[user.lang].chat.unactive.press_next);
          break;
          case 'stop':
            return reply(msgs[user.lang].chat.unactive.press_stop);
            
        }
			break;
			case 1:
				switch (evt.cmd) {
          case 'stop':
            if(user.current_chat>0){
              let item=(await DB.query('SELECT * FROM chat WHERE btoken='+btoken+' AND id = \''+user.current_chat+'\';')).rows[0];
              chLog.chat(item.id,item.date_start,item.user_1,item.user_2);
              (await DB.query('DELETE FROM chat WHERE btoken='+btoken+' AND id = \''+item.id+'\';'));
              var user2=(user.id==item.user_1)?item.user_2:item.user_1;
              (await DB.query('UPDATE users SET status = 0,current_chat=0 WHERE btoken='+btoken+' AND id = \''+user2+'\';'));
              let u2=(await DB.query('SELECT id,lang FROM users WHERE btoken='+btoken+' AND id = \''+user2+'\';')).rows[0];
              await sendMessage(u2.id,msgUtil.inline_keyboard(msgs[u2.lang].chat.active.companion_response,(user.current_chat>0)?[[{"text":"report","callback_data":'{"action":"chat/report/'+user.id+'","rt":3,"cid":'+user.current_chat+'}',"hide":false}]]:[]))
            }
            (await DB.query('UPDATE users SET status = 0,current_chat=0 WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
            return reply(msgUtil.inline_keyboard(msgs[user.lang].chat.active.press_stop,(user.current_chat>0)?[[{"text":"report","callback_data":'{"action":"chat/report/'+user2+'","rt":1,"cid":'+user.current_chat+'}',"hide":false}]]:[]));
          break;
          case 'next':
            if(user.current_chat>0){
              let item=(await DB.query('SELECT * FROM chat WHERE btoken='+btoken+' AND id = \''+user.current_chat+'\';')).rows[0];
              chLog.chat(item.id,item.date_start,item.user_1,item.user_2);
              (await DB.query('DELETE FROM chat WHERE btoken='+btoken+' AND id = \''+item.id+'\';'));
              var user2=(user.id==item.user_1)?item.user_2:item.user_1;
              (await DB.query('UPDATE users SET status = 0,current_chat=0 WHERE btoken='+btoken+' AND id = \''+user2+'\';'));
              let u2=(await DB.query('SELECT id,lang FROM users WHERE btoken='+btoken+' AND id = \''+user2+'\';')).rows[0];
              await sendMessage(u2.id,msgUtil.inline_keyboard(msgs[u2.lang].chat.active.companion_response,(user.current_chat>0)?[[{"text":"report","callback_data":'{"action":"chat/report/'+user.id+'","rt":3,"cid":'+user.current_chat+'}',"hide":false}]]:[]))
            }
            (await DB.query('UPDATE users SET status = 2,current_chat=0 WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
            (await DB.query({text:'INSERT INTO searching_list (btoken,user_id) VALUES($1, $2)',values: [btoken, user.id]}));
            reply(msgUtil.inline_keyboard(msgs[user.lang].chat.active.press_next,(user.current_chat>0)?[[{"text":"report","callback_data":'{"action":"chat/report/'+user2+'","rt":2,"cid":'+user.current_chat+'}',"hide":false}]]:[]));
            
            return;
          break;
          case 'search':
            if(user.current_chat==0){
              (await DB.query('UPDATE users SET status = 2,current_chat=0 WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
              (await DB.query({text:'INSERT INTO searching_list (btoken,user_id) VALUES($1, $2)',values: [btoken, user.id]}));
              return reply(msgs[user.lang].chat.unactive.press_search);
            }
            return reply(msgs[user.lang].chat.active.press_search);
          break;
          case 'sharelink':
            let item=(await DB.query('SELECT * FROM chat WHERE btoken='+btoken+' AND id = \''+user.current_chat+'\';')).rows[0];
            var user2=(user.id==item.user_1)?item.user_2:item.user_1;
            let output=await sendMessage(user2,msgUtil.htmlMessage(msgs[user.lang].chat.active.press_sharelink+': <a href="tg://user?id='+user.id+'">'+user.realname+'</a>'));
            evt.text='/sharelink';
            chLog.message(evt,user.current_chat,output.message_id);
          break;
        }
			break;
			case 2:
				switch (evt.cmd) {
          case 'stop':
            (await DB.query('DELETE FROM searching_list WHERE btoken='+btoken+' AND user_id = \''+user.id+'\';'));
            (await DB.query('UPDATE users SET status = 0 WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
            return reply(msgs[user.lang].chat.searching.press_stop);
          break;
          case 'next':
            return reply(msgs[user.lang].chat.searching.press_next);
          break;
          case 'search':
            return reply(msgs[user.lang].chat.searching.press_search);
          break;
        }
      break;
    }      
  },
  callback:async function(user, data, evt, reply){
    switch(data.action[0]){
      case 'report':
        //if(!data.rt)data.rt=1;
        data.uid=data.action[1];
        data.type=data.action[2];
        if(typeof data.action[2]!="undefined"){
          if(data.type==0){
              let text='';
              switch(data.rt){
                case 2:
                  text=msgs[user.lang].chat.active.press_next;
                break;
                case 3:
                  text=msgs[user.lang].chat.active.companion_response;
                break;
                case 1:
                default:
                  text=msgs[user.lang].chat.active.press_stop;
                break;
              }
              updateMessage(msgUtil.inline_keyboard(text,[[{"text":"report","callback_data":'{"action":"chat/report/'+data.uid+'","rt":'+data.rt+',"cid":'+data.cid+'}',"hide":false}]]),evt)
          }else{
            updateMessage(msgUtil.inline_keyboard(msgs[user.lang].chat.report.finish,[]),evt);
            chLog.report(data.uid,data.type,data.cid);
            let user2=(await DB.query('SELECT * FROM users WHERE btoken='+btoken+' AND id = \''+data.uid+'\';')).rows[0];
            user2.reports++;
            if(Math.floor(user2.reports/10)>0&&(user2.reports % 10==0)){
              //time
              let cooldownTime = Math.floor(user2.reports/10) * time.DAYS;
              (await DB.query('UPDATE users SET status = 0,current_chat=0,reports = reports+1,banned = \''+(Date.now()+cooldownTime)+'\' WHERE btoken='+btoken+' AND id = \''+user2.id+'\';'));
              (await DB.query('DELETE FROM searching_list WHERE btoken='+btoken+' AND user_id = \''+user2.id+'\';'));
              await sendMessage(user2.id,msgs[user2.lang].chat.report.user_blocked_message+time.formatDateTime(Date.now()+cooldownTime));
            }else{
              (await DB.query('UPDATE users SET reports = reports+1 WHERE btoken='+btoken+' AND id = \''+user2.id+'\';'));
            }
          }
        }else{
          let reasons=[];
          reasons.push([{"text":msgs[user.lang].chat.report.report_abort,"callback_data":'{"action":"chat/report/'+data.uid+'/0","rt":'+data.rt+',"cid":'+data.cid+'}',"hide":false}]);
          for(let i in msgs[user.lang].chat.report.reasons){
            reasons.push([{"text":msgs[user.lang].chat.report.reasons[i],"callback_data":'{"action":"chat/report/'+data.uid+'/'+i+'","rt":'+data.rt+',"cid":'+data.cid+'}',"hide":false}]);
          }
          updateMessage(msgUtil.inline_keyboard(msgs[user.lang].chat.report.reason_report,reasons),evt)
        }
			break;
    } 
  },
  message:async function(user, evt, reply){
    if(user.payresponse==1&&typeof evt.raw.reply_to_message!='undefined'){
      let ban_text=evt.raw.reply_to_message.text;
      
      let user2=ban_text.match(/#(\d*)/);
      if(typeof user2[1]!="undefined"){
        let u2=(await DB.query('SELECT id,lang FROM users WHERE btoken='+btoken+' AND id = \''+user2[1]+'\';')).rows[0];
        await sendMessage(u2.id,msgUtil.htmlMessage('<b>'+msgs[u2.lang].chat.message.message_from_admin+'</b>\n\n'+evt.raw.text+'\n\n'+msgs[u2.lang].chat.message.message_from_admin_comment+''));
      }
    }else{
      switch(user.status){
        case 0:
          return reply(msgs[user.lang].chat.message.unactive_companion_not_found);
        break;
        case 1:
          let item=(await DB.query('SELECT * FROM chat WHERE btoken='+btoken+' AND id = \''+user.current_chat+'\';')).rows[0];
          let user2_id=(user.id==item.user_1)?item.user_2:item.user_1;
          let output = await sendMessage(user2_id,evt);
          chLog.message(evt,user.current_chat,output.message_id);
        break;
        case 2:
          return reply(msgs[user.lang].chat.message.searching_companion_not_found);
        break;
      } 
    }    
  },
  searching_machine:async function(){
    let items=(await DB.query('SELECT * FROM searching_list WHERE btoken='+btoken+' ORDER BY id ASC;')).rows;
    if(!items||items.length<2)return;
    var group={
      one:0,
      two:0
    }
    for(let i in items){
      let item=items[i];
      if(group.one==0)group.one=item.user_id;
      else if(group.two==0)group.two=item.user_id;
      if(group.one>0&&group.two>0){
        let id=(await DB.query({text:'INSERT INTO chat(btoken,date_start,user_1,user_2) VALUES($1, $2, $3, $4) RETURNING id;',values: [btoken, Date.now(),group.one,group.two]})).rows[0].id;
        (await DB.query('DELETE FROM searching_list WHERE btoken='+btoken+' AND (user_id = \''+group.one+'\' OR user_id = \''+group.two+'\');'));
        (await DB.query('UPDATE users SET status = 1,current_chat='+id+' WHERE btoken='+btoken+' AND (id = \''+group.one+'\' OR id = \''+group.two+'\');'));
        //let users=(await DB.query('SELECT * FROM users WHERE btoken='+btoken+' AND (id = \''+group.one+'\' OR id = \''+group.two+'\');')).rows;
        let u1=(await DB.query('SELECT id,lang FROM users WHERE btoken='+btoken+' AND id = \''+group.one+'\';')).rows[0];
        let u2=(await DB.query('SELECT id,lang FROM users WHERE btoken='+btoken+' AND id = \''+group.two+'\';')).rows[0];
        await sendMessage(u1.id,msgUtil.htmlMessage(msgs[u1.lang].chat.companion_found));
        await sendMessage(u2.id,msgUtil.htmlMessage(msgs[u2.lang].chat.companion_found));
        group.one=0;
        group.two=0;
      }
    }
  }
}
setInterval(space.searching_machine,500);
module.exports=space;