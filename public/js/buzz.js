var socket = io.connect('http://' + document.location.host + '/teams')
var buzzerButton = $("#buzzer")
alert(document.location.host)

// Socket IO
socket.on('connect', function(data) {
	console.log('Connected to socket')
})

socket.on('reset', function(data) {
	console.log('Got reset request')
	invertBuzzerButton(false)
})

socket.on('admin-reconnect', function() {
	invertBuzzerButton(false)
	Materialize.toast('Buzzerino Adminirano reconnected', 4000)
})	

socket.on('admin-disconnect', function() {
	invertBuzzerButton(true)
	Materialize.toast('Buzzerino Adminirano disconnected', 4000)	
})

// User actions
$(buzzerButton).on('click', function(e) {
	socket.emit('buzz-from', { name: name })
	invertBuzzerButton(true)
})

var invertBuzzerButton = function(invert) {
	$(buzzerButton).attr('disabled', invert)
	if (invert)
		$(buzzerButton).addClass('disabled')
	else
		$(buzzerButton).removeClass('disabled')
}
