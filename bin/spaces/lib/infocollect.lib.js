/////////////////////////////////////////////////////////////////////////////////////////////////////////
const msgUtil  = require(__path+'lib/messageUtil.lib.js');
const msgs  = require(__path+'lib/messages.lib.js');
const userLib  = require(__path+'lib/user.lib.js');
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var lib = {
	createUserInfoRecord:async function(user){
		(await DB.query({text:'INSERT INTO users_info(btoken, id, step_position) VALUES($1, $2, $3)',values:[btoken, user.id, 1]}));
		return (await DB.query('SELECT * FROM users_info WHERE btoken='+btoken+' AND id='+user.id+';')).rows[0];
	},
	sendCurrentQuestion:async function(reply,user){
		let info=(await DB.query('SELECT * FROM users_info WHERE btoken='+btoken+' AND id='+user.id+';')).rows[0];
		if(typeof info=="undefined")info=await lib.createUserInfoRecord(user);
		switch(info.step_position){
			case 0:
			case 1:
				await userLib.setKeyboard(user,[msgs[user.lang].infocollect.questions.sex.variables]);
				reply(msgs[user.lang].infocollect.questions.sex.title);
			break;
			case 2:
				await userLib.setKeyboard(user,[["13-18","18-25"],["25-36","36+"]]);
				reply(msgs[user.lang].infocollect.questions.age.title);

			break;
			case 3:
				await userLib.setKeyboard(user,[[{"text":msgs[user.lang].infocollect.questions.location.location_button,"request_location":true,"hide":false}],[msgs[user.lang].infocollect.questions.location.skip]]);
				reply(msgs[user.lang].infocollect.questions.location.title);
			break;
			case 4:
			default:
				await userLib.setKeyboard(user,'');
				(await DB.query('UPDATE users SET space = \'chat\' WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
        		reply(msgs[user.lang].rules);
		}
	},
};
module.exports=lib;