import {
  getUsernameFromEvent, getRealnameFromEvent
} from './messages'

export const getKarma = async(id) => {
  const user = await getUser(id)
  if (!user || !user.karma) return 0
  else return user.karma
}
export const addKarma = async (id, val = 1) =>{
  (await DB.query('UPDATE users SET karma = \''+(await getKarma(id) + val)+'\' WHERE btoken='+btoken+' AND id = \''+id+'\';'));
}
export const rmKarma = async (id, val = 1) =>{
  (await DB.query('UPDATE users SET karma = \''+(await getKarma(id) - val)+'\' WHERE btoken='+btoken+' AND id = \''+id+'\';'));
}

export const blacklistUser = async (id, reason) => {
  (await DB.query('UPDATE users SET "left" = \''+new Date().getTime()+'\',rank = -10,reason=\''+reason+'\' WHERE btoken='+btoken+' AND id = \''+id+'\';'));
}
export const getUser = async (id) => {
  if(typeof id!="undefined"){
    let item=(await DB.query('SELECT * FROM users WHERE btoken='+btoken+' AND id='+id+';')).rows[0];
    if(typeof item!="undefined"){
      item.id=Number(item.id);
      item.rank=Number(item.rank);
      item.spamScore=Number(item.spamScore);
      item.warnings=Number(item.warnings);
      item.banned=Number(item.banned);
      item.karma=Number(item.karma);
      item.left=(item.left==0)?false:Number(item.left);
    }
    return item;
  }else{
    throw new Error('Error: undefined id in func "getUser" on file "db.js"');
  }
}
export const getUserByUsername = async (username) => {
  let item=(await DB.query('SELECT * FROM users WHERE btoken='+btoken+' AND username=\''+username+'\';')).rows[0];
  if(typeof item!="undefined"){
    item.id=Number(item.id);
    item.rank=Number(item.rank);
    item.spamScore=Number(item.spamScore);
    item.warnings=Number(item.warnings);
    item.banned=Number(item.banned);
    item.karma=Number(item.karma);
    item.left=(item.left==0)?false:Number(item.left);
  }
  return item;
}
export const addUser = async (id,evt) => {
  (await DB.query({text:'INSERT INTO users(btoken, id, date, username,realname) VALUES($1, $2, $3, $4, $5)',values: [btoken, id, Date.now(), getUsernameFromEvent(evt), getRealnameFromEvent(evt)]}));
  return await getUser(id);
}
export const rejoinUser = async (id) => await setLeft(id, 0)
export const delUser = async (id) => {
  (await DB.query('DELETE FROM users WHERE btoken='+btoken+' AND id = \''+id+'\';'));
}
export const getUsers = async (where) => {
  let items=(await DB.query('SELECT * FROM users WHERE btoken='+btoken+' '+((typeof where!='undefined'&&where.trim()!='')?' AND '+where:'')+';')).rows;
  for(let i in items){
      items[i].id=Number(items[i].id);
      items[i].rank=Number(items[i].rank);
      items[i].spamScore=Number(items[i].spamScore);
      items[i].warnings=Number(items[i].warnings);
      items[i].banned=Number(items[i].banned);
      items[i].karma=Number(items[i].karma);
      items[i].left=(items[i].left==0)?false:Number(items[i].left);
  }
  return items;
}
export const updateUser = async (id, data) => {
  if(typeof id!="undefined"){
    let dat=[];
    for(let key in data){
      dat.push('"'+key+'"=\''+data[key]+'\'');
    }
    (await DB.query('UPDATE users SET '+dat.join(',')+' WHERE btoken='+btoken+' AND id = \''+id+'\';'));
  }
  let user= await getUser(id);
  return user;
}

const getUserWarnings = async (id) => {
  const user = await getUser(id)
  if (!user || !user.warnings) return 0
  else return user.warnings
}

import { BASE_COOLDOWN_MINUTES } from './constants'
import { MINUTES } from './time'

// alias to add a warning to a user
export const addWarning = async (id) => {
  let warnings = await getUserWarnings(id)
  let cooldownTime = Math.pow(BASE_COOLDOWN_MINUTES, warnings) * MINUTES;

  // increment user warnings
  (await DB.query('UPDATE users SET warnings = warnings + 1 WHERE btoken='+btoken+' AND id = \''+id+'\';'));
  

 
  await updateWarnTime(id);

  await banUser(id, cooldownTime);
  return cooldownTime
}

export const rmWarning = async (id) => {
  // decrement user warnings
  let warnings = await getUserWarnings(id)
  if (warnings > 0) {
    (await DB.query('UPDATE users SET warnings = warnings +-1 WHERE btoken='+btoken+' AND id = \''+id+'\';'));
    awaitupdateWarnTime(id)
  }
}

export const updateWarnTime = async(id) =>{
  (await DB.query('UPDATE users SET "warnUpdated" = \''+Date.now()+'\' WHERE btoken='+btoken+' AND id = \''+id+'\';'));
  return await getUser(id);
}

export const setLeft = async(id, left) => {
  (await DB.query('UPDATE users SET "left" = \''+left+'\' WHERE btoken='+btoken+' AND id = \''+id+'\';'));
  return await getUser(id);
}

export const banUser = async(id, ms) => {
  (await DB.query('UPDATE users SET banned = \''+(Date.now() + ms)+'\' WHERE btoken='+btoken+' AND id = \''+id+'\';'));
  return await getUser(id);
}


export const isActive = (user) => user && user.left<1

export const setRank = async(id, rank) =>{
  (await DB.query('UPDATE users SET rank = \''+rank+'\' WHERE btoken='+btoken+' AND id = \''+id+'\';'));
}
export const setDebugMode = async(id, val) => {
  (await DB.query('UPDATE users SET debug = \''+val+'\' WHERE btoken='+btoken+' AND id = \''+id+'\';'));
}
export const setKarmaMode = async(id, val) =>{
  (await DB.query('UPDATE users SET hideKarma = \''+val+'\' WHERE btoken='+btoken+' AND id = \''+id+'\';'));
}
export const karmaOptedOut = async(id) =>{
  return await getUser(id).hideKarma || false;
} 

export const getSystemConfig = () => {}
export const setMotd = (motd) => {}
