
var map;

if ( !!window.EventSource) {
                
    var source = new EventSource('SSE');
    
         
    source.addEventListener('message',function(newData) {                           // default event

    });
    
    source.addEventListener('positionCenter',function(mapPositionCenter) {
        
        var mapPosCenter = JSON.parse(mapPositionCenter.data);
        
        initialize(mapPosCenter.langitudeCenter, mapPosCenter.longitudeCenter);

    });
    

    source.addEventListener('newPosition',function(newPosition) {
        
        var newPos = JSON.parse(newPosition.data);
        
        var posOptions = {
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: newPos.color,
            fillOpacity: 0.5,
            map: map,
            center: new google.maps.LatLng(newPos.coords[0], newPos.coords[1]),
            radius: 10
        };
        
        var cityCircle = new google.maps.Circle(posOptions);
       
    });

    
    source.addEventListener('newClient',function(client) {

        client = JSON.parse(client.data);
        
        var newLi = document.createElement("li");

        newLi.style.color = client.color;
        
        var newContent = document.createTextNode(client.clientName);

        newLi.appendChild(newContent);  

        var ul = document.getElementById("clients");
        
        ul.appendChild(newLi);

    });


    source.addEventListener('open', function(openEv) {

    }, false);


    source.addEventListener('error', function(err) {
                
        if (err.readyState == EventSource.CLOSED) {
                    
            console.log('Connection was closed');
        }
                
    }, false);
}
else {
                
    console.log("EventSource not supported");
}


function initialize(langCenter,longCenter) {
    
    var mapOptions = { center: { lat: langCenter , lng: longCenter }, zoom: 16, mapTypeId : google.maps.MapTypeId.ROADMAP };
        
    map = new google.maps.Map(document.getElementById('map'), mapOptions);

}
