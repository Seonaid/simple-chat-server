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
 //  	socket.emit('name change', userName + ':' + nickName);
	document.getElementById("m").focus();
}

var socket = io();
$('form').submit(function(){
	var purple = $('#m').val();
	if (validateMessage(purple)){
		socket.emit('chat message', userName + ': ' + $('#m').val());
		$('#m').val('');
		return false;
	} else{
		$('#m').val('');
		return false;
	}
	
});
socket.on('chat message', function(msg){
	$('#messages').prepend($('<li>').text(msg));
})

socket.on('user connection', function(){
	$('#messages').prepend($('<li>').text('Another person joined!'));
})

socket.on('name change', function(names){
	var res = names.split(':');
	$('#messages').prepend($('<li>').text(res[0] + "changed their name to " + res[1]));
})

/*
socket.on('name change', function(n1, n2){
	$('#messages').prepend($('<li>').text(n1 + "changed name to " + n2));
})
*/

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
/*			} else if(msg = '/ end'){
				if(confirm("Do you want to quit?")){
					alert('Goodbye');
					close(); // doesn't work
				}*/
			} 
			else{
				alert('Command not available');
				return false;
			}
		}
	}
};