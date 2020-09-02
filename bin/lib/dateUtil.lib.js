/////////////////////////////////////////////////////////////////////////////////////////////////////////
//console.log('dateUtil',dateUtil.parseFromString('14.12.1992 12:30','+0300').toDate());
Date.prototype.isLeapYear = function(){
    var y = this.getFullYear();
    return y % 4 == 0 && y % 100 != 0 || y % 400 == 0;
};
Date.prototype.getDaysInMonth = function(){
    return arguments.callee[this.isLeapYear() ? 'L' : 'R'][this.getMonth()];
};
Date.prototype.getDaysInMonth.R = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
Date.prototype.getDaysInMonth.L = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var dateUtil = {
	loc:{
		'ЯНВ':1,
		'ФЕВ':2,
		'МАР':3,
		'АПР':4,
		'МАЙ':5,
		'МАЯ':5,
		'ИЮН':6,
		'ИЮЛ':7,
		'АВГ':8,
		'СЕН':9,
		'ОКТ':10,
		'НОЯ':11,
		'ДЕК':12,
		'JAN':1,
		'FEB':2,
		'MAR':3,
		'APR':4,
		'MAY':5,
		'JUN':6,
		'JUL':7,
		'AUG':8,
		'SEP':9,
		'OCT':10,
		'NOV':11,
		'DEC':12
	},
	monthString:{
		'01':"Январь",
		'02':"Февраль",
		'03':'Март',
		'04':'Апрель',
		'05':'Май',
		'06':'Июнь',
		'07':'Июль',
		'08':'Август',
		'09':'Сентябрь',
		'10':'Октябрь',
		'11':'Ноябрь',
		'12':'Декабрь'
	},
	monthStringOfDay:{
		'01':"Января",
		'02':"Февраля",
		'03':'Марта',
		'04':'Апреля',
		'05':'Мая',
		'06':'Июня',
		'07':'Июля',
		'08':'Августа',
		'09':'Сентября',
		'10':'Октября',
		'11':'Ноября',
		'12':'Декабря'
	},
	wd:{
		'0':7,
		'1':1,
		'2':2,
		'3':3,
		'4':4,
		'5':5,
		'6':6
	},
	getMonthCode:function(str){
		str=str.trim().slice(0,3).toUpperCase();
		if(this.loc[str]){
			return this.loc[str];
		}
	},
	fromDate:function(datetime){
		var date={
			year:0,
			month:0,
			day:0,
			hours:0,
			minutes:0,
			seconds:0,
			miliseconds:0,
			timezoneoffset:0
		};
		if(datetime){
			date={
				year:datetime.getFullYear(),
				month:datetime.getMonth()+1,
				day:datetime.getDate(),
				hours:datetime.getHours(),
				minutes:datetime.getMinutes(),
				seconds:datetime.getSeconds(),
				miliseconds:datetime.getMilliseconds(),
				timezoneoffset:Math.ceil((datetime.getTimezoneOffset()/60)*100)
			}
		}
		date.__proto__=this.actions;
		return date;
	},
	fromUnix:function(code){
		code=Number(code)||0;
		var date={
			year:0,
			month:0,
			day:0,
			hours:0,
			minutes:0,
			seconds:0,
			miliseconds:0,
			timezoneoffset:0
		};
		if(code>0){
			let datetime=new Date(Number(code));
			if(datetime){
				date={
					year:datetime.getUTCFullYear(),
					month:datetime.getUTCMonth()+1,
					day:datetime.getUTCDate(),
					hours:datetime.getUTCHours(),
					minutes:datetime.getUTCMinutes(),
					seconds:datetime.getUTCSeconds(),
					miliseconds:datetime.getUTCMilliseconds(),
					timezoneoffset:0
				}
			}
		}
		date.__proto__=this.actions;
		return date;
	},
	parseFromString:function(str,offset){
		let date={
			year:0,
			month:0,
			day:0,
			hours:0,
			minutes:0,
			seconds:0,
			miliseconds:0,
			timezoneoffset:0
		}
		date.__proto__=this.actions;
		if(!str){
			return date;
		}
		str=str.trim();
		let str_data=str.match(new RegExp("(\\d\\d\\d\\d)[-\\./](\\d\\d)[-\\./](\\d\\d)"))
		if(str_data==null){
			str_data=str.match(new RegExp("(\\d\\d)[-\\./](\\d\\d)[-\\./](\\d\\d\\d\\d)"))
			if(str_data==null)return date;
			date.year=Number(str_data[3]);
			date.day=Number(str_data[1]);
		}else{
			date.year=Number(str_data[1]);
			date.day=Number(str_data[3]);
		}
		date.month=Number(str_data[2]);
		let time_data=str.match(new RegExp("(\\d\\d):(\\d\\d):(\\d\\d)\\.(\\d\\d\\d)([\\-\\+]?[\\d]+)$"))
		let time_type='full';
		if(time_data==null){
			time_data=str.match(new RegExp("(\\d\\d):(\\d\\d):(\\d\\d)([\\-\\+]?[\\d]+)$"));
			time_type='wtz';
			if(time_data==null){
				time_data=str.match(new RegExp("(\\d\\d):(\\d\\d):(\\d\\d)\\.(\\d\\d\\d)"))
				time_type='wms';
				if(time_data==null){
					time_type=null;
					time_data=str.match(new RegExp("(\\d\\d):(\\d\\d):(\\d\\d)"))
					if(time_data==null){
						time_data=str.match(new RegExp("(\\d\\d):(\\d\\d)"))
					}
				}
			}
		}
		if(time_data!=null){
			if(time_data[1])date.hours=Number(time_data[1]);
			if(time_data[2])date.minutes=Number(time_data[2]);
			if(time_data[3])date.seconds=Number(time_data[3]);
			if(time_type=='full'){
				if(time_data[4])date.miliseconds=Number(time_data[4]);
				if(time_data[5])date.timezoneoffset=Number(time_data[5]);
			}else if(time_type=='wtz'){
				if(time_data[4])date.timezoneoffset=Number(time_data[4]);
			}else if(time_type=='wms'){
				if(time_data[4])date.miliseconds=Number(time_data[4]);
			}
		}
		if(offset)date.timezoneoffset=Number(offset);
		return date;
	},
	fromString:function(str,offset){
		return dateUtil.parseFromString(str,offset);
	},
	parseFromLangDateString:function(str,offset){
		let date={
			year:0,
			month:0,
			day:0,
			hours:0,
			minutes:0,
			seconds:0,
			miliseconds:0,
			timezoneoffset:0
		}
		date.__proto__=this.actions;
		str=str.replace(new RegExp("\\s{1,}", "g"), "").toUpperCase();
		let str_data=str.match(new RegExp("(\\d\\d)([А-ЯA-Z]+)(\\d\\d\\d\\d)"))
		if(str_data==null){
			str_data=str.match(new RegExp("(\\d\\d\\d\\d)([А-ЯA-Z]+)(\\d\\d)"))
			if(str_data==null)return date;
			date.year=Number(str_data[1]);
			date.day=Number(str_data[3]);
		}else{
			date.year=Number(str_data[3]);
			date.day=Number(str_data[1]);
		}
		date.month=this.getMonthCode(str_data[2]);
		if(typeof date.month=='undefined'){
			console.log('====================',str_data[2]);
			date.month=0;
			return date;
		}
		let time_data=str.match(new RegExp("(\\d\\d):(\\d\\d):(\\d\\d)([\\-\\+]?[\\d]+)$"))
		let time_type='full';
		if(time_data==null){
			time_data=str.match(new RegExp("(\\d\\d):(\\d\\d)([\\-\\+]?[\\d]+)$"));
			time_type='min+oddset';
			if(time_data==null){
				time_type='min';
				time_data=str.match(new RegExp("(\\d\\d):(\\d\\d):(\\d\\d)"))
				if(time_data==null){
					time_data=str.match(new RegExp("(\\d\\d):(\\d\\d)"))
				}
			}
		}
		if(time_data!=null){
			if(time_data[1])date.hours=Number(time_data[1]);
			if(time_data[2])date.minutes=Number(time_data[2]);
			if(time_type=='full'){
				if(time_data[3])date.seconds=Number(time_data[3]);
				if(time_data[4])date.timezoneoffset=Number(time_data[4]);
			}else if(time_type=='min+oddset'){
				if(time_data[3])date.timezoneoffset=Number(time_data[3]);
			}else if(time_type=='min'){
				if(time_data[3])date.miliseconds=Number(time_data[3]);
			}
		}
		if(offset)date.timezoneoffset=Number(offset);
		return date;
	},
	actions:{
		toString:function(expr){
			if(!expr||(expr&&expr==''))expr='y-m-d h:i:s.nZ';
			let result=expr.toUpperCase();
			result=result.replace("D",((this.day<10)?'0':'')+this.day);
			result=result.replace("M",((this.month<10)?'0':'')+this.month);
			result=result.replace("Y",((this.year<1000)?'0':'')+((this.year<100)?'0':'')+((this.year<10)?'0':'')+this.year);
			result=result.replace("H",((this.hours<10)?'0':'')+this.hours);
			result=result.replace("I",((this.minutes<10)?'0':'')+this.minutes);
			result=result.replace("S",((this.seconds<10)?'0':'')+this.seconds);
			result=result.replace("N",((this.miliseconds<100)?'0':'')+((this.miliseconds<10)?'0':'')+this.miliseconds);
			if(this.timezoneoffset>-1){
				result=result.replace("Z",'+'+((this.timezoneoffset<1000)?'0':'')+((this.timezoneoffset<100)?'0':'')+((this.timezoneoffset<10)?'0':'')+this.timezoneoffset);
			}else if(this.timezoneoffset<0){
				this.timezoneoffset*-1;
				result=result.replace("Z",'-'+((this.timezoneoffset<1000)?'0':'')+((this.timezoneoffset<100)?'0':'')+((this.timezoneoffset<10)?'0':'')+this.timezoneoffset);
			}
			return result;
		},
		toUnix:function(){
			let dateString=this.toString('Y-M-D H:I:S.NZ');
			if(dateString=='0000-00-00 00:00:00.000+0000')return 0;
			return +Date.parse(this.toString('Y-M-D H:I:S.NZ'));
		},
		toDate:function(){
			let dateString=this.toString('Y-M-D H:I:S.NZ');
			if(dateString=='0000-00-00 00:00:00.000+0000')return null;
			return new Date(Date.parse(this.toString('Y-M-D H:I:S.NZ')));
		},
		getWeekDay:function(){
			let dateString=this.toString('Y-M-D H:I:S.NZ');
			if(dateString=='0000-00-00 00:00:00.000+0000')return null;
			let date=new Date(Date.parse(this.toString('Y-M-D H:I:S.NZ')));
			return dateUtil.wd[date.getDay()];
		},
		getMonthString:function(){
			return dateUtil.monthString[this.toString('M')];
		},
		getMonthStringOfDay:function(){
			return dateUtil.monthStringOfDay[this.toString('M')];
		},
		getDaysInMonth:function(){
			return this.toDate().getDaysInMonth();
		}
	}
};
module.exports=dateUtil;