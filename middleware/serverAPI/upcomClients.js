

module.exports = new clientsExpect();


function clientsExpect () {
    
    this.expectedClients = [];                                      // clients that expect to connect 

    this.intervalTime = 10000;                                      // define an interval 

}


clientsExpect.prototype.insert = function(event) {
    
    if ( !event.timeout ) {                                         // if no timeout for the specific event 
        
        return 0;
    }
    
    //console.log('Event name %s sent to upcomingClients ', event.eventName);
    
    if ( !this.expectedClients.length ) {                           // if it's the first event to send to new clients

        this.startInterval(this);
        
        console.log('Started interval .......');
    }
    
    this.expectedClients.push(event);

    return 1;
};



clientsExpect.prototype.startInterval = function(self) {                // interval which decrease timeout of each event
    
    self.intervalTimer = setInterval(function() {

            if ( self.expectedClients.length ) {

                self.expectedClients.forEach(function(val, index) { 
                   
                   val.timeout = val.timeout - self.intervalTime;
                   
                   if ( val.timeout <= 0 ) {
                       
                       self.expectedClients.splice(index,1);
                       
                       console.log('Event name \" ' + val.eventName + ' \" deleted due to timeout');
                    }
                });
            }
            
            if ( !self.expectedClients.length ) {
                
                self.stopInterval(self);
            }
    
    }, self.intervalTime);                                              // interval period
    
};


clientsExpect.prototype.stopInterval = function(self) {                 // stop interval if there aren't pendings events
    
    clearInterval(self.intervalTimer);
    
    console.log('Interval timer to expect clients stopped ');
};

