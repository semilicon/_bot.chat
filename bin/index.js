import dude from 'debug-dude'
const { log, info, warn } = dude('bot')

import { version } from '../package.json'
info(`secretlounge v${version} starting`)

import config from '../config.json'
global.config=config;
global.btoken=Number(config.token.split(':')[0]);
import { connect } from 'coffea'

const { ClickHouse } = require('clickhouse');
const include = require(__path+'lib/include.lib.js');
const msgs  = require(__path+'lib/messages.lib.js');
const icLib  = require(__path+'spaces/lib/infocollect.lib.js');
global.clickhouse = new ClickHouse({
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
global.pgToolsLib=require(__path+"lib/dbtools.postgresql.lib.js");
global.DB=pgToolsLib.newPostgresPool('bot_chat');
const startDB=async function(callback){
  (await PS(pgToolsLib,pgToolsLib.postgresConnect)(DB));
  if(typeof callback!="undefined")callback();
}
import {
  htmlMessage, cursive,
  getUsername, getUsernameFromEvent, getRealnameFromEvent,
  stringifyTimestamp, blacklisted,
  USER_NOT_IN_CHAT, USER_IN_CHAT, USER_BANNED_FROM_CHAT, USER_JOINED_CHAT,
  USER_SPAMMING, ERR_NO_REPLY, ALREADY_UPVOTED, CANT_UPVOTE_OWN_MESSAGE,
  KARMA_THANK_YOU, YOU_HAVE_KARMA, REJOINING_QUICKLY
} from './messages'
import { RANKS } from './ranks'
import {
  setCache, delCache, createCacheGroup, getCacheGroup, getFromCache,
  addUpvote, hasUpvoted
} from './cache'
import {
  getUser, getUsers, setRank, isActive, addUser, rejoinUser, updateUser, delUser,
  getSystemConfig, rmWarning, addKarma, karmaOptedOut
} from './db'
import commands from './commands'

const spaces  = include.actionsTree(__path+'spaces');
import { HOURS } from './time'
import {
  LINK_REGEX,
  SPAM_LIMIT,
  SPAM_LIMIT_HIT,
  SPAM_INTERVAL,
  SCORE_MESSAGE,
  SCORE_LINK,
  SCORE_STICKER,
  SCORE_CHARACTER,
  WARN_EXPIRE,
  KARMA_PLUS_ONE
} from './constants'

// run a check to see if any warnings need removed every half hour
setInterval(async () => {
  (await getUsers()).map(async(user) => {
    if (user.warnUpdated + WARN_EXPIRE <= Date.now()) {
      await rmWarning(user.id)
    }
  })
}, 0.5 * HOURS)

const parseEvent = (rawEvent) => {
  if (typeof rawEvent === 'string') return { type: 'message', text: rawEvent }
  else return rawEvent
}

const isForwarded = (evt) =>
    evt && evt.raw && (evt.raw.forward_from || evt.raw.forward_from_chat)

export const sendTo = (users, rawEvent, alwaysSend = false) => {
  const evt = parseEvent(rawEvent)
  const cacheId = createCacheGroup()
  let replyCache
  if (evt && evt.raw && evt.raw.reply_to_message && evt.raw.reply_to_message.message_id) {
    replyCache = getCacheGroup(evt.raw.reply_to_message.message_id)
  }
  if (evt && evt.options && evt.options.reply_to_message_id) {
    replyCache = getCacheGroup(evt.options.reply_to_message_id)
  }

  users.map((user) => {
    let promises
    if (isActive(user)) {
      if (evt && evt.raw && evt.raw.message_id && user.id === evt.user) {
        setCache(evt.raw.message_id, cacheId, evt.user, user.id)
      }
      if (alwaysSend || user.debug || user.id !== evt.user) { // don't relay back to sender
        if (isForwarded(evt)) {
          promises = networks.send({
            type: 'forwardMessage',
            chat: user.id,
            fromChatId: evt.chat,
            messageId: evt && evt.raw && evt.raw.message_id
          })
        } else {
          promises = networks.send({
            ...evt,
            chat: user.id,
            options: {
              ...evt.options,
              reply_to_message_id: replyCache && replyCache[user.id],
              caption: evt.raw && evt.raw.caption
            }
          })
        }
        if (evt.user) {
          // store message in history
          promises && promises[0] && promises[0].then((msg) => {
            //      (messageId,      cacheId, sender,   receiver)
            setCache(msg.message_id, cacheId, evt.user, user.id)
            setTimeout(() => {
              delCache(msg.message_id)
            }, 24 * HOURS)
          })
          .catch(async (err) => {
            if (err && (
              err.message === '403 {"ok":false,"error_code":403,"description":"Bot was blocked by the user"}' ||
              err.message === '403 {"ok":false,"error_code":403,"description":"Forbidden: user is deactivated"}' ||
              err.message === '400 {"ok":false,"error_code":400,"description":"PEER_ID_INVALID"}'
            )) {
              info('user (%o) blocked the bot (or user is deactivated), removing from the chat', user)
              await delUser(user.id)
            } else {
              warn('message not sent to user (%o): %o', user, err)
            }
          })
        }
      }
    }
  })
}

export const sendToUser = (id, rawEvent) =>
  sendTo(
    [{ id }],
    rawEvent,
    true // alwaysSend
  )

export const sendToAll = async (rawEvent) =>
  sendTo(
    await getUsers('status>0'),
    rawEvent
  )

export const sendToMods = async (rawEvent) =>
  sendTo(
    (await getUsers()).filter(u => u.rank >= RANKS.mod),
    rawEvent
  )

export const sendToAdmins = async (rawEvent) =>
  sendTo(
    (await getUsers()).filter(u => u.rank >= RANKS.admin),
    rawEvent
  )

const relay = (type) => {
  networks.on(type, async (evt, reply) => {
    
    var user = await getUser(evt.user)
    if (user && user.rank < 0) return reply(cursive(blacklisted(user && user.reason)))
    let ldat={
      btoken:btoken,
      date:evt.raw.date,
      type:type,
      user_id:evt.user,
      message_id:evt.raw.message_id,
      text:(evt.text)?evt.text:''
    }
    switch(type){
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
    
    
    if (type !== 'message' || (evt && evt.text && evt.text.charAt(0) !== '/')) { // don't parse commands again
      await clickhouse.insert('INSERT INTO messages_log ('+ldatkeys.join(',')+')',ldat).toPromise();
      if (!isActive(user)) { // make sure user is in the group chat
        return reply(cursive(USER_NOT_IN_CHAT))
      }else if (user && user.banned >= Date.now()) {
        return reply(cursive(USER_BANNED_FROM_CHAT + ' ' + stringifyTimestamp(user.banned)))
      }else if(typeof spaces[user.space]!='undefined' && typeof spaces[user.space].command=="function"){
        return spaces[user.space].message(user, evt, function(msg){msg=getKeyboard(msg,user);reply(msg);});
      }
      
      sendToAll(evt)
    }
  })
}



const updateUserFromEvent = async (evt) => {
  const user = await getUser(evt.user)
  if (user) {
    if (evt && evt.raw && evt.raw.from) {
      return await updateUser(user.id, {
        username: getUsernameFromEvent(evt),
        realname: getRealnameFromEvent(evt)
      })
    } else warn('user detected, but no `from` information in message!')
  }
}

const calcSpamScore = (evt) => {
  switch (evt.type) {
    case 'sticker':
      return SCORE_STICKER
    case 'message':
      if (LINK_REGEX.test(evt.text)) {
        return SCORE_MESSAGE + // regular message
          (evt.text.length * SCORE_CHARACTER) + // characters count, still
          ((evt.text.match(LINK_REGEX) || []).length * SCORE_LINK) // number of links * score
      }

      return SCORE_MESSAGE + (evt.text.length * SCORE_CHARACTER) // regular message + character count
    default:
      return SCORE_MESSAGE
  }
}

const increaseSpamScore = async(user, evt) => {
  const incSpamScore = calcSpamScore(evt)
  const newSpamScore =
    (user.spamScore + incSpamScore) >= SPAM_LIMIT
    ? SPAM_LIMIT_HIT
    : user.spamScore + incSpamScore

  return await updateUser(user.id, {
    spamScore: newSpamScore
  })
}

const decreaseSpamScores = async () => {
  const users = await getUsers()
  return users.map(async(user) => {
    return await updateUser(user.id, {
      spamScore: user.spamScore > 0 ? user.spamScore - 1 : 0
    })
  })
}

setInterval(decreaseSpamScores, SPAM_INTERVAL)


const handleKarma = async(evt, reply) => {
  const user = getUser(evt && evt.user)
  const replyId = evt && evt.raw && evt.raw.reply_to_message && evt.raw.reply_to_message.message_id
  const { sender: receiver } = getFromCache(evt, reply)

  if (replyId) {
    if (receiver !== user.id) {
      if (!hasUpvoted(replyId, user.id)) {
        await addKarma(receiver, KARMA_PLUS_ONE)
        addUpvote(replyId, user.id)
        if (!await karmaOptedOut(receiver)) {
          sendToUser(receiver, {
            ...cursive(YOU_HAVE_KARMA),
            options: {
              reply_to_message_id: replyId,
              parse_mode: 'HTML'
            }
          })
        }
        reply(cursive(KARMA_THANK_YOU))
      } else {
        reply(cursive(ALREADY_UPVOTED))
      }
    } else {
      reply(cursive(CANT_UPVOTE_OWN_MESSAGE))
    }
  } else {
    reply(cursive(ERR_NO_REPLY))
  }
}
export const getKeyboard=async (msg,user) =>{
  user=await getUser(user.id);
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
    msg.options.reply_markup=JSON.stringify(keyboard);
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
}
var networks=null;
startDB(function(){
  networks = connect(config);
  ['message', 'audio', 'document', 'photo', 'sticker', 'video', 'voice','location'].map(relay);

  networks.on('command', async (evt, reply) => {
    //log('received command event: %o', evt)
    await clickhouse.insert('INSERT INTO commands_log (btoken, date, user_id,message_id,cmd,args)',{btoken:btoken,date:evt.raw.date,user_id:evt.user,message_id:evt.raw.message_id,cmd:evt.cmd,args:evt.args}).toPromise();
    var user = await getUser(evt.user)
    if (evt && evt.cmd) evt.cmd = evt.cmd.toLowerCase()
    if (user && user.rank < 0) return reply(cursive(blacklisted(user && user.reason)))
    if (evt && evt.cmd === 'start') {
      if (isActive(user)){
        reply(cursive('Ты уже в чате'))
        if(user.space=='infocollect') await icLib.sendCurrentQuestion(async function(msg){msg=await getKeyboard(msg,user);reply(msg);}, user);
        return;
      }
      else if (!user) await addUser(evt.user,evt)
      else await rejoinUser(evt.user)
  
      reply(cursive(msgs.afterStart));
      if(!user)user = await getUser(evt.user);
      if(user.space=='infocollect') await icLib.sendCurrentQuestion(async function(msg){msg=await getKeyboard(msg,user);reply(msg);}, user);
      return;
    }
    if(typeof spaces[user.space]!='undefined' && typeof spaces[user.space].command=="function"){
      return spaces[user.space].command(user, evt, function(msg){msg=getKeyboard(msg,user);reply(msg);});
    }else{
      commands(user, evt, reply)
    }

  })
  
  networks.on('message', async (evt, reply) => {
    await updateUserFromEvent(evt)
  })
});

