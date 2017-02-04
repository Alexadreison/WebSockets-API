
var clientIO = require("socket.io-client");
var options = require("./configClient");


module.exports = myClient;


function myClient() {
    
    this.eventListeners = {};                           // events and its listeners as defined from user

}


/**
 * API to create connection to the server
 * 
 * param    url     Specified url of cloud to be connected
 * 
 */ 
myClient.prototype.newConnection = function(url) {
    
    var self = this;
    
    self.socket = clientIO.connect(url, options);                   // new connection with its options
    
    self.socket.on('connect', function() {
        
        if ( !self.clientName ) {
            
            console.log("You must define a client name before connection ");
            
            self.close();
            
            process.exit(0);
        }
        
        self.socket.emit('clientName', self.clientName);                    // send client's name to server 
        
        //console.log('Client connected to server ....... ');
        
    });
    
    
    self.socket.on('newMessage', function(data) {                           // receive new packet from client
            
        if ( typeof data !== 'string' ) {
                    
            console.log('Received not serialized data. MUST serialize the object !!!!');
                    
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
    
    
    self.socket.on('disconnect', function() {
       
       //console.log('User disconnected .......');
       
       self.close(); 
    });
    
    
    self.socket.on('error', function(error) {
       
       //console.log('Error on connection .......');
    });
    
    
    self.socket.on('reconnect', function() {

       //console.log('User reconnected .......');
    });
    
    
    self.socket.on('reconnect_attempt', function() {
       
       //console.log('User attempt to reconnect .......');
    });
    
    self.socket.on('reconnect_failed', function() {
       
       //console.log('User failed to reconnect .......');
    });
    
    self.socket.on('reconnect_error', function(error) {
       
       //console.log('Reconnection attempt error .......');
    });
    
};


/**
 * API to attach listener to an event 
 * 
 * param    event       Event name
 * param    listener    Event handler
 * 
 */
myClient.prototype.newEventListener = function(event, listener) {
    
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

    this.eventListeners[event] = listener;                              // define a new event and its correspoding handler function
    
    return 1;
};


/**
 * API to emit the client during runtime
 * 
 * param    event   Event to be emitted to cloud  ( {eventName: string , data : any} )
 * 
 */
myClient.prototype.sendEvent = function(event) {
    
    if ( "object" !== typeof event ) {                                      // check if event is an object
            
        console.log('Your argument must be an object');
            
        console.log('Event didn\'t insert into');
            
        return 0;
    }
    
    if ( typeof event.eventName != 'string' ) {
        
        console.log('EventName property must be string ');
        
        return 0;
    }
    
    var dataTransmit = JSON.stringify(event);                                   // serialization of data
                                
    this.socket.emit('newMessage', dataTransmit);
    
    return 1;
};


/**
 * API to specify a client name
 * 
 * param    name    Client's name
 * 
 */
myClient.prototype.clientName = function(name) {
    
    if ( typeof name != 'string' ) {
        
        console.log('Client name must be a string');
        
        return 0;
    }
    
    this.clientName = name;
};


/**
 * API to close the websocket
 */
myClient.prototype.close = function() {
    
    this.socket.close();                                                    // close the socket
    
    console.log('Socket closed ....');
};


