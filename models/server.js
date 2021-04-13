const express = require('express');
const cors = require('cors');

class Server {
    constructor(){
        this.app = express();
        this.port = 3000;
        this.server = require('http').createServer(this.app);
        this.io = require('socket.io')(this.server);
        //this.ws = new require('ws').Server(this.server);
        this.path = {};
        this.middlewares();
        this.routes();

        this.sockets();
    }
    middlewares(){
        this.app.use(cors());
        this.app.use( express.static('public') );
    }
    routes(){

    }
    sockets(){
        this.io.on('connection', socket => {
            console.log('Cliente conectado')
            socket.on('sendmessage', (payload)=>{
                console.log(payload);
                this.io.emit('servermessage',payload);
            });
           
        });

    }
    listen(){
        this.server.listen(this.port, ()=>{
            console.log('Servidor corriendo en puerto', this.port);
        });
    }
}
module.exports = Server;