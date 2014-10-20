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

client.hgetall("users", function (err, obj) {
    console.dir(obj);
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use("/assets", express.static(__dirname + '/assets'));

io.on('connection', function(socket){
	console.log('a user connected');
	socket.emit('chat message', "Welcome to Friendly Chat!");
	socket.broadcast.emit('user connection');
	client.setnx('userCount', 1);
	client.setnx('userId', 1000);
	client.incr('userId');

	socket.on('join', function(name){
		var userId = client.get('userId', function(err, reply){
			console.log('UserID is ' + reply);
			var users = client.hset('users', name, reply);

			client.hget('users', name, function(err, reply){
				console.log(name + " is user " + reply);
			});
		});


	
	});

	numUsers = client.get('userCount', function(err, reply){
		console.log("Number connected: " + reply);
		io.sockets.emit('chat message', "There are " + reply + " users in the room.");
		client.incr('userCount');
		console.log('once!');
	});
	
	socket.on('disconnect', function(){
		client.decr('userCount');
		io.sockets.emit('user disconnection');
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
