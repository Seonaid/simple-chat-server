// client side scripting for chat app
var socket = io(); // create connection to socket.io

function sendMessageToServer(){
 // emitting the chat message
	var newMessage = $('#m').val();
	if (validateMessage(newMessage)){
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
		} else if(msg.substring(0,3) === '/w ') {
			msg = msg.substring(3);
			alert("Whisper!" + msg);
			return true;
		} else {
			alert('Command not available');
			return false;
		}
	}
}

function sendChoice(clicked_id){
    var msg = prompt("Private message to " + clicked_id);
    if(msg != ""){
    	socket.emit('private message', clicked_id, msg);
	} else {
		alert("please type a message");
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

// switch between login and registration options
$('#login-register').on("click", "a", function(event){
	event.preventDefault();
	$(this).closest("#login-register").find(".login-button").toggleClass("hidden");
	$(this).closest("#login-register").find("a").toggleClass("hidden");
	$("#response").text("");
});

// submit registration or login to server for processing
$('#login-register').on("click", "button", function(event){
	if($(this).val() === "Register"){
		var tryUser = $('#username').val();
		var tryPassword = $('#password').val();
		socket.emit('newUser', tryUser, tryPassword);
	} else {
		var tryUser = $('#username').val();
		var tryPassword = $('#password').val();
		socket.emit('login', tryUser, tryPassword);
	}

});

// when login or registration is successful, show chat messages. Otherwise, display error msg.
socket.on('login-message', function(name, valid, content){
//	alert("received a " + valid + "for user" + name + content);
	if(valid){
		localName = name;		
		socket.emit('join', name);
		// display message input and messages section
		$("#messageInput").toggleClass("hidden");
		$(".wideSide").toggleClass("hidden");
		// add name to prompt at top of page
		var newText = document.createTextNode("What do you have to say for yourself, " + name + "?");
		var something = document.getElementById("msgDescription").lastChild; 
		// alert(something);
		document.getElementById("msgDescription").replaceChild(newText, something);
	} else {
		// display error message
		$("#response").text(content);
	}
});// end of login-message

// add new messages to the top of the list
socket.on('chat message', function(msg){
	$('#messages').prepend($('<li>').text(msg));
});

// alerts for new users joining
socket.on('user connection', function(name){
	$('#messages').prepend($('<li>').text(name + ' just joined!'));
});

// alert for users leaving
socket.on('user disconnection', function(name){
	$('#messages').prepend($('<li>').text(name + ' left the chat.'));
});

// updates the current list of participants
socket.on('chatters', function(chatters){
	document.getElementById("chatlist").textContent = "Currently here: ";

	for (i = 0; i < chatters.length; i++) {
		var element = document.createElement("div");
		element.id = chatters[i];

		if(chatters[i] != localName){
// make names clickable to send private messages
			element.onclick = function() {
	        	sendChoice(this.id);
	    	};
	    	element.onmouseover = function(){
	    		$(this).css("color", "black");
			};

	    	element.onmouseleave = function(){
	    		$(this).css("color", "#fafafa");
			};
		}
    	
    	element.innerHTML = chatters[i];

		$('#chatlist').append(element);
	}
});
