/////////////////////////////////////////////////////////////////////////////////////////////////////////
	const postgresLib=require('pg');
	var dateUtil=require(__path+"lib/dateUtil.lib.js");
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var postgresTools = {
	newPostgresPool:function(datadase){
		return new postgresLib.Pool({
			host: config.postgres[datadase].host,
			port: config.postgres[datadase].port,
			user: config.postgres[datadase].user,
			password: config.postgres[datadase].password,
			database: (config.postgres[datadase].db)?config.postgres[datadase].db.toLowerCase():datadase.toLowerCase()
		});
	},
	newPostgresClient:function(datadase){
		return new postgresLib.Client({
			host: config.postgres[datadase].host,
			port: config.postgres[datadase].port,
			user: config.postgres[datadase].user,
			password: config.postgres[datadase].password,
			database: datadase.toLowerCase()
		});
	},
	postgresConnect:function(database,callback){
		database.connect((err, client, release) => {if(err){console.log('# postgres DB connecting error: ',err);exit();}else{
			if(typeof callback=='function')callback();
		}});
	},
	insert:function(DB,table,values,returning,callback){
		callback=callback||null;
		returning=returning||null;
		if(typeof returning=='function'){
			callback=returning;
			returning=null;
		}
		let cols=[];
		let vals_id=[];
		let vals=[];
		let i=1;
		for(let key in values){
			let keyname=key
			if(!keyname.includes('"'))keyname='"'+keyname+'"';
			cols.push(keyname);
			vals_id.push('$'+i);
			i++;
			if(values[key] instanceof Date){
				vals.push(values[key]);
			}else if(typeof values[key]=='object'){
				vals.push(JSON.stringify(values[key]));
			}else{
				vals.push(values[key]);
			}
		}
		if(returning){
			returning=returning.trim();
			if(returning!='*'&&!returning.includes('"')){
				let returning_list=returning.split(',');
				for(let i in returning_list){
					returning_list[i] = '"'+returning_list[i].trim()+'"';
				}
				returning=returning_list.join(', ');
			}
		}
		let reqest='INSERT INTO "'+table+'"('+cols.join(', ')+') VALUES('+vals_id.join(', ')+') ON CONFLICT DO NOTHING '+((returning)?'RETURNING '+returning:'')+';';
		//console.log({text: reqest,values: vals});
		DB.query({text: reqest,values: vals},function(err,req){
			if(typeof callback=='function')callback(err,req);
			else if(err)console.log(err);
		});
	},
	update:function(DB,table,values,where,returning,callback){
		callback=callback||null;
		returning=returning||null;
		where=where||null
		if(typeof returning=='function'){
			callback=returning;
			returning=null;
		}
		if(typeof where=='function'){
			callback=where;
			returning=null;
			where=null;
		}
		let vals=[];
		for(let key in values){
			let val='"'+key+'"=';
			if(typeof values[key]=='number')val+=values[key];
			else if(typeof values[key]=='string'){
				if(values[key].includes('\''))val+='$columnValue$'+values[key]+'$columnValue$';
				else val+='\''+values[key]+'\'';
			}else if(values[key]===null){
				continue;
			}else if(values[key] instanceof Date){
				val+='\''+dateUtil.fromDate(values[key]).toString("Y-M-DTh:i:s.nZ")+'\'';
			}else{
				val+='$columnValueJSON$'+JSON.stringify(values[key])+'$columnValueJSON$';
			}
			vals.push(val);
		}
		if(returning){
			returning=returning.trim();
			if(returning!='*'&&!returning.includes('"')){
				let returning_list=returning.split(',');
				for(let i in returning_list){
					returning_list[i] = '"'+returning_list[i].trim()+'"';
				}
				returning=returning_list.join(', ');
			}
		}
		let reqest='UPDATE "'+table+'" SET '+vals.join(', ')+' '+((where&&where!='')?where:'')+' '+((returning)?'RETURNING '+returning:'')+';';
		//console.log(reqest);
		DB.query(reqest,function(err,req){
			if(typeof callback=='function')callback(err,req);
			else if(err)console.log(err);
		});
	},
};
module.exports=postgresTools;