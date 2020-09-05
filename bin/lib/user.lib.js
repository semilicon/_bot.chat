/////////////////////////////////////////////////////////////////////////////////////////////////////////

const msgs  = require(__path+'lib/messages.lib.js');

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var lib = {
	isActive:(user) => user && user.left<1,
	getRealnameFromEvent: (evt) => {
		if (evt && evt.raw && evt.raw.from) {
		  const { first_name: firstName, last_name: lastName } = evt.raw.from
		  return [firstName, lastName].filter(i => i).join(' ')
		}
	},
	addUser: async (id,evt) => {
		(await DB.query({text:'INSERT INTO users(btoken, id, date, username,realname) VALUES($1, $2, $3, $4, $5)',values: [btoken, id, Date.now(), evt.raw.from.username, lib.getRealnameFromEvent(evt)]}));
		return await lib.getUser(id);
	},
	getUser: async (id) => {
		if(typeof id!="undefined"){
		  let item=(await DB.query('SELECT * FROM users WHERE btoken='+btoken+' AND id='+id+';')).rows[0];
		  if(typeof item!="undefined"){
			item.rank=Number(item.rank);
			item.banned=Number(item.banned);
		  }
		  return item;
		}else{
		  throw new Error('Error: undefined id in func "getUser" on file "user.lib.js"');
		}
	},
	getUsers: async (where) => {
		let items=(await DB.query('SELECT * FROM users WHERE btoken='+btoken+' '+((typeof where!='undefined'&&where.trim()!='')?' AND '+where:'')+';')).rows;
		for(let i in items){
			items[i].rank=Number(items[i].rank);
			items[i].banned=Number(items[i].banned);
		}
		return items;
	},
	updateUser: async (id, data) => {
		if(typeof id!="undefined"){
			let dat=[];
			for(let key in data){
				dat.push('"'+key+'"=\''+data[key]+'\'');
			}
			(await DB.query('UPDATE users SET '+dat.join(',')+' WHERE btoken='+btoken+' AND id = \''+id+'\';'));
		}
		let user= await lib.getUser(id);
		return user;
  	},
	getUserByUsername: async (username) => {
		let item=(await DB.query('SELECT * FROM users WHERE btoken='+btoken+' AND username=\''+username+'\';')).rows[0];
		if(typeof item!="undefined"){
		  item.id=Number(item.id);
		  item.rank=Number(item.rank);
		  item.banned=Number(item.banned);
		  item.left=(item.left==0)?false:Number(item.left);
		}
		return item;
	},
	setKeyboard:async function(user,kbd){
		if(kbd!='')kbd=JSON.stringify(kbd);
		(await DB.query('UPDATE users SET keyboard=\''+kbd+'\' WHERE btoken='+btoken+' AND id = \''+user.id+'\';'));
		user.keyboard=kbd;
		return user;
	},
	getKeyboard: async (msg,user) =>{
		user.keyboard=(await DB.query('SELECT keyboard FROM users WHERE btoken='+btoken+' AND id='+user.id+';')).rows[0].keyboard;
		if(!user.keyboard||user.keyboard==''){
		  var keyboard={remove_keyboard:true};
		}else{
		  var keyboard={
			"keyboard": JSON.parse(user.keyboard),
			resize_keyboard:true
		  };
		}
		if(typeof msg=='object'){
		  if(!msg.options)msg.options={};
		  if(typeof msg.options.reply_markup=="undefined")msg.options.reply_markup=JSON.stringify(keyboard);
		  else if(typeof msg.options.reply_markup=="object"){
			if(keyboard.remove_keyboard)msg.options.reply_markup.remove_keyboard=keyboard.remove_keyboard;
			else msg.options.reply_markup.keyboard=keyboard.keyboard;
		  }else if(typeof msg.options.reply_markup=="string"){
			let reply_markup=JSON.parse(msg.options.reply_markup);
			if(keyboard.remove_keyboard)reply_markup.remove_keyboard=keyboard.remove_keyboard;
			else reply_markup.keyboard=keyboard.keyboard;
			msg.options.reply_markup=JSON.stringify(reply_markup);
		  }
		  return msg;
		}else if(typeof msg=='string'){
		  return {
			type: 'message',
			text: msg,
			options: {
			  parse_mode: 'HTML',
			  reply_markup: JSON.stringify(keyboard)
			}
		  }
		}
	},
	updateUserFromEvent: async (evt) => {
		const user = await lib.getUser(evt.user);
		if (user) {
		  if (evt && evt.raw && evt.raw.from) {
			return await lib.updateUser(user.id, {
			  username: evt.raw.from.username,
			  realname: lib.getRealnameFromEvent(evt),
			  lang: (evt.raw.from.language_code && typeof msgs[evt.raw.from.language_code]!='undefined')?evt.raw.from.language_code:'en'
			})
		  }
		}
	},
	rejoinUser: async (id) => await lib.setLeft(id, 0),
	setLeft: async(id, left) => {
		(await DB.query('UPDATE users SET "left" = \''+left+'\' WHERE btoken='+btoken+' AND id = \''+id+'\';'));
		return await lib.getUser(id);
	}
};
module.exports=lib;