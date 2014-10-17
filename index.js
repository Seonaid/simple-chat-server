// server side scripting for chat app

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var numUsers = 0;

var redis = require ("redis");
var client = redis.createClient();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use("/assets", express.static(__dirname + '/assets'));

io.on('connection', function(socket){
	console.log('a user connected');
	io.emit('user connection');
	client.setnx('userCount', 1);

	numUsers = client.get('userCount', function(err, reply){
		console.log("Number connected: " + reply);
		client.incr('userCount');
	});
	
	socket.on('disconnect', function(){
		client.decr('userCount');
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
