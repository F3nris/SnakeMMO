var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var config = require('./config.js');
var ApplicationLogic = require('./applicationLogic.js').ApplicationLogic;

http.listen(config.IO_PORT);

app.use(express.static('public'));
app.listen(config.WEB_SERVER_PORT);
console.log('Snake MMO web server is now listening at Port '+ config.WEB_SERVER_PORT);

new ApplicationLogic(io);
