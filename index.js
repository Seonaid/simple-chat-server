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

app.use("/assets", express.static(__dirname + '/assets'));

io.on('connection', function(socket){
	client.setnx('userId', 1000);

	socket.on('join', function(name){
		client.incr('userId');
		socket.username = name;
		var userId = client.get('userId', function(err, reply){
			var users = client.hset('users', reply, name);
			client.hget('users', reply, function(err, name){
				client.sadd('chatters', name, function(){
					client.smembers('chatters', function(err,data){
						io.sockets.emit('chatters', data);
					});
				});
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
		client.lpush("message_list", msg);
		client.lrange("message_list", 0, -1, function(err, reply){
			console.log(reply);
		});
		io.emit('chat message', msg);
		});
});

http.listen(8080, function(){
	console.log('listening on *:8080');
});
