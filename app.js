var debug = require('debug')('buzzerino')
var express = require('express'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	nunjucks = require('nunjucks')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var sha1 = require('sha1')

var COOKIE_SECRET = sha1(Math.random() + 'admin_token'),
	COOKIE_NAME = 'admin_token',
	HOST = '0.0.0.0',
	PORT = 4200,
	ADMIN_PASSWORD = ''

var admin_socket = null

// Configure nunjucks path for templates
nunjucks.configure('views', {
	autoescape: true,
	express: app
})

// Express configuration
app.use(express.static(__dirname + '/bower_components'))
app.use(express.static(__dirname + '/public'))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: true
}))

// Express routes
app.get('/', function(req, res, next) {
	res.render('index.html', { title: 'Buzzerino' })
})

app.get('/buzz', function(req, res) {
	if (!admin_socket) {
		debug('Tried to access /buzz when no admin connected')
		res.status(400)
		res.render('error.html', { error: 'Buzzerino Adminirano has not connected yet' })
		return
	}

	var name = req.query.name
	if (name === undefined) {
		debug('No team name supplied, redirecting to /')
		res.redirect('/')
		return;
	}
	res.render('buzz.html', { title: "Let's go!", name: name } )
})

app.get('/admin', function(req, res) {
	if (admin_socket) {
		debug('Tried to access /admin, but there already exists an admin')
		res.status(400)
		res.render('error.html', { error: 'There already exists a Buzzerino Adminirano' })
		return
	} 

	if (req.cookies[COOKIE_NAME] != COOKIE_SECRET) {
		debug(COOKIE_NAME + ' was invalid')
		res.redirect('/auth')
		return
	} 
	res.render('admin.html', { title: 'Buzzerino Adminirano', teams: teams.sockets.length })
})

app.get('/auth', function(req, res) {
	res.render('auth.html', { title: 'Admin Authentication' })
})

app.post('/auth', function(req, res) {
	if (req.body.password === ADMIN_PASSWORD) {
		debug('Wrong password')
		res.cookie(COOKIE_NAME, COOKIE_SECRET)
		res.redirect('/admin')
	} else {
		res.redirect('/auth')
	}
})

// Socket IO
var admin = io
	.of('/admin')
	.on('connection', function(socket) {
		debug('Admin Connected')
		if (teams.sockets.length > 0) {
			teams.emit('admin-reconnect') // activate button, admin reconnect
		}
		
		if (!admin_socket) {
			debug('New admin')
			admin_socket = socket
		}
		
		socket.on('reset', function(data) {
			debug('Admin demanding reset')
			teams.emit('reset')
		})

		socket.on('disconnect', function() {
			debug('Admin disconnected')
			teams.emit('admin-disconnect')
			admin_socket = null
		})
	})

var teams = io
	.of('/teams')
	.on('connection', function(socket) {
		debug('Team connected')
		if (!admin_socket) {
			debug('No admin connected yet')
			return
		}
		admin.emit('team-connect', { teams: teams.sockets.length })

		socket.on('buzz-from', function(data) {
			var buzzTime = new Date().getTime()
			debug('Team buzzed at ' + buzzTime)
			data.time = buzzTime
			admin.emit('buzz-from', data)
		})

		socket.on('disconnect', function() {
			debug('Team disconnected')
			admin.emit('team-disconnect', { teams: teams.sockets.length })
		})
	})

server.listen(PORT, HOST, function() {
	debug('Buzzerino-server listening on: ' + HOST + ':' + PORT)
})
