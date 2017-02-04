
var serverIO = require('socket.io');
var events = require("events").EventEmitter;
var options = require("./configServer");                              // configuration file



module.exports = Object.freeze(serverClass);


serverClass.prototype.__proto__ = events.prototype;




function serverClass() {
    
    var newData = [];                                           // notify on every new data emission

    var eventListeners = {};                                    // event with its listeners as defined from user
    
    //var joinRooms = [];                                         // new rooms to join the socket
    
    //var totalJoinRooms = [];                                    // total active rooms
    
    //var leaveRooms = [];                                        // rooms to leave the socket
    
    var webSocketTransmitionData = [];                          // websocket broadcast to a specified room
    
    var closeWebSocket = false;                                 // true if websocket have to close
    
    this.on('newWebsocket', function() {               // event for new webSocket
    
        console.log('A newWebsocket created ...');
        
        var webSocket = new serverIO( options );                //create webSocket
        
        webSocket.listen( options.port || 3001 );               // options.port ||  // define port 
        

        var webSocketInterval = setInterval( function () {          // websocket transmission to all connected sockets of room
            
            if ( webSocketTransmitionData != [] ) {
                
                if ( closeWebSocket ) {
                    
                    webSocket.close();
                    
                    clearInterval(webSocketInterval);
                    
                    console.log('WebSocket closed ....');
                    
                    console.log('WebSocketInterval cleared ...');
                    
                    return;
                }
            
                webSocketTransmitionData.forEach( function(val,index) { 
                      
                    var dataTransmit = { nameEvent : val.nameEvent, data : val.data};

                    dataTransmit = JSON.stringify(dataTransmit);                // serialization
            
                    //webSocket.sockets.to(val.room).emit('recvMessage', dataTransmit);
                    webSocket.sockets.emit('recvMessage', dataTransmit);        // emit to all connected clients
                    
                    webSocketTransmitionData.shift();
                    
                    console.log('WebSocket transmited to all websockets...');
                });
            }
        }, options.webSocketToAllFrequency || 12000);
        
        
        webSocket.sockets.on('connection', function(socket) {           // event for new connection on webSocket
            
            console.log('A new client connected (middleware) ...');
            
           
            var socketEmitInterval = setInterval( function() {          // every new data to emmission
                
                if ( closeWebSocket ) {                                 // check if websocket cloed
                    
                    clearInterval(socketEmitInterval);
                    
                    console.log('SocketEmitInterval cleared ...');
                    
                    return;
                }
                
                if ( newData != [] ) {
                    
                    newData.forEach( function(val,index) { 
                      
                        var dataTransmit = { nameEvent : newData[index].nameEvent, data : newData[index].data };

                        dataTransmit = JSON.stringify(dataTransmit);        // serialization of data
                
                        switch( newData[index].typeEmit ) {                 // check the type of transmission
            
                            case 0 :                                        // unicast broadcast 
                    
                                socket.emit('recvMessage', dataTransmit);
                            
                                newData.shift();
                            
                                console.log('data sent unicast');
                    
                                break;
                            case 1 :
                
                                socket.broadcast.emit('recvMessage', dataTransmit);
                            
                                newData.shift();
                            
                                console.log('data sent broadcast');
                    
    /*                            
                            case 2 :                                        // broadcast to all connected sockets of room
                
                                if ( !newData.roomName ) {                  // check for defined room name of received packet
                        
                                    console.log("Not specified room.Data lost\n");
                                
                                    newData.shift();
                        
                                    break;
                                }
                    
                                socket.broadcast.to(newData.roomName).emit('recvMessage', dataTransmit);
                            
                                newData.shift();
                            
                                console.log('data sent to room');
        */
                        }
                    });
                }
            }, options.dataTransmitionFrequency || 4000);
            
        /*    
            var joinRoomInterval = setInterval( function() {                    // check if socket joined to new room(s)
                
                if ( closeWebSocket ) {                                         // if webSocket closed
                    
                    clearInterval(joinRoomInterval);
                    
                    console.log('joinRoomInterval cleared ...');
                    
                    return;
                }
                
                if ( joinRooms != [] ) {                                    // if new room(s) => insert into
                    
                    joinRooms.forEach(function(val,index) {
    
                    console.log('Socket joined to %s room',val);
                    
                    socket.join(val);
                    
                    joinRooms.shift();
                        
                    });
                }
                
            }, 5000);
            
            
            var leaveRoomInterval = setInterval( function() {                   // check if socket leave any room(s)
                
                if ( closeWebSocket ) {                                         // if webSocket closed
                    
                    clearInterval(leaveRoomInterval);
                    
                    console.log('leaveRoomInterval cleared ...');
                    
                    return;
                }
                
                if ( totalJoinRooms != [] ) {                               // remove the room from the active rooms array
                
                    if ( leaveRooms != [] ) {
                    
                       leaveRooms.forEach( function(leaveval,indexLeave) {
                        
                            totalJoinRooms.forEach( function(joinval,indexJoin) {
                                
                                if ( leaveval == joinval ) {
                    
                                socket.leave(joinval);
                    
                                totalJoinRooms.splice(indexJoin,1);                 // remove the room from totalJoinRooms array
                                
                                leaveRooms.shift();
                                
                                console.log('Socket leaved from %s room',joinval);
                                }
                                
                                leaveRooms.shift();                             // in case of leave an undefined room 
                            });
                        });
                    }
                }
            }, 10000);
        */
            
            socket.on('recvMessage', function(data) {                       // receive new packet from client
                
                if ( typeof data !== 'string' ) {
                    
                    console.log('Received not serialized data. MUST serialize the object !!!!');
                    
                    return;
                }
                
                data = JSON.parse(data);                                    // deserialization
                
        /*        
                if ( typeof data.room == 'string' ) {                        // in case of room delivery
                    
                    totalJoinRooms.forEach( function(val,index) {           // check if there is the room
                        
                        if ( val == data.room ) {
                                                            // execute the corresponiding listener for the received event name
                            for(var event in eventListeners) {
                    
                                if ( data.nameEvent == event ) {
                        
                                    eventListeners[event](data.data);
                        
                                    console.log('data received from socket ..');
                                    
                                    return;
                                }
                            }
                        }
                    });
                    
                    console('Room didn\'t find or not defined');
                } 
        */    
                for(var event in eventListeners) {          // execute the corresponiding listener for the received event name
                    
                    if ( data.nameEvent == event ) {
                        
                        eventListeners[event](data.data);
                        
                        console.log('Data received from client on server ..');
                        
                        return;
                    }
                }
                
                console.log('Not listener for the specifed event');
               
            });
            
            
            socket.on('disconnect', function() {        // disconnection of user
                
                console.log('user disconnected');
            });
  
        });

        
    });
    
   
                                                   // format of data = { nameEvent : , typeEmit : , data : }
    this.on('sendMessage', function( data ) {
        

        if ( data.nameEvent == undefined || typeof data.nameEvent != 'string' ) {       // check for correct name event
            
            console.log('Data didn\'t send due to undefined nameEvent property');
            
            return;
        }
                                                                                        // check for correct type emit 
        if ( data.typeEmit == undefined || (data.typeEmit != 0 && data.typeEmit != 1 && data.typeEmit != 2) ) {
            
            console.log('Not or wrong specified typeEmit property');
            
            console.log("Insert : 0 for unicast or 1 broadcast or 2 for any room");
        
            console.log('Data didn\'t send');    
                    
            return;
        }
        
        newData.push(data);                                 // pending data to emit
        
        console.log('New data towards transmission inserted ...');
        
    });
    
    
                                                // format of data : { eventName : name, listener : function }
    this.on('newEvent', function(data) {
        
        if ( !data.eventName ) {                                    // check for defined event name
            
            console.log('You should specify an eventName propety');
            
            console.log('Event didn\'t insert into');
            
            return;
        }
        
        if ( "function" !== typeof data.listener ) {                // check if listener of event is defined and a Function
            
            console.log('Your listener must be a Function');
            
            console.log('Event didn\'t insert into');
            
            return;
            
        }
        
        eventListeners[data.eventName] = data.listener;             // define the new event with the correspoding listener
                    
        console.log('Your event inserted into eventListeners ...'); 
        
                    
    });
    
/*    
    this.on('joinRoom', function(room) {                            // join socket to a room
        
        if ( typeof room != 'string' ) {                            // check for correct room name
            
            console.log('You didn\' defined a correct room name');
            
            console.log('Socket didn\'t join to new room ');
            
            return;
        }
        
        joinRooms.push(room);                                       // remain the current new rooms to join the socket
        
        totalJoinRooms = joinRooms.slice(0);                        // copy to remain the active rooms
        
        console.log('A new room created ...');
 
    });
    
    
    this.on('leaveRoom', function(room) {                       // leave a room
        
        if ( typeof room != 'string' ) {                        // check for correct room name
            
            console.log('You didn\' defined a correct room name');
            
            console.log('Socket didn\'t join to newleave from room ');
            
            return;
        }
        
        leaveRooms.push(room);                                  // pending rooms to leave the socket
        
        console.log('leaveroom created ...');
     
    });
*/    
    
    //this.on('webSocketToRooms', function(data) {                // webSocket emit to rooms of connected sockets or disconnect 
    
    this.on('webSocketToAll', function(data) {        
    
        if ( data.nameEvent == undefined || typeof data.nameEvent != 'string' ) {       // check for correct nameEvent to transmit
            
            console.log('Data didn\'t send due to undefined nameEvent property');
            
            return;
        }
        
        webSocketTransmitionData.push(data);
        
        console.log('Data inserted into webSocketTransmitionData ...');
    
    });
    
    /*    
        var check = false;                                          // if room name found
        
        totalJoinRooms.forEach( function(val, index) {
           
           if ( val == data.room ) {
               
               webSocketTransmitionData.push(data);
               
               check = true;
           }
        });
        
        if ( !check ) {                                             // if room name not found 
            
            console.log('There\'s not the specified room. Data didn\'t send');
        }
    */  
        
    

    this.on('closeWebSocket', function(close) {        
    
        if ( typeof close == 'boolean' ) {                           // webSocket close if true
            
            closeWebSocket = close;
            
            console.log('closeWebSocket informed to close ...');
            
            return;
        }
        
        console.log('Data must be boolean. WebSocket didn\'t close');
    });
  
}

