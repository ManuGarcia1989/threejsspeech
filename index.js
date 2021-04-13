require('dotenv').config();
/*const Server = require('./models/server');
const server = new Server();
server.listen();
*/
const express = require('express');
const cors = require('cors');

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(cors());
app.use( express.static('public') );

const WebSocket = require('ws');
const PORT = 5001;

const wsServer = new WebSocket.Server({
    port: PORT
});

//Whenever someone connects this gets executed
io.on('connection', function(socket) {
   console.log('A user connected');

    console.log('Cliente conectado')
    socket.on('sendmessage', (payload)=>{
        console.log("Del javascript: "+payload);
        wsServer.clients.forEach(function(client) {
            client.send(payload);
        });
        io.emit('servermessage',payload);
    });
   //Whenever someone disconnects this piece of code executed
   socket.on('disconnect', function () {
      console.log('A user disconnected');
   });
});

http.listen(3001, function() {
   console.log('listening on *:3001');
});


wsServer.on('connection', function(socket){
    console.log("Nuevo CLiente");

    socket.on('message', function(msg){
        console.log("del cliente: " + msg);
        wsServer.clients.forEach(function(client) {
            client.send(msg);
        });
    });
});