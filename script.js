var userName = "";   // remember: userName is global in scope. In future iterations, it should be passed by a login script.

// Check whether user is "logged in" (in fact, at this point, just whether a userName exists)
if (!userName) {
	var userName = prompt("What is your name?");
	changeUser(userName);
}

function changeUser (nickName) {
	// nickName is only scoped within changeUser... using assignment to put it back into global userName
	userName = nickName;
	var newText = document.createTextNode("What do you have to say for yourself, " + nickName + "?");
	var something = document.getElementById("msgDescription").lastChild; 
	// alert(something);
	document.getElementById("msgDescription").replaceChild(newText, something);
	document.getElementById("m").focus();
}

var socket = io();
$('form').submit(function(){
	socket.emit('chat message', userName + ': ' + $('#m').val());
	$('#m').val('');
	return false;
});
socket.on('chat message', function(msg){
	$('#messages').append($('<li>').text(msg));
})

