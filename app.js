var sha1 = require('sha1')
var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var nunjucks = require('nunjucks')
var server = require('http').createServer(app)
var io = require('socket.io')(server)

var HOST = "0.0.0.0"
var PORT = 4200
var PASSWORD = ''
var ADMIN_TOKEN = sha1(Math.random() + 'admin_token')

var admin_socket = null

// Configure nunjucks path for templates
nunjucks.configure('views', {
	autoescape: true,
	express: app
})

// Express configuration
app.use(express.static(__dirname + '/bower_components'))
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: true
}))

app.use(cookieParser())

// Express routes
app.get('/', function(req, res, next) {
	res.render('index.html', { title: 'Buzzerino' })
})

app.get('/buzz', function(req, res, next) {
	if (!admin_socket) {
		res.status(400)
		res.render('error.html', { error: 'Buzzerino Adminirano has not connected yet' })
		return
	}

	var name = req.query.name
	if (name === undefined) {
		res.redirect('/')
		return;
	}
	res.render('buzz.html', { title: "Let's go!", name: name } )
})

app.get('/buzz/admin', function(req, res, next) {
	if (req.cookies.admin_token != ADMIN_TOKEN) {
		res.redirect('/buzz/auth')
		return
	} 
	res.render('admin.html', { title: 'Buzzerino Adminirano', teams: teams.sockets.length })
})

app.get('/buzz/auth', function(req, res, next) {
	res.render('auth.html', { title: 'Admin Authentication' })
})

app.post('/buzz/auth', function(req, res, next) {
	if (req.body.password === PASSWORD) {
		res.cookie('admin_token', ADMIN_TOKEN)
		res.redirect('/buzz/admin')
	} else {
		res.redirect('buzz//auth')
	}
})

server.listen(PORT, HOST, function() {
	console.log('Buzzerino-server listening on: ' + HOST + ':' + PORT)
})

// Socket IO
var admin = io
	.of('/admin')
	.on('connection', function(socket) {
		console.log('Admin Connected')
		if (teams.sockets.length > 0) {
			teams.emit('admin-reconnect') // activate button, admin reconnect
		}
		admin_socket = socket
		
		socket.on('reset', function(data) {
			console.log('Admin demanding reset')
			teams.emit('reset')
		})

		socket.on('disconnect', function() {
			console.log('Admin disconnected')
			teams.emit('admin-disconnect')
			admin_socket = null
		})
	})

var teams = io
	.of('/teams')
	.on('connection', function(socket) {
		if (!admin_socket) {
			console.log('No admin connected yet')
			return
		}
		console.log('Team connected')
		admin.emit('team-connect', { teams: teams.sockets.length })

		socket.on('buzz-from', function(data) {
			var buzzTime = new Date().getTime()
			console.log('Team buzzed at ' + buzzTime)
			data.time = buzzTime
			admin.emit('buzz-from', data)
		})

		socket.on('disconnect', function() {
			console.log('Team disconnected')
			admin.emit('team-disconnect', { teams: teams.sockets.length })
		})
	})

