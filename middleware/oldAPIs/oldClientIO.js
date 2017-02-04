

var clientIO = require("socket.io-client");
var options = require("./configClient");


module.exports = Object.freeze(myClient);



function myClient() {
    
    this.eventListeners = {};                           // events with its listeners as defined from user
    
    this.eventsToWaitSocket = [];                       // event to wait a socket before emit the event
    
    this.eventsNoWaitingSocket = [];                    // event to emit a socket without waiting
    
}



/**
 * API to create connection to the server
 * 
 * params : url = string
 * 
 */ 


myClient.prototype.newConnection = function(url) {
    
    var self = this;
    
    if ( self.eventListeners == {} ) {                               // if not defined listeners for events
        
        console.log('Must define listeners for events ......');
        
        process.exit(0);
    }
    
    
    self.socket = clientIO.connect(url, options);                   // new connection with its options
    
    self.socket.on('connect', function() {
        
        if ( !self.clientName) {
            
            console.log("You must define a client name before connection ");
            
            self.close();
            
            process.exit(0);
        }
        
        
        self.socket.emit('clientName', self.clientName);                    // send client's name to server 
        
    
        console.log('Client connected to server ....... ');
        
        if ( self.eventsNoWaitingSocket != [] ) {                           // if defined events without waiting to emit the socket
        
            self.eventsNoWaitingSocket.forEach(function(val, index) {
            
                var dataTransmit = { eventName : val.eventName, data : val.data };
    
                dataTransmit = JSON.stringify(dataTransmit);                // serialization of data
                                
                self.socket.emit('newMessage', dataTransmit);
   
            });            
        }
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
 
                    self.socket.emit('newMessage', dataTransmit);
   
                    //console.log('Data sent unicast .......... ');
                }
            });
        }
    });
    
    
    self.socket.on('disconnect', function() {
       
       console.log('User disconnected .......');
       
       self.close(); 
    });
    
    
    self.socket.on('error', function(error) {
       
       console.log('Error on connection .......');
    });
    
    
    self.socket.on('reconnect', function() {

       console.log('User reconnected .......');
    });
    
    
    self.socket.on('reconnect_attempt', function() {
       
       console.log('User attempt to reconnect .......');
    });
    
    self.socket.on('reconnect_failed', function() {
       
       console.log('User failed to reconnect .......');
    });
    
    self.socket.on('reconnect_error', function(error) {
       
       console.log('Reconnection attempt error .......');
    });
    
    
};



/**
 * API to attach listener to an event 
 * 
 * params : event = {eventName : string, listener : function }
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

    this.eventListeners[event] = listener;                              // define the new event with the correspoding listener
    
    //console.log('Your event inserted into eventListeners ...'); 
    
    return 1;
};



/**
 * API to define events to wait an event before emit the socket
 * 
 * params : event = {eventToWait : string, eventName : string, data : }
 * 
 */

myClient.prototype.newEventToWait = function(event) {
    
    if ( "object" !== typeof event ) {                                      // check if event is an object
            
        console.log('Your argument must be an object');
            
        console.log('Event didn\'t insert into');
            
        return 0;
    }
    
    if ( typeof event.eventToWait != 'string' || typeof event.eventName != 'string' ) {
        
        console.log('EventToWait and EventName properties must be strings ');
        
        return 0;
    }
    
    this.eventsToWaitSocket.push(event);
    
    //console.log('Your event to wait the socket inserted into .....');
    
    return 1;
};


/** 
 * API to define events to emit the socket without waiting any event
 * 
 * params : event = {eventName : string, data : }
 * 
 */

myClient.prototype.newEventNoWaiting = function(event) {
    
    if ( "object" !== typeof event ) {                                      // check if event is an object
            
        console.log('Your argument must be an object');
            
        console.log('Event didn\'t insert into');
            
        return 0;
    }
    
    if ( typeof event.eventName != 'string' ) {
        
        console.log('EventName property must be string ');
        
        return 0;
    }

    this.eventsNoWaitingSocket.push(event);
    
    //console.log('Your event not to wait the socket inserted into .....');
    
    return 1;
};


/**
 * API to emit the client during runtime
 * 
 * params : event = {eventName: string , data : }
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
    
    var dataEmit = JSON.stringify(event);                                   // serialization of data
                                
    this.socket.emit('newMessage', dataEmit);
    
    console.log("Data send during runtime ........");
    
    return 1;
};


/**
 * API to specify a client name
 * 
 * params : name = string
 * 
*/

myClient.prototype.clientName = function(name) {
    
    if ( typeof name != 'string' ) {
        
        console.log('Client name must be a string');
        
        return 0;
    }
    
    this.clientName = name;
    
    console.log('You define a client name .......');
};


/**
 * API to close the websocket
*/

myClient.prototype.close = function() {
    
    this.socket.close();                                                    // close the socket
    
    console.log('Socket closed ....');
};