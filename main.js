__path=__dirname+'/bin/'; //save work directory
PS=require(__path+"lib/promisify.lib.js");//promisify
const cluster = require('cluster');//connect cluster
if(cluster.isMaster){
    const fs = require('fs');
    const config = require('./config.json');
    cluster.on('exit', (brokenFork, code, signal) => {
      console.log('Worker #'+brokenFork.id+' exterminated;');
      let fork=cluster.fork({role:brokenFork.role});
      forks[fork.id]=fork;
      forks[fork.id].role=brokenFork.role;
      delete forks[brokenFork.id];
    });
    var forks=[];
    let fork=cluster.fork({role:'telegramBot'});
		forks[fork.id]=fork;
    forks[fork.id].role='telegramBot';
    const killForks=function(){for (const i in forks) {forks[i].process.kill();}};//функция завершения работы forks
    if(config.developerMode){
      var allFiles={};
      var addAllFiles=function(path){
        var dir_es = fs.readdirSync(path);
        for (let i in dir_es) {
          let stat=fs.statSync(path+dir_es[i]);
          allFiles[path+dir_es[i]]=+stat.ctime;
          if(stat.isDirectory())addAllFiles(path+dir_es[i]+'/');
        }
      };
      allFiles[__path]=+fs.statSync(__path).ctime;
      addAllFiles(__path);
      var binChanges=function(){
        for (let i in allFiles) {
          if(+fs.statSync(i).ctime!=allFiles[i]){
            reloadApp();
            break;
          }
        }
      };
      var reloadApp=function(){
        console.log('#reloadApp;');
        allFiles={};
        allFiles[__path]=+fs.statSync(__path).ctime;
        addAllFiles(__path);
        killForks();
      }
      setInterval(binChanges, 1000);
    }
}else if(cluster.isWorker&&process.env['role']=='telegramBot'){
  //process.env['NODE_ENV'] = 'development';
  //process.env['DEBUG'] = 'bot:*';
  require = require("esm")(module/*, options*/)
  process.chdir(__path);// set work directory to App directory
  require(__path+'index.js');
}