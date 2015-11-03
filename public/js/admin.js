var socket = io.connect(document.location.protocol + '//' + document.location.host + '/admins')
var buzzId = 0
var counter = 1

// Socket IO
socket.on('connect', function(data) {
	console.log('Connected to socket')
})

socket.on('buzz-from', function(data) {
	console.log('Got buzz from: ' + data)
	var time = new Date(data.time)
	var timeString = 
		time.getHours() + ':' 
		+ time.getMinutes() + ':' 
		+ time.getSeconds() + ':' 
		+ time.getMilliseconds()
	var newBuzzRow = '<tr><td>' + buzzId++ + '</td><td>' + data.name + '</td><td>' + timeString + '</td></tr>'
	$('table tbody').append(newBuzzRow)

})

socket.on('team-connect', function(data) {
	console.log('New team connected, count is now: ' + data.teams)
	$('#teams').html(data.teams)
	Materialize.toast('New team arrived (' + data.teams + ')', 4000)
})

socket.on('team-disconnect', function(data) {
	console.log('Team disconnected, count is now: ' + data.teams)
	$('#teams').html(data.teams)
	Materialize.toast('Team disconnected: (' + data.teams + ')', 4000)

})

// User actions
$('#reset').on('click', function(e) {
	console.log('Demanding reset')
	socket.emit('reset')
	$('table tbody').empty()
	buzzId = 0
})

$('#counter').on('click', function(e) {
	$('#points-counter').html(counter++)
})

$('#counter-reset').on('click', function(e) {
	$('#points-counter').html('0')
	counter = 1
})

$('#countdownr-button').on('click', function(e) {
	Countdownr.startWithTime(60)
})

