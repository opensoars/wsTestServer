// Pretty loggin
var express = require('express'),
    Ezlog = require('ezlog'),
    log = new Ezlog({ pref: {t: '[wss]', c: 'yellow'}, text: {} })


// Module requirements
var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({port: 3334});


// Initialize express app
var app = express();

// Make ./public out static folder
app.use(express.static(__dirname + '/public'));

// Socket pool
var sockets = [];

// Max Messages to be sent per minute
var maxMessages = 10;

// Connection counter used in default
var connectionCounter = 0;

// the default name to be used
var defaultName = 'Anonymous';


wss.on('connection', function (socket){
  log('got connection');

  socket._name = defaultName + connectionCounter;

  connectionCounter = connectionCounter + 1;

  sockets.push(socket);

  // Set socket it's message count to 0;
  socket._msgCount = 0;

  // Initiate socket it's msgCount clearer
  socket._msgResetInterval = setInterval(function (){
    socket._msgCount = 0;
  }, 60000);

  socket.on('message', function (msg){
    log('got message');

    socket._msgCount = socket._msgCount + 1;

    // Spam fix
    if(socket._msgCount > maxMessages){
      socket.send('PLEASE STOP SPAMMING!');
      return log('Somebody is spamming');
    }


    if(msg === '')       return;
    else if(msg === ' ') return;


    if(msg.indexOf('setName:') !== -1)
      return socket._name = msg.split(':')[1] || '';
    

    // When we got a message, broadcast (send) it to ALL sockets
    for(var i=0; i<sockets.length; i+=1)
      // Except the one socket who has sent the message
      if(sockets[i] !== socket)
        sockets[i].send(socket._name + ': ' + msg);
  });


  socket.on('close', function (){
    log('Socket dc');

    // Remove socket from our socket pool
    sockets.splice(sockets.indexOf(socket), 1);

    // Clear socket._msgResetInterval
    global.clearInterval(socket._msgResetInterval);

  });

});

app.listen(3333);
