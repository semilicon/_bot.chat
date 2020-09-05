/////////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var lib = {
	htmlMessage: (msg) => {
		return {
			type: 'message',
			text: msg,
			options: {
				parse_mode: 'HTML'
		  	}
		}
	},
	inline_keyboard: (msg, kbd) => {
		var keyboard={"inline_keyboard": kbd};
		if(typeof msg=='object'){
			msg.options.reply_markup=JSON.stringify(keyboard);
			return msg;
		}else{
			return {
				type: 'message',
				text: msg,
				options: {
					parse_mode: 'HTML',
					reply_markup: JSON.stringify(keyboard)
				}
			}
		}
	}
};
module.exports=lib;