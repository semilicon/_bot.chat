export const ERR_NO_REPLY = 'please reply to a message to use this command'
export const USER_NOT_IN_CHAT = 'you\'re not in the chat yet! Use </i>/start<i> to join'
export const USER_IN_CHAT = 'you\'re already in the chat!'
export const USER_BANNED_FROM_CHAT = 'your cooldown expires at'
export const USER_LEFT_CHAT = 'left the chat'
export const USER_JOINED_CHAT = 'joined the chat'
export const USER_SPAMMING = 'avoid sending messages too fast. your message has not been sent, try again later.'
export const ALREADY_WARNED = 'a warning has already been issued for this message'
export const MESSAGE_DISAPPEARED = 'this message disappeared into the ether'

export const blacklisted = (reason) => `you've been blacklisted for "${reason || '(reason not specified)'}"`

export const KARMA_THANK_YOU = 'you just gave this user some sweet karma, awesome!'
export const ALREADY_UPVOTED = 'you already upvoted this message'
export const CANT_UPVOTE_OWN_MESSAGE = 'you can\'t upvote your own message'
export const YOU_HAVE_KARMA = 'you\'ve just been given sweet karma! (check /info to see your karma, or /toggleKarma to turn these notifications off)'
export const REJOINING_QUICKLY = 'you\'re rejoining too quickly - try again later'

export const stringifyTimestamp = (ts) =>
  (new Date(ts)).toUTCString()

export const obfuscateKarma = (karma) => {
  let offset = Math.round((karma * 0.2) + 2)
  return karma + Math.floor(Math.random() * (offset + 1) - offset)
}

