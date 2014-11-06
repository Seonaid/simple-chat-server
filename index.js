// server side scripting for chat app

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var numUsers = 0;

var messages = [];
var storeMessage = function(name, data){
	messages.push({name: name, data: data});
	if (messages.length > 10) {
		messages.shift();
	}
}

var redis = require ("redis");
var client = redis.createClient();

var clear = client.set('userCount', 1);
var clear = client.del('chatters');

/*
client.hgetall("users", function (err, obj) {
//    console.dir(obj);
//    console.log('this is where we will validate');
});
*/

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use('/', express.static(__dirname + '/public'));

app.use("/assets", express.static(__dirname + '/assets'));

io.on('connection', function(socket){
	client.setnx('userId', 1000);

	socket.on('join', function(name){
		client.incr('userId');
		socket.username = name;
		var userId = client.get('userId', function(err, reply){
			var users = client.hset('users', reply, name);
			//send list of currently connected users
			client.hget('users', reply, function(err, name){
				client.sadd('chatters', name, function(){
					client.smembers('chatters', function(err,data){
						io.sockets.emit('chatters', data);
					});
				});
			});
// send list of last 15 messages
			client.lrange('message_list', -14, -1, function(err, reply){
				for(i = 0; i < reply.length; i ++) {
//					console.log(i + ' = ' + reply[i]);
					socket.emit('chat message', reply[i]);
				}
				
			});

		});

		socket.emit('chat message', "Welcome to Friendly Chat, " + name + "!");
		socket.broadcast.emit('user connection', name);

		var numUsers = client.get('userCount', function(err, reply){
			client.incr('userCount');
		});
	});
	
	socket.on('disconnect', function(){
		client.decr('userCount');
		io.sockets.emit('user disconnection', socket.username);
		client.srem('chatters', socket.username, function(error, data){
			client.smembers('chatters', function(err,data){
				io.sockets.emit('chatters', data);
			});
		});
	})

	socket.on('chat message', function (msg) {
		client.rpush("message_list", msg);
		client.expire("message_list", 3600); // entire list will disappear 1 hour after the conversation is done.
/*
		client.lrange("message_list", 0, -1, function(err, reply){
			console.log(reply);
		});
*/
		io.emit('chat message', msg);
		});

	socket.on('newUser', function(name, password){
		console.log("Checking for " + name + password);
		client.exists(name, function(error, exists){
//			console.log(name + exists);
			socket.emit('validate name', name, !exists);
			if(!exists) { // if the name is not already in use, make a new record
				client.get("my_new_user", function(error, reply){
					var hashName = "user:" + reply;
					client.set(name, reply); //now we can look up by username
					client.hmset(hashName, "name", name); // and we can then look up username:Id
					client.hmset(hashName, "password", password);
					client.incr("my_new_user");
				});
				console.log("hi " + name);
 // user logged in... should this be a separate step? I still need to add sessions and cookies and all that jazz
			} else {
				console.log("User already exists.");  // need to add this to the login screen.
			} // end of if structure
		}); // end of client.exists
	}); // end of 'newUser'

	socket.on('login', function(username, password){
		console.log(username, password);
		client.exists(username, function(error, exists){
			if(!exists){
				socket.emit('login-message', false); //if the user is not registered
			} else {
				client.get(username, function(error, reply){
					hashName = "user:" + reply;
					console.log("Looking in " + hashName);
					client.hget(hashName, "password", function(error, reply){
						console.log("password is " + password);
						console.log("returned is " + reply);
						if(reply === password){
							socket.emit('login-message', username, true); // success!
						} else {
							socket.emit('login-message', username, false); // if the password is wrong
						}
					}); // end of looking up password
				}); // end of looking up username
			} // end of if structure for whether the username exists
		}); 
	}); // end of login
});

http.listen(8080, function(){
	console.log('listening on *:8080');
});
