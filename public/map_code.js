// Initialize and add the map
// The following example creates five accessible and
// focusable markers.
var map;
let markers = [];
var curr_lat;
var curr_lng;
var oldData;
var doneDist = false;

function successFunction(position)
{
    var lat = position.coords.latitude;
    var lng = position.coords.longitude;
    curr_lat = lat;
    curr_lng = lng;
    map = new google.maps.Map(document.getElementById("map"), {
     zoom: 5,
     center: { lat: lat, lng: lng },
   });
    var data = displayLocation(lat, lng);
    var state = data[0]['state'];
    var states = [];
    states.push(state);
    getDataLocation(states);
}

function errorFunction(position)
{
    alert('Error!');
}

function displayLocation(latitude,longitude){
  var request = new XMLHttpRequest();

  var method = 'GET';
  var url = 'http://api.openweathermap.org/geo/1.0/reverse?lat='+latitude+'&lon='+longitude+'&appid=1072af670427f1bc7cebf17e0f35dd47';

  request.open(method, url, false);
  request.send();
  if(request.status == 200){
    return JSON.parse(request.responseText);
  }
}

function distance_func(lat1,lon1,lat2,lon2){
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres
    const dist = 0.00062 * d;
    return dist;

}

function getDataLocation(state){
    $.ajax({
    url : '/map',
    method : 'GET',
    data: { method: "addState", param1: state},
    success : function(data){
       addMarkers(data,0);
    },
  
    error: function(err){
      console.log('Failed');
    }
})};

function initMap() {
    if (navigator.geolocation)
    {
        navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
    }
    else
    {
        alert('It seems like Geolocation, which is required for this page, is not enabled in your browser.');
    }


}

function mapStateInits(states){
    var statesMap = {
        'Arizona': 'AZ',
        'Alabama': 'AL',
        'Alaska': 'AK',
        'Arkansas': 'AR',
        'California': 'CA',
        'Colorado': 'CO',
        'Connecticut': 'CT',
        'Delaware': 'DE',
        'Florida': 'FL',
        'Georgia': 'GA',
        'Hawaii': 'HI',
        'Idaho': 'ID',
        'Illinois': 'IL',
        'Indiana': 'IN',
        'Iowa': 'IA',
        'Kansas': 'KS',
        'Kentucky': 'KY',
        'Louisiana': 'LA',
        'Maine': 'ME',
        'Maryland': 'MD',
        'Massachusetts': 'MA',
        'Michigan': 'MI',
        'Minnesota': 'MN',
        'Mississippi': 'MS',
        'Missouri': 'MO',
        'Montana': 'MT',
        'Nebraska': 'NE',
        'Nevada': 'NV',
        'New Hampshire': 'NH',
        'New Jersey': 'NJ',
        'New Mexico': 'NM',
        'New York': 'NY',
        'North Carolina': 'NC',
        'North Dakota': 'ND',
        'Ohio': 'OH',
        'Oklahoma': 'OK',
        'Oregon': 'OR',
        'Pennsylvania': 'PA',
        'Rhode Island': 'RI',
        'South Carolina': 'SC',
        'South Dakota': 'SD',
        'Tennessee': 'TN',
        'Texas': 'TX',
        'Utah': 'UT',
        'Vermont': 'VT',
        'Virginia': 'VA',
        'Washington': 'WA',
        'West Virginia': 'WV',
        'Wisconsin': 'WI',
        'Wyoming': 'WY'
    };
    for(let i=0; i < states.length; i++){
        states[i] = statesMap[states[i]];
    }
    return states;
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
  setMapOnAll(null);
  markers = [];
}

function findWithinDistance(data, distance){
    var finalData = new Array();
    for(let i=0; i<data.length;i++){
        if(distance_func(curr_lat,curr_lng,parseFloat(data[i].latitude),parseFloat(data[i].longitude)) < distance){
            finalData.push(data[i]);
        }
    }
    return finalData;
}
  
function addMarkers(data){
  // Set LatLng and title text for the markers. The first marker (Boynton Pass)
  // receives the initial focus when tab is pressed. Use arrow keys to
  // move between markers; press tab again to cycle through the map controls.
    if(data.length == 0){
        data = oldData;
    }
    else{
        oldData = data;
    }
    if(doneDist || distance == null || distance == 0){
        data = data.slice(0, 25);
    }
    else{
        data = findWithinDistance(data, distance)
    }
    
    deleteMarkers();
    
    var parks = [];

    for (i=0;i<data.length;i++){
        //if (data[i]['price_range_num'] <= price){
        var act = "";
        if(data[i]['activities'] != null){
            for(a=0;a<data[i]['activities'].length;a++){
                var hasTerm = termsSet.has(data[i]['activities'][a]['name']);
                if(hasTerm){
                    act+='<mark>';
                }
                act+=data[i]['activities'][a]['name'];
                if(hasTerm){
                    act+='</mark>';
                }
                if (a<data[i]['activities'].length - 1){
                    act+=", ";
                }
            }
        }
        
        var top = "";
        if(data[i]['topics'] != null){
            for(a=0;a<data[i]['topics'].length;a++){
                var hasTerm = termsSet.has(data[i]['topics'][a]['name']);
                if(hasTerm){
                    top+='<mark>';
                }
                top+=data[i]['topics'][a]['name'];
                if(hasTerm){
                    top+='</mark>';
                }
                if (a<data[i]['topics'].length - 1){
                    top+=", ";
                }
            }
        }
        
        var slide = "";
        if(data[i]['images'] != null){
            for(im=0;im<data[i]['images'].length;im++){
                var img = '<div class="mySlides fade">' +
                  '<div class="numbertext">'+String(im+1)+' / '+String(data[i]['images'].length)+'</div>'+
                  '<img src="'+data[i]['images'][im]['url']+'" style="width:100%">'+
                  '<div class="text">'+data[i]['images'][im]['caption']+'</div>'+
                '</div>';
                slide+=img;
            }
        }
        var phoneNum = "";
        if (data[i]['contacts']['phoneNumbers'][0] != null){
            phoneNum = "<p><b>Phone:</b> "+data[i]['contacts']['phoneNumbers'][0]['phoneNumber']+"</p>";
        }
        const contentString =
          '<div id="content">' +
          '<div id="siteNotice">' +
          "</div>" +
          '<h1 id="firstHeading" class="firstHeading">'+data[i]['fullName']+'</h1>' +
          '<div id="bodyContent">' +
          "<p><b>Description:</b> "+data[i]['description']+"</p>" +
        "<p><b>Activities:</b> "+act+"</p>" +
        "<p><b>Topics:</b> "+top+"</p>" +
        phoneNum +
        "<p><b>Weather:</b> "+data[i]['weatherInfo']+"</p>" +
        "<p><b>Website:</b> "+"<a href="+data[i]['url']+">"+ data[i]['url']+'</a>'+"</p>" +
        
        '<div class="slideshow-container">' + slide +
        '<a class="prev" onclick="plusSlides(-1)">&#10094;</a>'+
        '<a class="next" onclick="plusSlides(1)">&#10095;</a>'+
        "</div>" +
        
          "</div>" +
          "</div>";
        parks.push([{ lat: parseFloat(data[i]['latitude']), lng: parseFloat(data[i]['longitude']) }, contentString]);
    }
    

  // Create an info window to share between markers.
  const infoWindow = new google.maps.InfoWindow();
  // Create the markers.
    parks.forEach(([position, title], i) => {
    const marker = new google.maps.Marker({
      position,
      map,
      title: title,
      label: `${i + 1}`,
      optimized: false,
    });
    // Add a click listener for each marker, and set up the info window.
    marker.addListener("click", () => {
      infoWindow.close();
      infoWindow.setContent(marker.getTitle());
      infoWindow.open(marker.getMap(), marker);
    });
    markers.push(marker);
  });
  
}
