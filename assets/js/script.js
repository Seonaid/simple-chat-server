// client side scripting for chat app

   // remember: localName is global in scope. In future iterations, it should be passed by a login script.
var socket = io();

/*
server.on('connect', function(data){
	localName = prompt("How do you call yourself?");
	server.emit('join', localName);
});
*/

function changeUser (nickName) {
	// nickName is only scoped within changeUser... using assignment to put it back into global localName
	localName = nickName;
	var newText = document.createTextNode("What do you have to say for yourself, " + nickName + "?");
	var something = document.getElementById("msgDescription").lastChild; 
	// alert(something);
	document.getElementById("msgDescription").replaceChild(newText, something);
 //  	socket.emit('name change', localName + ':' + nickName);
	document.getElementById("m").focus();
}

function sendMessageToServer(){
 // put the code for emitting the chat message here
 		var purple = $('#m').val();
		if (validateMessage(purple)){
			socket.emit('chat message', localName + ': ' + $('#m').val());
			$('#m').val('');
			return false;
		} else{
			$('#m').val('');
			return false;
		}
}

function validateMessage(msg) {
// check whether the message is blank, or is a "command" (starting with '/')
	if(msg === "" || msg === '\n'){
			alert('Nothing to say?')
			return false;
	} else{
		if (msg[0] != '/'){
			return true;
		} else{
			if (msg.substring(0,5) === "/nick"){
				// change name
				if (msg.substring(5,msg.length) != ""){
					if(confirm("Changing name to" + msg.substring(5,msg.length))){
						changeUser(msg.substring(5,msg.length));
					}
				} else {
					alert('Name cannot be blank.');
				}
				return false;
			} 
			else{
				alert('Command not available');
				return false;
			}
		}
	}
}

// listen for messages
$('#top-section').on("click", "button", sendMessageToServer);
$('#top-section').on("keydown", function(event){
	var key = event.keyCode;
	if (key === 13) {
		sendMessageToServer();
	}
});

$('#login-register').on("click", "a", function(event){
	event.preventDefault();
	$(this).closest("#login-register").find(".login-button").toggleClass("hidden");
	$(this).closest("#login-register").find("a").toggleClass("hidden");
	$("#response").text("");
});

$('#login-register').on("click", "button", function(event){
	if($(this).val() === "Register"){
		var tryUser = $('#username').val();
		var tryPassword = $('#password').val();
		socket.emit('newUser', tryUser, tryPassword);
		alert(tryUser);
	} else {
		var tryUser = $('#username').val();
		var tryPassword = $('#password').val();
		socket.emit('login', tryUser, tryPassword);
	}

});

// refactor the next two functions to do the same thing but with a "message" parameter

/* socket.on('validate name', function(name, valid){
//	alert("received a " + valid);
	if(valid){
		// log in and make chat area visible
		$("#messageInput").toggleClass("hidden");
		$(".wideSide").toggleClass("hidden");
		localName = name;
		var newText = document.createTextNode("What do you have to say for yourself, " + name + "?");
		var something = document.getElementById("msgDescription").lastChild; 
		// alert(something);
		document.getElementById("msgDescription").replaceChild(newText, something);
		socket.emit('join', name);
	} else {
		$("#response").text('Name is in use.');
	}
}); // end of 'validate name'
*/

socket.on('login-message', function(name, valid, content){
	alert("received a " + valid + "for user" + name + content);
	if(valid){
		$("#messageInput").toggleClass("hidden");
		$(".wideSide").toggleClass("hidden");
		socket.emit('join', name);
		localName = name;
		var newText = document.createTextNode("What do you have to say for yourself, " + name + "?");
		var something = document.getElementById("msgDescription").lastChild; 
		// alert(something);
		document.getElementById("msgDescription").replaceChild(newText, something);
	} else {
		$("#response").text(content);
	}

});// end of login-message

socket.on('chat message', function(msg){
	$('#messages').prepend($('<li>').text(msg));
});

socket.on('user connection', function(name){
	$('#messages').prepend($('<li>').text(name + ' just joined!'));
});
/*
socket.on('name change', function(names){
	var res = names.split(':');
	$('#messages').prepend($('<li>').text(res[0] + "changed their name to " + res[1]));
}); */

socket.on('user disconnection', function(name){
	$('#messages').prepend($('<li>').text(name + ' left the chat.'));
});

socket.on('chatters', function(chatters){
	document.getElementById("chatlist").textContent = "Currently here: ";

	for (i = 0; i <= chatters.length; i++) {
		$('#chatlist').append($('<p>').text(chatters[i]));
	}
});

/*
socket.on('name change', function(n1, n2){
	$('#messages').prepend($('<li>').text(n1 + "changed name to " + n2));
})
*/

