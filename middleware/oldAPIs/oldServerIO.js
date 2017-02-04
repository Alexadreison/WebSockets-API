
var serverIO = require('socket.io');
var upcomingClients = require('./upcomClients');        // clients that expect to connect so that emit events
var options = require("./configServer");                // configuration file of server


module.exports = Object.freeze(myServer);


function myServer() {


    this.eventListeners = {};                           // events with its listeners as defined from user
    
    this.eventsToWaitSocket = [];                       // event to wait a socket before emit the event
    
    this.eventsNoWaitingSocket = [];                    // event to emit a socket without waiting
    
    this.eventsToWaitWebSocket = [];                    // event to wait a websocket before emit the event
    
    this.eventsNoWaitingWebSocket = [];                 // event to emit a websocket without waiting
    
    this.clients = {};                                  // hash of clients names and their correspoding sockets

}


/**
 * API for new websocket 
 * 
 */

myServer.prototype.newWebsocket = function() {
    
    this.webSocket = new serverIO(options);
  
    this.webSocket.listen(options.port || 4000);
  

    if ( !this.webSocket) {                                                     // if not defined websocket
        
        console.log("Must define a WebSocket ......");
        
        process.exit(0);
    }
    
    if ( this.eventListeners == {} ) {                                          // if not defined listeners for events
        
        console.log('Must define listeners for events ......');
        
        process.exit(0);
    }
    
    console.log('A newWebsocket created ...');
    
    var self = this;
    
    this.webSocket.sockets.on('connection', function(socket) {                   // event for new connection on webSocket

        console.log('A new client connected (middleware) ...');
        
        
        socket.on('clientName', function(name) {                                // every new client specify its name
            
            self.clients[name] = socket;

            if ( upcomingClients.expectedClients.length ) {

                for (var i = 0; i < upcomingClients.expectedClients.length; i++ ) {

                    for(var j = 0; j < upcomingClients.expectedClients[i].clientNames.length; j++ ) {

                        if ( upcomingClients.expectedClients[i].clientNames[j] == name ) {

                            var dataTransmit = { eventName : upcomingClients.expectedClients[i].eventName, data : upcomingClients.expectedClients[i].data };
    
                            dataTransmit = JSON.stringify(dataTransmit);                        // serialization of data
                
                            self.clients[name].emit('newMessage', dataTransmit);
                
                            upcomingClients.expectedClients[i].clientNames.splice(j,1);
                            
                            if ( !upcomingClients.expectedClients[i].clientNames.length ) {

                                upcomingClients.expectedClients.splice(i,1);        // remove event if sent to all clients
                            }
                            
                            break;
                        }
                    }
                }
            }
            
        });
        
        
        if ( self.eventsNoWaitingSocket != [] ) {                       // if defined events without waiting to emit the socket
        
            self.eventsNoWaitingSocket.forEach(function(val, index) {
            
                var dataTransmit = { eventName : val.eventName, data : val.data };
    
                dataTransmit = JSON.stringify(dataTransmit);                    // serialization of data
                                
                switch( val.typeEmit ) {                                        // check the type of transmission
                
                    case 0 :                                                    // unicast  
                  
                        socket.emit('newMessage', dataTransmit);
   
                        //console.log('Data sent unicast .......... ');
                        
                        break;
                    case 1 :                                                    // broadcast
                                        
                        socket.broadcast.emit('newMessage', dataTransmit);

                        //console.log('Data sent broadcast ..........');
                }
            });
        }        
    
        if ( self.eventsNoWaitingWebSocket != [] ) {                    // if defined events to emit without waiting the websocket 
        
            self.eventsNoWaitingWebSocket.forEach(function(val, index) {
            
                var dataTransmit = { eventName : val.eventName, data : val.data };
    
                dataTransmit = JSON.stringify(dataTransmit);                            // serialization of data
                                
                self.webSocket.sockets.emit('newMessage', dataTransmit);                // emit to all connected clients

                //console.log('WebSocket transmited to all connected sockets...');
            });
        }
        
        
        socket.on('newMessage', function(data) {                               // receive new packet from client
            
            if ( typeof data !== 'string' ) {
                    
                console.log('Received not serialized data. MUST serialize the object !!!!');
                    
                return;
            }
                
            data = JSON.parse(data);                                            // deserialization
            
            var k = false;
            
            for(var event in self.eventListeners) {             // execute the corresponiding listener for the received event name
                    
                if ( data.eventName == event ) {
                        
                    self.eventListeners[event](data.data);
                        
                    //console.log('Data received from client (server) ..');
                        
                    k = true;
                        
                    break;
                }
            }
            
            
            if ( !k ) {
                
                console.log('Not specified event listener for the event ........ ' + data.eventName);
            }
            
            k = false;
            
            
            if ( self.eventsToWaitSocket != [] ) {                           // if defined events to wait before emit the socket
            
                self.eventsToWaitSocket.forEach(function(val,index) {
                
                    if ( val.eventToWait == data.eventName ) {
                    
                        var dataTransmit = { eventName : val.eventName, data : val.data };
    
                        dataTransmit = JSON.stringify(dataTransmit);                    // serialization of data
                                
                        switch( val.typeEmit ) {                                        // check the type of transmission
                
                            case 0 :                                                    // unicast  
                  
                                socket.emit('newMessage', dataTransmit);
   
                                //console.log('Data sent unicast .......... ');
                        
                                break;
                            case 1 :                                                    // broadcast
                                        
                                socket.broadcast.emit('newMessage', dataTransmit);

                                //console.log('Data sent broadcast ..........');
                        }
                    }
                });
            }
            
            
            if ( self.eventsToWaitWebSocket != [] ) {                   // if defined events to wait before emit the websocket 
            
                self.eventsToWaitWebSocket.forEach(function(val,index) {
                
                    if ( val.eventToWait == data.eventName ) {
                    
                        var dataTransmit = { eventName : val.eventName, data : val.data };
    
                        dataTransmit = JSON.stringify(dataTransmit);                        // serialization of data
                                
                        self.webSocket.sockets.emit('newMessage', dataTransmit);            // emit to all connected clients

                        //console.log('WebSocket transmited to all connected sockets...');
                    }
                
                });
            }
            
        });            
        
        
        socket.on('disconnect', function() {                                // disconnection of user

            console.log('user disconnected ' + socket.id);
        });
        
    });
};



/**
 * API to attach listener to an event 
 * 
 * params : event : string, listener : function 
 * 
 */

myServer.prototype.newEventListener = function(event, listener) {
    
    if ( !event ) {                                                     // check for defined event name
            
        console.log('You should specify an event name ');
            
        console.log('Event didn\'t insert into');
            
        return 0;                                                       // return 0 for error            
    }
        
    if ( "function" !== typeof listener ) {                             // check if listener of event is defined and a Function
            
        console.log('Your listener must be a Function');
            
        console.log('Event didn\'t insert into');
            
        return 0;
    }

    this.eventListeners[event] = listener;                              // define the new event with the correspoding listener
    
    //console.log('Your event inserted into eventListeners ...'); 
    
    return 1;
};


/**
 * API to define events to wait an event before emit the socket
 * 
 * params : event = {eventToWait : string, eventName : string, typeEmit : 0 or 1, data : }
 * 
 */

myServer.prototype.newEventToWaitSocket = function(event) {
    
    if ( "object" !== typeof event ) {                                      // check if event is an object
            
        console.log('Your argument must be an object');
            
        console.log('Event didn\'t insert into');
            
        return 0;
    }
    
    if ( typeof event.eventToWait != 'string' || typeof event.eventName != 'string' ) {
        
        console.log('EventToWait and EventName properties must be strings ');
        
        return 0;
    }
    
    if ( event.typeEmit != 0 && event.typeEmit != 1) {
        
        console.log('TypeEmit property must be 0 or 1 ');
        
        console.log('0 for unicast transmition or 1 for broadcast transmition ');
        
        return 0;
    }
    
    this.eventsToWaitSocket.push(event);
    
    //console.log('Your event to wait the socket inserted into .....');
    
    return 1;
};


/** 
 * API to define events to emit the socket without waiting any event
 * 
 * params : event = {eventName : string, typeEmit : 0 or 1 ,data : }
 * 
 */

myServer.prototype.newEventNoWaitingSocket = function(event) {
    
    if ( "object" !== typeof event ) {                                      // check if event is an object
            
        console.log('Your argument must be an object');
            
        console.log('Event didn\'t insert into');
            
        return 0;
    }
    
    if ( typeof event.eventName != 'string' ) {
        
        console.log('EventName property must be string ');
        
        return 0;
    }
    
    if ( event.typeEmit != 0 && event.typeEmit != 1) {
        
        console.log('TypeEmit property must be 0 or 1 ');
        
        console.log('0 for unicast transmition or 1 for broadcast transmition ');
        
        return 0;
    }
    
    this.eventsNoWaitingSocket.push(event);
    
    //console.log('Your event not to wait the socket inserted into .....');
    
    return 1;
};


/**
 * API to define events to wait websocket before emit the event
 * 
 * params : event = {eventToWait : string, eventName : string, data : }
 * 
 */

myServer.prototype.newEventToWaitWebSocket = function(event) {
    
    if ( "object" !== typeof event ) {                                      // check if event is an object
            
        console.log('Your argument must be an object');
            
        console.log('Event didn\'t insert into');
            
        return 0;
    }
    
    if ( typeof event.eventToWait != 'string' || typeof event.eventName != 'string' ) {
        
        console.log('EventToWait and EventName properties must be strings ');
        
        return 0;
    }

    this.eventsToWaitWebSocket.push(event);
    
    //console.log('Your event to wait the websocket inserted into .....');
    
    return 1;
};


/**
 * API to define events not to wait websocket before emit the event
 *
 * params : event = {eventName : string, data : }
 * 
 */

myServer.prototype.newEventNoWaitingWebSocket = function(event) {
    
    if ( "object" !== typeof event ) {                                      // check if event is an object
            
        console.log('Your argument must be an object');
            
        console.log('Event didn\'t insert into');
            
        return 0;
    }
    
    if ( typeof event.eventName != 'string' ) {
        
        console.log('EventName property must be string ');
        
        return 0;
    }
    
    this.eventsNoWaitingWebSocket.push(event);
    
    //console.log('Your event not to wait the websocket inserted into .....');
    
    return 1;
};


/**
 * API to emit the server during runtime
 * 
 * params : event = {eventName: string , clientNames : array, data : , toNextClients : boolean, timeout : int}
 * 
 */

myServer.prototype.sendEvent = function(event) {
    
    if ( "object" !== typeof event ) {                                      // check if event is an object
            
        console.log('Your argument must be an object');
            
        console.log('Event didn\'t send');
            
        return 0;
    }
    
    if ( typeof event.eventName != 'string' ) {
        
        console.log('EventName property must be string ');
        
        return 0;
    }
    
    if ( !Array.isArray(event.clientNames) || event.clientNames == [] ) {
        
        console.log("Clientnames property must be a (non empty) array ");
        
        return 0;
    }
    
    var self = this;
    
    event.clientNames.forEach(function(val, index) {                        // emit to all connected clients
        
        for( var clientName in self.clients ) {
            
            if ( clientName == val ) {

                var dataTransmit = { eventName : event.eventName, data : event.data };
    
                dataTransmit = JSON.stringify(dataTransmit);                // serialization of data
                
                self.clients[clientName].emit('newMessage', dataTransmit);
                
                event.clientNames.splice(index,1);                          // remove clients that sent the event
                
                break;
            }
        }
    });

    
    if ( event.toNextClients && event.clientNames.length ) {                // to emit to not connected clients

        if ( !upcomingClients.insert(event) ) {                             // insert the event with its timeout
            
            console.log('You must define a timeout so that wait for new clients for a specific time');
            
            return 0;
        }
        
        console.log('Event name %s send to upcomingClients class', event.eventName);
    }
    
    return 1;
};


/**
 * API to close the websocket
 *
 */ 

myServer.prototype.close = function() {
    
    this.webSocket.close();                                             // close websocket
    
    console.log('WebSocket closed ....');
};

