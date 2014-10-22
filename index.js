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

client.hgetall("users", function (err, obj) {
    console.dir(obj);
});

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
			console.log('UserID is ' + reply);
			var users = client.hset('users', reply, name);

			client.hget('users', reply, function(err, name){
				console.log("User " + reply + " is called " + name);
				//refactor to use set instead
				client.sadd('chatters', name, function(){
					console.log('Adding ' + name + ' to chatters.');
					client.smembers('chatters', function(err,data){
						console.log('emitting: ', data);
						io.sockets.emit('chatters', data);
					});
				});
			});			
		});

		console.log('a user connected');
		socket.emit('chat message', "Welcome to Friendly Chat, " + name + "!");
		socket.broadcast.emit('user connection', name);

		var numUsers = client.get('userCount', function(err, reply){
			console.log("Number connected: " + reply);
//			io.sockets.emit('chat message', "There are " + reply + " users in the room.");
			client.incr('userCount');
		});
	});
	
	socket.on('disconnect', function(){
		client.decr('userCount');
		io.sockets.emit('user disconnection', socket.username);
		client.srem('chatters', socket.username, function(error, data){
			console.log('removing ' + socket.username);
			client.smembers('chatters', function(err,data){
				console.log('emitting: ', data);
				io.sockets.emit('chatters', data);
			});
		});
	})

	socket.on('chat message', function (msg) {
		client.set("pronto", msg);
		client.get("pronto", function(err, reply){
			console.log("Reply: " + reply);
		});
			io.emit('chat message', msg);
		});
});

http.listen(8080, function(){
	console.log('listening on *:8080');
});
