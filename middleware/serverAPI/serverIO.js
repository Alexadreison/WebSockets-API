
var serverIO = require('socket.io');
var upcomingClients = require('./upcomClients');        // clients that expect to connect so that emit events
var options = require("./configServer");                // configuration file of server


module.exports = Object.freeze(myServer);


function myServer() {

    this.eventListeners = {};                           // events and its listeners as defined from user
    
    this.clients = {};                                  // hash of clients names and their correspoding sockets

}


/**
 * API for new websocket
 * 
 * @param httpServer    HTTP server (Not required)
 * 
 */
myServer.prototype.newWebsocket = function(httpServer) {
    
    this.webSocket = new serverIO(options);
  
    this.webSocket.listen(httpServer || options.port || 3000);
  
    if ( !this.webSocket) {                                                     // if not defined websocket
        
        console.log("Must define a WebSocket ......");
        
        process.exit(0);
    }
    
    if ( this.eventListeners == {} ) {                                          // if not defined listeners for events
        
        console.log('Must define listeners for events ......');
        
        process.exit(0);
    }
    
    console.log('Websocket created ...');
    
    var self = this;
    
    this.webSocket.sockets.on('connection', function(socket) {                   // event for new connection on webSocket

        //socket.on('clientName', function(name) {                                // every new client specify its name
        socket.on('registerMobile', function(name) {
        
            //console.log('Client : ' + name + ' connected ');
            
            self.clients[name] = socket;

            for (var i = 0; i < upcomingClients.expectedClients.length; i++ ) {
                    
                for(var j = 0; j < upcomingClients.expectedClients[i].clientNames.length; j++ ) {

                    if ( upcomingClients.expectedClients[i].clientNames[j] == name ) {

                        var dataTransmit = { eventName : upcomingClients.expectedClients[i].eventName, data : upcomingClients.expectedClients[i].data };
    
                        dataTransmit = JSON.stringify(dataTransmit);                        // serialization of data
                
                        //self.clients[name].emit('newMessage', dataTransmit);
                        self.clients[name].emit('eventMsg', dataTransmit);
                            
                        upcomingClients.expectedClients[i].clientNames.splice(j,1);
                            
                        if ( !upcomingClients.expectedClients[i].clientNames.length ) {

                            upcomingClients.expectedClients.splice(i,1);        // remove event if sent to all clients
                                
                            i--;
                        }
                            
                        break;
                    }
                }
            }
            
        });
        
    
        //socket.on('newMessage', function(data) {                               // receive new packet from client
        socket.on('eventMsg', function(data) {
            
            if ( typeof data !== 'string' ) {
                    
                console.log('Received not serialized data. MUST serialize the object !!!');
                    
                return;
            }
                
            data = JSON.parse(data);                                            // deserialization
            
            var k = false;
            
            for(var event in self.eventListeners) {             // execute the corresponiding listener for the received event name
                    
                if ( data.eventName == event ) {
                        
                    self.eventListeners[event](data.data);

                    k = true;
                        
                    break;
                }
            }
            
            if ( !k ) {
                
                console.log('Not specified event listener for the event ........ ' + data.eventName);
            }
            
            k = false;
            
        });            
        
        socket.on('disconnect', function() {                                    // disconnection of user
            
            for(var clientName in self.clients) {
                
                if ( self.clients[clientName] == socket ) {
                    
                    delete self.clients[clientName];
                    
                    console.log('Client : ' + clientName + ' disconnected ');
                    
                    break;
                }
            }
        });
        
    });
};


/**
 * API to attach listener to an event 
 * 
 * @param event     Event name  
 * @param listener  Event handler
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

    return 1;
};


/**
 * API to emit the server during runtime
 * 
 * param    event  Event to be emitted  ( {eventName: string , clientNames : array, data : any , toNextClients : boolean, timeout : int} )
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
                
                //self.clients[clientName].emit('newMessage', dataTransmit);
                self.clients[clientName].emit('eventMsg', dataTransmit);
                
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
    }
    
    return 1;
};


/**
 * API to broadcast(via WebSocket) the server during runtime
 * 
 * param   event    Event to be broadcasted  ( {eventName: string , data : any } )
 * 
 */
myServer.prototype.sendEventToAll = function(event) {
    
    if ( "object" !== typeof event ) {                                      // check if event is an object
            
        console.log('Your argument must be an object');
            
        console.log('Event didn\'t send');
            
        return 0;
    }
    
    if ( typeof event.eventName != 'string' ) {
        
        console.log('EventName property must be string ');
        
        return 0;
    }
    
    var dataTransmit = JSON.stringify(event);                               // serialization of data
                
    //this.webSocket.sockets.emit('newMessage', dataTransmit);
    this.webSocket.sockets.emit('eventMsg', dataTransmit);
    
    return 1;            
};


/**
 * API to close the websocket
 */ 
myServer.prototype.close = function() {
    
    this.webSocket.close();                                             // close websocket
    
    console.log('WebSocket closed ....');

};

