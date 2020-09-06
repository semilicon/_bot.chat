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
  },
  formatDateTime:(ms)=>{
    let datetime=new Date(Number(ms));
    let date={
      year:datetime.getUTCFullYear(),
      month:datetime.getUTCMonth()+1,
      day:datetime.getUTCDate(),
      hours:datetime.getUTCHours(),
      minutes:datetime.getUTCMinutes(),
      seconds:datetime.getUTCSeconds(),
      miliseconds:datetime.getUTCMilliseconds(),
      timezoneoffset:0
    }
    let resylt='';
    resylt+=((date.year<1000)?'0':'')+((date.year<100)?'0':'')+((date.year<10)?'0':'')+date.year;
    resylt+='-';
    resylt+=((date.month<10)?'0':'')+date.month
    resylt+='-';
    resylt+=((date.day<10)?'0':'')+date.day
    resylt+=' ';
    resylt+=((date.hours<10)?'0':'')+date.hours
    resylt+=':';
    resylt+=((date.minutes<10)?'0':'')+date.minutes
    resylt+=' UTC';
    return resylt;
  }
};
module.exports=lib;
