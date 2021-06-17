//server.js
const express = require('express'),
      server = express();

//const app = express();
//app.use(express.static('public')); /* this line tells Express to use the public folder as our static folder from which we can serve static files*/
server.use(express.static('public'));

var RestaurantSearch = require('./RestaurantSearch.js');
let search = new RestaurantSearch();

//setting the port.
server.set('port', process.env.PORT || 3000);

//Adding routes
server.get('/',(request,response)=>{
 response.sendFile(__dirname + '/public/maps.html');

});
//
//server.get('/',(request,response)=>{
// response.sendFile(__dirname + '/map_code.js');
//
//});

server.get('/map',(request,response)=>{
    req_data = request.query;
    switch(req_data['method']) {
    case 'setCoordinates':
        search.setCoordinates(req_data['param1'],req_data['param2']);
        break;
    case 'setDistance':
        search.setDistance(req_data['param1']);
        break;
    case 'setCuisine':
        search.setCuisine(req_data['param1']);
        break;
    case 'setCity':
        search.setCity(req_data['param1'],req_data['param2']);
        break;
    case 'setZipCode':
        search.setZipCode(req_data['param1']);
        break;

    default:
    // code block
    }
    
    search.search().then(res => {response.json(res);});
});

//Binding to localhost://3000
server.listen(3000,()=>{
 console.log('Express server started at port 3000');
});





//.then(res => {map.addMarkers()});
