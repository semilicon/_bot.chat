/////////////////////////////////////////////////////////////////////////////////////////////////////////
	const __pathLib = require('path');
	const fs = require('fs');
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var include={};
include.actionsTree=function(path,parentAction){
	var ACTIONS=[];
	var dir_element = fs.readdirSync(path);
	parentAction=parentAction||'';
	for (int in dir_element) {
		if(fs.statSync(path+'/'+dir_element[int]).isDirectory()){
			if(dir_element[int]=='lib'||dir_element[int]=='libs'||dir_element[int]=='class'||dir_element[int]=='classes')continue;
			if(fs.existsSync(path+'/'+dir_element[int]+'/main.js')){
				ACTIONS[((parentAction!='')?parentAction+'/':'')+dir_element[int]] = require(path+'/'+dir_element[int]+'/main.js');
				ACTIONS[((parentAction!='')?parentAction+'/':'')+dir_element[int]].isMain=true;
			}else if(fs.existsSync(path+'/'+dir_element[int]+'/index.js')){
				ACTIONS[((parentAction!='')?parentAction+'/':'')+dir_element[int]] = require(path+'/'+dir_element[int]+'/index.js');
				ACTIONS[((parentAction!='')?parentAction+'/':'')+dir_element[int]].isMain=true;
			}
			let subActions=include.actionsTree(path+'/'+dir_element[int],((parentAction!='')?parentAction+'/':'')+dir_element[int]);
			for (subInt in subActions) {
				ACTIONS[subInt]=subActions[subInt];
			}
		}else if(fs.statSync(path+'/'+dir_element[int]).isFile() && __pathLib.extname(dir_element[int])=='.js' && dir_element[int]!='main.js'){
			ACTIONS[((parentAction!='')?parentAction+'/':'')+__pathLib.basename(dir_element[int],'.js')] = require(path+'/'+dir_element[int]);
		}else if(fs.statSync(path+'/'+dir_element[int]).isFile() && __pathLib.extname(dir_element[int])=='.js' && dir_element[int]=='main.js' && parentAction==''){
			ACTIONS['main'] = require(path+'/'+dir_element[int]);
		}
	}
	return ACTIONS;
}
include.actions=function(path){
	var ACTIONS=[];
	formatFile=formatFile||false;
	var dir_element = fs.readdirSync(path);
	for (int in dir_element) {
		if(fs.statSync(path+'/'+dir_element[int]).isFile() && __pathLib.extname(dir_element[int])=='.js' && dir_element[int]!='main.js'){
			ACTIONS[__pathLib.basename(dir_element[int],'.js')] = require(path+'/'+dir_element[int]);
		}
	}
	return ACTIONS;
}
module.exports=include;
