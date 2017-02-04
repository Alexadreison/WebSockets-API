
var http = require('http');
var fs = require('fs');
var url = require('url');
var serverAPI = require("./serverAPI");


var webSocketServer = new serverAPI();                          // my server websocket API

var langCenter = 0;                                             // coordinates
var longCenter = 0;
var timeCenter;

var colors = ['#0000FF','#00FF00','#A52A2A','#6495ED'];         // Trial colors ( x and y coordinates on Google map)

var responsesSSE = [];                                          // all EventSource connections (Server-sent event)
var clients = [];                                               // monitor all websocket clients

var allCurrentClients = [];                                     // currently connected clients

var httpServer = http.createServer(function(request,response) {
    
    var pathname = url.parse(request.url).pathname;

    if ( pathname == '/' ) {                                                    // specified for server-side purpose
    
        readFile(response, './app.html');
        
    }
    else if ( pathname == './mobile.html') {                                    // specified for client-side purpose
        
        readFile(response, './mobile.html');

    }
    else if ( pathname == '/SSE' ) {                                            // monitor connected and new clients on Google map
        
        responsesSSE.push(response);
        
        response.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
        
        response.write("event: positionCenter\n");
        response.write("data: " + JSON.stringify({ langitudeCenter : langCenter, longitudeCenter : longCenter}) + "\n\n");
        
        if ( clients != [] ) {
        
            clients.forEach(function(client) {
            
                response.write("event: newClient\n");
                response.write("data: " + JSON.stringify({ clientName : client.clientName, color : client.clientColor }) +"\n\n");
                
                if ( client.positions != [] ) {
                
                    client.positions.forEach(function(val) {
                    
                        response.write("event: newPosition\n");
                        response.write("data: "+ JSON.stringify({color : client.clientColor, coords : [val[0], val[1]] }) +"\n\n");
                    });
                }
            });
        }
    }
    else {
    
        readFile(response, '.' + pathname);                                     // Read any other file ( javascript or css )
    }
    
}).listen(process.env.PORT,function() {
    
  console.log("Server listening ");
});


var readFile = function(response , fileName) {
    
    fs.readFile(fileName, function(error, fileData) {
        
        if ( error ) {
            
            console.log(error.message);
            
            response.writeHead(404, {'content-type': 'text/html'});
            
            response.write('File not found: ' + fileName);
            
            response.end();
        }
        else {
            
            response.write(fileData);
            
            response.end();
        }
        
    });
};

                                                                            // new position of client
var positionListener = function(position) {
    
    
    if (langCenter == 0 && longCenter == 0) {                                   // Centralize Google map
    
        langCenter = position.langitude;
    
        longCenter = position.longitude;
        
        timeCenter = position.time;
        
    }

    for (var i=0; i < clients.length; i++) {
        
        if ( clients[i].clientName == position.clientName ) {
            
            clients[i].positions.push( [position.langitude, position.longitude, position.time] );       // Save clients' coordinates
            
            if ( responsesSSE != [] ) {                                         // monitor new (connected) clients
        
                responsesSSE.forEach(function(res) {
            
                res.write("event: newPosition\n");
                res.write("data: "+ JSON.stringify({color : clients[i].clientColor, coords : [position.langitude, position.longitude, position.time] }) +"\n\n");
            
                });
            }
            
            break;
        }
    }
};

webSocketServer.newEventListener('newPosition', positionListener);              // User-defined event   

                                                                                // new client connected
var clientNameListener = function(name) {
    
    var old = false;
    
    if (allCurrentClients.length > 0 ) {                                        // In case of reconnection ( client is already existed )
    
        allCurrentClients.forEach(function(currName) {
        
            if ( currName == name ) {
            
                old = true;
            
                console.log('Client : ' + name + " reconnected");
            }
        });
    }
    
    if (!old) {
        
        allCurrentClients[allCurrentClients.length] = name;                     // A new client connected
    
        var newClient = {clientName : name, clientColor : colors.shift(), positions : [] };
    
        clients.push(newClient);
    
        if ( responsesSSE != [] ) {                                             // Notifies our web page
        
            responsesSSE.forEach(function(res) {
            
                res.write("event: newClient\n");
                res.write("data: " + JSON.stringify({ clientName : newClient.clientName, color : newClient.clientColor }) +"\n\n");
            
            });
        }
    
        console.log('Client : ' + name + ' connected');
    }
    
    old = false;
    
};

webSocketServer.newEventListener('newClient', clientNameListener);              // User-defined event

                                                                            // start websocket
webSocketServer.newWebsocket(httpServer);                                       // Establish a new WebSocket




