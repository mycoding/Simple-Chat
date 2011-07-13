http = require('http');
url = require('url');
sys = require('sys');

clients = {};
messages = [];
	
function RandomString(length){
	var str = '';
	for ( ; str.length < length; str += Math.random().toString(36).substr(2) );
	return str.substr(0, length);
}

function getUsersOnline(){
	var users_online_str = [];
	for(var p in clients){// Возможное место сбоя. Надо проверить.
		users_online_str.push(p);
	}
			
	return JSON.stringify(users_online_str);
}

http.createServer(function(req, res){
  	var parsed = url.parse(req.url,true),
		callback = parsed.query.callback;
		
	if(!callback){
		var answer = callback+"({success:false,error:\"Wasn't get name callback function for cross-domain.\"})";
		endConnection(answer);
	}
	var action = parsed.query.action;

	console.log(action);

	switch(action){
		case 'login':
			var login = parsed.query.login;
			if(!login){
				var answer = callback+"({success:false,error:'Login wasn\'t get on the server.'})";
				res.end(answer);
				break;
			}
			
			if(clients[login]){
				var answer = callback+"({success:false,error:'This login is busy. Choose another.'})";
				res.end(answer);
				break;
			}
			
			var str_msgs = " ",
				last_20msgs;
			
			if(messages.length>20){
				last_20msgs = messages.slice(-20);
			}
			else{
				last_20msgs = messages;
			}
			
			last_20msgs.forEach(function(v){
				str_msgs+="{login:'"+v.login+"',msg:'"+v.msg+"'},";
			});		
			str_msgs[str_msgs.length-1] = ' ';
						
			for(var p in clients){// Возможное место сбоя. Надо проверить.
				console.log(p);
				try{
					var answer = clients[p].callback + "({status:'success',login:'Server',action_server:'join',msg:'"+login+"'})";
					clients[p].res.end(answer);
				}
				catch(e){
					console.log('Ошибка');
					console.log(e);
				}
			}
			
			var sid = +new Date()+"_"+RandomString(5),
				answer = callback+"({success:true,sid:'"+sid+"',msgs:["+str_msgs+"],users_online:"+getUsersOnline()+"})";
			
			clients[login] = {
				last_activity:+new Date(),
				sid:sid
			};
			
			res.end(answer);
			//console.log(clients);			
			break;
		case 'getMessage':
			var login = parsed.query.login,
				sid = parsed.query.sid;
			if(!login){
				var answer = callback+"({success:false,error:'Login wasn\'t get on the server.'})";
				res.end(answer);
				break;
			}
			
			if(!sid){
				var answer = callback+"({success:false,error:'Sid wasn\'t get on the server.'})";
				res.end(answer);
				break;
			}
			
			if(!clients[login]){
				var answer = callback+"({success:false,error:'This login does not exist'})";
				res.end(answer);
				break;
			}
			
			if(clients[login].sid!=sid){
				var answer = callback+"({success:false,error:'Send sid does not equal sid of login'})";
				res.end(answer);
				break;
			}
			else{
				clients[login]['res']=res;
				clients[login]['callback']=callback;
				clients[login]['last_activity'] = +new Date();
			}
			
			setTimeout(function(){// Возможное место сбоя. Надо проверить и переписать.
				var answer = callback+"({status:'success',reconnect:true})";
				try{
					res.end(answer);
				}
				catch(e){
					console.log('Ошибка');
					console.log(e);
				}
			},25000);
			
			break;
		case 'sendMessage':
			var login = parsed.query.login,
				sid = parsed.query.sid,
				msg = parsed.query.msg;
			
			if(!login){
				var answer = callback+"({success:false,error:'Login wasn\'t get on the server.'})";
				res.end(answer);
				break;
			}
			
			if(!sid){
				var answer = callback+"({success:false,error:'Sid wasn\'t get on the server.'})";
				res.end(answer);
				break;
			}
			
			if(!clients[login]){
				var answer = callback+"({success:false,error:'This login does not exist'})";
				res.end(answer);
				break;
			}
			
			if(clients[login].sid!=sid){
				var answer = callback+"({success:false,error:'Send sid does not equal sid of login'})";
				res.end(answer);
				break;
			}
			
			if(!msg){
				var answer = callback+"({success:false,error:'Message wasn\'t get on the server.'})";
				res.end(answer);
				break;
			}
			
			for(var p in clients){// Возможное место сбоя. Надо проверить.
				try{
					var answer = clients[p].callback + "({status:'success',login:'"+login+"',msg:'"+msg+"'})";
					clients[p].res.end(answer);
				}
				catch(e){
					console.log('Ошибка');
					console.log(e);
				}
			}
			
			messages.push({login:login,msg:msg});
			var answer = callback+"({status:'success'})";
			res.end(answer);
			break;
		case 'getUsersOnline':
			console.log('IN');
			console.log(+new Date());
			var login = parsed.query.login,
				sid = parsed.query.sid,
				msg = parsed.query.msg;
			
			if(!login){
				var answer = callback+"({success:false,error:'Login wasn\'t get on the server.'})";
				res.end(answer);
				break;
			}
			
			if(!sid){
				var answer = callback+"({success:false,error:'Sid wasn\'t get on the server.'})";
				res.end(answer);
				break;
			}
			
			if(!clients[login]){
				var answer = callback+"({success:false,error:'This login does not exist'})";
				res.end(answer);
				break;
			}
			
			if(clients[login].sid!=sid){
				var answer = callback+"({success:false,error:'Send sid does not equal sid of login'})";
				res.end(answer);
				break;
			}
			
			var users_online_str = '';
			
			for(var p in clients){// Возможное место сбоя. Надо проверить.
				users_online_str+= p +" ";
			}
			
			var answer = callback + "({status:'success',login:'<b>Server</b>',msg:'Users onlines - "+users_online_str+"'})";
			res.end(answer);
			console.log('OUT');
			console.log(+new Date());
			break;
		default:			
			var answer = callback+"({success:false,'text':'This action is not defined'})";
			res.end(answer);
	}
	
}).listen(1337, "127.0.0.1");

setInterval(function(){
	var now = + new Date(),
		users_left = [];
	for(var p in clients){// Возможное место сбоя. Надо проверить.
		//console.log(now-clients[p].last_activity);
		if(now-clients[p].last_activity>30000){
			users_left.push(p);
			delete clients[p];
		}
	}
	
	if(users_left.length){
		for(var p in clients){// Возможное место сбоя. Надо проверить.
			//console.log(p);
			try{
				var answer = clients[p].callback + "({status:'success',login:'Server',action_server:'left',msg:"+JSON.stringify(users_left)+"})";
				clients[p].res.end(answer);
			}
			catch(e){
				console.log('Ошибка');
				console.log(e);
			}
		}
	}
},1000);