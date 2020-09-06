/////////////////////////////////////////////////////////////////////////////////////////////////////////
const { ClickHouse } = require('clickhouse');
const clickhouse = new ClickHouse({
	debug: false,
	basicAuth: {
		username: config.clickhouse['bot_chat'].user,
		password: config.clickhouse['bot_chat'].password,
	},
	isUseGzip: false,
	format: "json",
	config: {
		session_timeout                         : 0,
		output_format_json_quote_64bit_integers : 0,
		enable_http_compression                 : 0,
		database                                : 'bot_chat',
	}
  });

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var lib = {
	message:async (evt,chat_id,output_message_id) => {
		let ldat={
			btoken:btoken,
			date:evt.raw.date,
			type:evt.type,
			chat_id:chat_id,
			user_id:evt.user,
			message_id:evt.raw.message_id,
			output_message_id:output_message_id,
			text:(evt.text)?evt.text:''
		}
		switch(evt.type){
		case 'message':break;
		case 'audio':
			ldat.file_title=evt.data.title;
			ldat.file_performer=evt.data.performer;
			ldat.file_id=evt.data.file_id;
			ldat.file_unique_id=evt.data.file_unique_id;
		break;
		case 'document':
			ldat.file_name=evt.data.file_name;
			ldat.file_id=evt.data.file_id;
			ldat.file_unique_id=evt.data.file_unique_id;
		break;
		case 'photo':
			let bigPhoto={file_size:0};
			for(let key in evt.data){
			let photo=evt.data[key];
			if(photo.file_size>bigPhoto.file_size)bigPhoto=photo;
			}
			if(bigPhoto.file_size>0){
			ldat.file_id=bigPhoto.file_id;
			ldat.file_unique_id=bigPhoto.file_unique_id;
			}
		break;
		case 'sticker':
			ldat.set_name=evt.data.set_name;
			ldat.emoji=evt.data.emoji;
			ldat.file_id=evt.data.file_id;
			ldat.file_unique_id=evt.data.file_unique_id;
		break;
		case 'video':
		case 'voice':
			ldat.file_id=evt.data.file_id;
			ldat.file_unique_id=evt.data.file_unique_id;
		break;
		}
		let ldatkeys=[];
		for(let key in ldat){
		ldatkeys.push(key)
		}
		await clickhouse.insert('INSERT INTO messages_log ('+ldatkeys.join(',')+')',ldat).toPromise();
	},
	command:async (evt) => {
		await clickhouse.insert('INSERT INTO commands_log (btoken, date, user_id,message_id,cmd,args)',{btoken:btoken,date:evt.raw.date,user_id:evt.user,message_id:evt.raw.message_id,cmd:evt.cmd,args:evt.args}).toPromise();
	},
	chat:async (id,date_start,user_1,user_2) => {
		await clickhouse.insert('INSERT INTO chat_log (btoken, id, date_start,date_end,user_1,user_2)',{btoken:btoken,id:id,date_start:date_start,date_end:Date.now(),user_1:user_1,user_2:user_2}).toPromise();
	},
	report:async (user_id,report_type,chat_id) => {
		await clickhouse.insert('INSERT INTO reports (btoken, user_id, date,report_type,chat_id)',{btoken:btoken,user_id:user_id,date:Math.floor(Date.now()/1000),report_type:report_type,chat_id:chat_id}).toPromise();
	},
};
module.exports=lib;