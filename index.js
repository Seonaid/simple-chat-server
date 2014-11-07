// server side scripting for chat app

// server creation and routing
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var numUsers = 0;

// redis used as data storage

var redis = require ("redis");
var client = redis.createClient();

// cryptography for password hashing
var bcrypt = require('bcrypt');

// reset current numbers of users and list of chatters when the chat app is started
var clear = client.set('userCount', 0);
var clear = client.del('chatters');
var clear = client.setnx('my_new_user', 1000);

// deal with routing
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use("/assets", express.static(__dirname + '/assets'));

// socket.io messages to and from users

io.on('connection', function(socket){
	
	socket.on('join', function(name){
		socket.username = name;

		client.incr('userCount');
		client.get('userCount', function(err, reply){
			console.log("counting" + reply);
		});

		client.sadd('chatters', name, function(){
			client.smembers('chatters', function(err,data){
				io.sockets.emit('chatters', data);
			}); // emit current list of chatters to entire connected group
		});

		// send last 15 messages when somebody connects
		client.lrange('message_list', -14, -1, function(err, reply){
			for(i = 0; i < reply.length; i ++) {
				socket.emit('chat message', reply[i]);
			}	
		}); // end of list of the last 15 messages

		// welcome new user and emit message that they have joined to other users
		socket.emit('chat message', "Welcome to Friendly Chat, " + name + "!");
		socket.broadcast.emit('user connection', name);
		var something = client.get('userCount', function(err, reply){
			console.log('userCount is ' + something + " or " + reply);
		});
	});
	
	socket.on('disconnect', function(){ 
		// when a user disconnects, remove them from list and subtract 1 from the number of users
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
		io.emit('chat message', msg);
	});

	socket.on('newUser', function(name, password){
		console.log("Checking for " + name + password);
		client.exists(name, function(error, exists){
			console.log(name + exists);
			var content = "Name is in use."
			socket.emit('login-message', name, !exists, content); //if the user is not registered
			if(!exists) { // if the name is not already in use, make a new record
				client.get("my_new_user", function(error, reply){
					var hashName = "user:" + reply;
					client.set(name, reply); //now we can look up by username
					client.hmset(hashName, "name", name); // and we can then look up username:Id
					// now we're going to hash the password... 
					bcrypt.genSalt(10, function(err, salt){
//						client.hmset(hashName, "salt", salt);
						bcrypt.hash(password, salt, function(err, hash){
							client.hmset(hashName, "hash", hash);
						});
					});
//					client.hmset(hashName, "password", password);
					client.incr("my_new_user");
				});
				console.log("hi " + name);
 // user logged in... should this be a separate step? I still need to add sessions and cookies and all that jazz
			} else {
				console.log("User already exists.");
			} // end of if structure
		}); // end of client.exists
	}); // end of 'newUser'

	socket.on('login', function(name, password){
		console.log(name, password);
		client.exists(name, function(error, exists){
			if(!exists){
				var content = "Login unsuccessful."
				socket.emit('login-message', name, false, content); //if the user is not registered
			} else {
				client.get(name, function(error, reply){
					hashName = "user:" + reply;
					console.log("Looking in " + hashName);
					client.hget(hashName, "hash", function(error, reply){
						console.log("password is " + password);
						console.log("returned is " + reply);
						bcrypt.compare(password, reply, function(err, res) {
	 						if(res){
								socket.emit('login-message', name, true); // success!
							} else {
								var content = "Login unsuccessful."
								socket.emit('login-message', name, false, content); // if the password is wrong
							}
						});

					}); // end of looking up password
				}); // end of looking up username
			} // end of if structure for whether the username exists
		}); 
	}); // end of login
});

http.listen(8080, function(){
	console.log('listening on *:8080');
});
