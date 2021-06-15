// Initialize and add the map
// The following example creates five accessible and
// focusable markers.
var map;
function initMap() {
   map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: { lat: 39.99851989746094, lng: -82.9999008178711 },
  });

}
  
function addMarkers(){
  // Set LatLng and title text for the markers. The first marker (Boynton Pass)
  // receives the initial focus when tab is pressed. Use arrow keys to
  // move between markers; press tab again to cycle through the map controls.
  const tourStops = [
    [{ lat: 39.962760, lng: -82.996290 }, "McDonalds"],
    [{ lat: 40.057760, lng: -83.073970 }, "Wendys"],
    [{ lat: 40.104480, lng: -82.856660 }, "Taco Bell"],
    [{ lat: 39.9279705, lng: -82.8298537 }, "Chipotle"],
    [{ lat: 39.9948796, lng: -83.0072772 }, "Five Guys"],
  ];
  // Create an info window to share between markers.
  const infoWindow = new google.maps.InfoWindow();
  // Create the markers.
  tourStops.forEach(([position, title], i) => {
    const marker = new google.maps.Marker({
      position,
      map,
      title: `${i + 1}. ${title}`,
      label: `${i + 1}`,
      optimized: false,
    });
    // Add a click listener for each marker, and set up the info window.
    marker.addListener("click", () => {
      infoWindow.close();
      infoWindow.setContent(marker.getTitle());
      infoWindow.open(marker.getMap(), marker);
    });
  });
  
}
