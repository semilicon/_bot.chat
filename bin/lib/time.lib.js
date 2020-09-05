/////////////////////////////////////////////////////////////////////////////////////////////////////////
const SECONDS = 1000
const MINUTES = 60 * SECONDS
const HOURS = 60 * MINUTES
const DAYS = 24 * HOURS
const WEEKS = 7 * DAYS

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var lib = {
	SECONDS:SECONDS,
  MINUTES:MINUTES,
  HOURS:HOURS,
  DAYS:DAYS,
  WEEKS:WEEKS,
	formatTime: (ms,lang) => {
    if (ms < MINUTES) {
      return Math.ceil(ms / SECONDS) + 's'
    } else if (ms < HOURS) {
      return Math.ceil(ms / MINUTES) + 'm'
    } else if (ms < DAYS) {
      return Math.ceil(ms / HOURS) + 'h'
    } else if (ms < WEEKS) {
      return Math.ceil(ms / DAYS) + 'd'
    } else {
      // let's really hope this never happens, eh?
      return Math.ceil(ms / WEEKS) + 'w'
    }
  }
};
module.exports=lib;
