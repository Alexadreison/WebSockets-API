
var client,watch,name,centerPos;
      
var tempLang = 0;
      
var tempLong = 0;
      
$(document).ready(function(){
        
  $("#start").click(function() {
          
    function showPosition(position) {
            
      if ( tempLang != position.coords.latitude || tempLong != position.coords.longitude ) {
            
        var ev;
            
        if (centerPos) {                                  // first time specify center coordinates
              
          ev = {eventName : 'newPositionCenter', data : { langitude : position.coords.latitude, longitude : position.coords.longitude, time : position.timestamp } };
    
          client.sendEvent(ev);
              
          centerPos = false;
        }
              
        ev = {eventName : 'newPosition', data : {clientName : name, langitude : position.coords.latitude , longitude : position.coords.longitude , time : position.timestamp }};
    
        client.sendEvent(ev);
              
        tempLang = position.coords.latitude;
              
        tempLong = position.coords.longitude;
                
        var day = new Date(position.timestamp);
                
        var hours = day.getHours();
                
        var minutes = ( day.getMinutes() < 10 ? '0' : '' ) + day.getMinutes();
                
        var seconds = ( day.getSeconds() < 10 ? '0' : '' ) + day.getSeconds();
                
        var newEl = document.createElement('span');
              
        newEl.style.color = '#ff0000';
              
        var newContent = document.createTextNode("Latitude: " + position.coords.latitude + " ,Longitude: " + position.coords.longitude + ' ,Time: ' + hours +':'+minutes+':'+seconds);
              
        newEl.appendChild(newContent);
              
        var br = document.createElement('br');
              
        newEl.appendChild(br);
              
        document.getElementById("positions").appendChild(newEl);
      }
              
    }
            
    
    function showError(error) {
              
      var x = document.getElementById("positions");

      switch(error.code) {
              
        case error.PERMISSION_DENIED :
                
          x.innerHTML = "User denied the request for Geolocation.";
                
          break;
        
        case error.POSITION_UNAVAILABLE :
                
          x.innerHTML = "Location information is unavailable.";
                
          break;
                
        case error.TIMEOUT :
            
          x.innerHTML = "The request to get user location timed out.";
            
          break;
                
        case error.UNKNOWN_ERROR :
                
          x.innerHTML = "An unknown error occurred.";
      }
    }
          
    if ( name != '' ) {
          
      client = new io();

      client.clientName(name);

      client.newConnection('https://mynodejs-alexanderuser.c9.io');
      
    
      var ev = {eventName : 'newClient', data : name};
  
      client.sendEvent(ev);

      centerPos = true;

      var options = { enableHighAccuracy: false, timeout: 40000, maximumAge: 0 };
        
      if (navigator.geolocation) {
            
        watch = navigator.geolocation.watchPosition(showPosition,showError, options);
              
      }
      else {
              
        var x = document.getElementById("positions");

        x.innerHTML = "Geolocation is not supported by this browser.";
      }
            
    }
    else {
            
      document.getElementById("notice").innerHTML = "You must define a name for your mobile device";
    }
     
  });
        
        
  $("#sendName").click(function() {
            
    var val = document.getElementById("devName").value;
            
    if ( val != '' ) {
              
      name = val;
              
      document.getElementById("user").style.display = "none";
    }
            
      document.getElementById("notice").innerHTML = "You must define a name for your mobile device";
  });
        
      
  $("#stop").click(function() {
            
    navigator.geolocation.clearWatch(watch);
            
    client.close();
  });
        
});