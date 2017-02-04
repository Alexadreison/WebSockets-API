
var http = require('http');
var fs = require('fs');
var url = require('url');
var serverAPI = require("./serverAPI");


var webSocketServer = new serverAPI();                          // my server websocket API

var langCenter = 0;                                             // coordinates
var longCenter = 0;
var timeCenter;

var colors = ['#0000FF','#00FF00','#A52A2A','#6495ED'];         // x and y coordinates

var responsesSSE = [];                                          // all EventSource connections
var clients = [];                                               // all websocket clients

var httpServer = http.createServer(function(request,response) {
    
    var pathname = url.parse(request.url).pathname;

    if ( pathname == '/' ) {
    
        readFile(response, './app.html');
        
    }
    else if ( pathname == './mobile.html') {
        
        readFile(response, './mobile.html');

    }
    else if ( pathname == '/SSE' ) {
        
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
    
        readFile(response, '.' + pathname);
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


                                                                            // map center position
var positionCenterListener = function(position) {
    
    if (langCenter == 0 && longCenter == 0) {
    
        langCenter = position.langitude;
    
        longCenter = position.longitude;
        
        timeCenter = position.time;
        
    }
};

webSocketServer.newEventListener('newPositionCenter', positionCenterListener); 


                                                                            // new position of client
var positionListener = function(position) {
    

    for (var i=0; i < clients.length; i++) {
        
        if ( clients[i].clientName == position.clientName ) {
            
            clients[i].positions.push( [position.langitude, position.longitude, position.time] );
            
            if ( responsesSSE != [] ) {
        
                responsesSSE.forEach(function(res) {
            
                res.write("event: newPosition\n");
                res.write("data: "+ JSON.stringify({color : clients[i].clientColor, coords : [position.langitude, position.longitude, position.time] }) +"\n\n");
            
                });
            }
            
            break;
        }
    }
};

webSocketServer.newEventListener('newPosition', positionListener);                


                                                                            // new client connected
var clientNameListener = function(name) {
    
    var newClient = {clientName : name, clientColor : colors.shift(), positions : [] };
    
    clients.push(newClient);
    
    if ( responsesSSE != [] ) {
        
        responsesSSE.forEach(function(res) {
            
            res.write("event: newClient\n");
            res.write("data: " + JSON.stringify({ clientName : newClient.clientName, color : newClient.clientColor }) +"\n\n");
            
        });
    }
    
    console.log('New client : ' + name);
};

webSocketServer.newEventListener('newClient', clientNameListener);


                                                                            // start websocket
webSocketServer.newWebsocket(httpServer);
