var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use("/script.js", express.static(__dirname + '/script.js'));
app.use("/stylesheet.css", express.static(__dirname + '/stylesheet.css'));
app.use("/style.css", express.static(__dirname + '/style.css'));

io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('chat message', function (msg) {
		io.emit('chat message', msg);
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});