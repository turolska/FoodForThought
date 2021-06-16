// Initialize and add the map
// The following example creates five accessible and
// focusable markers.
var map;
let markers = [];

function initMap() {
   map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: { lat: 39.99851989746094, lng: -82.9999008178711 },
  });

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
  
function addMarkers(data,price){
  // Set LatLng and title text for the markers. The first marker (Boynton Pass)
  // receives the initial focus when tab is pressed. Use arrow keys to
  // move between markers; press tab again to cycle through the map controls.
  //data = data.slice(0, 10);
    deleteMarkers();
    
    var restaurants = [];

    for (i=0;i<data.length;i++){
        if ((data[i]['price_range_num']!=2 && data[i]['price_range_num']!=3)||price==0){
            const contentString =
              '<div id="content">' +
              '<div id="siteNotice">' +
              "</div>" +
              '<h1 id="firstHeading" class="firstHeading">'+"<a href="+data[i]['restaurant_website']+">"+ data[i]['restaurant_name']+'</a></h1>' +
              '<div id="bodyContent">' +
              "<p><b>Address:</b> "+data[i]['address']['formatted']+"</p>" +
            "<p><b>Phone:</b> "+data[i]['restaurant_phone']+"</p>" +
            "<p><b>Price Range:</b> "+data[i]['price_range']+"</p>" +
            "<p><b>Hours:</b> "+data[i]['hours']+"</p>" +
              "</div>" +
              "</div>";
            restaurants.push([{ lat: data[i]['geo']['lat'], lng: data[i]['geo']['lon'] }, contentString])
        }

    }
    

  // Create an info window to share between markers.
  const infoWindow = new google.maps.InfoWindow();
  // Create the markers.
    restaurants.forEach(([position, title], i) => {
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
