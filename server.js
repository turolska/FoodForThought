//server.js
const express = require('express'),
      server = express()

var tweet = require('./tweets');


//const app = express();
//app.use(express.static('public')); /* this line tells Express to use the public folder as our static folder from which we can serve static files*/
server.use(express.static('public'));

var PS = require('./ParkSearch.js');
let search = new PS();
search.init();

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
    if(req_data['param2'] == 1){
        search.clearAll();
    }
    switch(req_data['method']) {
        case 'addTerm':
            req_data['param1'].forEach(element => search.addTerm(element));
            search.search().then(res => {response.json(res);});
            break;
        case 'addState':
            req_data['param1'].forEach(element => search.addState(element));
            search.search().then(res => {response.json(res);});
            break;
            
        case 'getTweetKeywords':
            tweet.getTweets(req_data['param1']).then(res => {response.json(res)});
            break;

        default:
        // code block
    }
    
    
});

//Binding to localhost://3000
server.listen(3000,()=>{
 console.log('Express server started at port 3000');
});

