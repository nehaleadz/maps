var map, polygon, curlocation;
var placeMarkers = [];

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
        console.log('up arrow');
    }
    else if (e.keyCode == '40') {
        // down arrow
        console.log('down arrow');
    }
    else if (e.keyCode == '37') {
       // left arrow
       console.log('left arrow');
    }
    else if (e.keyCode == '39') {
       // right arrow
       console.log('right arrow');
    }

}

$(function () {
      var marker = new SlidingMarker();
      console.log(marker);

      initMap();
});
function initMap(){

  // $.getScript( "lib/markerAnimate.js", function( data, textStatus, jqxhr ) {
  //
  //   var SlidingMarker = $('lib/markerAnimate.js');
  //   var marker = new SlidingMarker();
  //
  //   console.log( data ); // Data returned
  //   console.log( textStatus ); // Success
  //   console.log( jqxhr.status ); // 200
  //   console.log( "Load was performed." );
  // });



    curlocation = {lat:43.66, lng: -79.3807 };
    var pressed = null;

    document.onkeydown = checkKey;



    map = new google.maps.Map(document.getElementById('map'), {
        center: curlocation,
        zoom: 16,
        panControl: true,
        zoomControl: true,
        zoomControlOptions: {
          style: google.maps.ZoomControlStyle.LARGE
        }
    });

    var marker = new google.maps.Marker({
        position: curlocation,
        map: map,
        title: 'Eaton Centre'
    });
    var infoWindow = new google.maps.InfoWindow({
        content: 'Hello Shopping!!!' + marker.position
    });
    var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), {
        position: curlocation,
        pov:{
            heading: 0,
            pitch: 0
        }
    });
    //map.setStreetView(panorama);

    marker.addListener('click', function(){
        infoWindow.open(map, marker);
    });

    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions:{
            position: google.maps.ControlPosition.TOP_LEFT,
            drawingModes:[
                google.maps.drawing.OverlayType.POLYGON
            ]
        }
    });

    document.getElementById('toggle-drawing').addEventListener('click', function(){
        toggleDrawing(drawingManager);
    });

    drawingManager.addListener('overlaycomplete', function(event){
        if (polygon){
            polygon.setMap(null);
        }
        //Switch drawing mode to HAND
        drawingManager.setDrawingMode(null);
        polygon = event.overlay;
        polygon.setEditable(true);

        var area = google.maps.geometry.spherical.computeArea(polygon.getPath());
        console.log('Area is : ' + area);
    });
    document.getElementById('zoom-to-area').addEventListener('click', function(){
        zoomToArea();
    });
    document.getElementById('calculate').addEventListener('click', function(){
        calculateDistance();
    });

    var zoomAutoComplete = new google.maps.places.Autocomplete(
        document.getElementById('zoom-to-area-text'));
    zoomAutoComplete.bindTo('bounds', map);

    var srcAutoComplete = new google.maps.places.Autocomplete(
        document.getElementById('src-loc-text'));
    srcAutoComplete.bindTo('bounds', map);

    var destAutoComplete = new google.maps.places.Autocomplete(
        document.getElementById('dest-loc-text'));
    destAutoComplete.bindTo('bounds', map);

    var searchBox = new google.maps.places.SearchBox(
        document.getElementById('places-search'));
    //Bias the searchbox to within the bounds of the map.
    searchBox.setBounds(map.getBounds());

    searchBox.addListener('places_changed', function(){
        searchBoxPlaces(this);
    });

    document.getElementById('go-places').addEventListener('click', textSearchPlaces);
}

function toggleDrawing(drawingManager){
    if (drawingManager.map){
        drawingManager.setMap(null);
        if (polygon){
            polygon.setMap(null);
        }
    }
    else{
        drawingManager.setMap(map);
    }
}

function zoomToArea(){
    var geocoder = new google.maps.Geocoder();

    var address = document.getElementById('zoom-to-area-text').value;
    if (address != ''){
        geocoder.geocode(
            {
                address: address,
                componentRestrictions: {locality: 'Toronto'}
            }, function(results, status){
                if (status == google.maps.GeocoderStatus.OK){
                    curlocation = results[0].geometry.location;
                    map.setCenter(curlocation);
                    map.setZoom(15);
                    updatePanoramaView();
                }
            }
        )
    }
}

function calculateDistance(){
    var distanceMatrixService = new google.maps.DistanceMatrixService;
    var srcAddress = document.getElementById('src-loc-text').value;
    var destAddress = document.getElementById('dest-loc-text').value;
    var travelMode = google.maps.TravelMode.DRIVING;
    if (srcAddress != '' && destAddress != ''){
        distanceMatrixService.getDistanceMatrix(
            {
                origins: [srcAddress],
                destinations: [destAddress],
                travelMode: travelMode,
                unitSystem: google.maps.UnitSystem.IMPERIAL
            }, function(result, status){
                if (status == google.maps.DistanceMatrixStatus.OK){
                    console.log(result);
                    var distance = result.rows[0].elements[0].distance.text;
                    var duration = result.rows[0].elements[0].duration.text;
                    var msg ='It will take '+duration+' to cover '+distance+' from '+ srcAddress+' to '+destAddress;
                    window.alert(msg);
                }
            }
        )
    }
}

function updatePanoramaView(){
    var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), {
        position: curlocation,
        pov:{
            heading: 0,
            pitch: 0
        }
    });
    map.setStreetView(panorama);
}

function displayDirections(){
    var srcAddress = document.getElementById('src-loc-text').value;
    var destAddress = document.getElementById('dest-loc-text').value;
    var travelMode = google.maps.TravelMode.DRIVING;

    var directionService = new google.maps.DirectionsService;
    directionService.route({
        origin: srcAddress,
        destination: destAddress,
        travelMode: travelMode
    },function(response, status){
        if (status === google.maps.DirectionsStatus.OK){
            var directionsDisplay = new google.maps.DirectionsRenderer({
                map: map,
                directions: response,
                draggable: true,
                polylineOptions: {
                    strokeColor: 'green'
                }
            });
        } else {
            window.alert('Directions request failed due to ', status);
        }
    });
}

function hideMarkers(markers){
    for (var i = 0; i < markers.length; i++){
        markers[i].setMap(null);
    }
}

function searchBoxPlaces(searchBox){
    hideMarkers(placeMarkers);
    var places = searchBox.getPlaces();
    createMarkersForPlaces(places);
    if (places.length == 0){
        window.alert('No place was found that matched that search');
    }
}

function textSearchPlaces(){
    var bounds = map.getBounds();
    hideMarkers(placeMarkers);

    var placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
        query: document.getElementById('places-search').value,
        location: curlocation,
        radius: 10,
        bounds: bounds
    }, function(results, status){
        if (status === google.maps.places.PlacesServiceStatus.OK){
            createMarkersForPlaces(results);
        }
    });
}

function getPlaceDetails(marker, infoWindow){
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
        placeId: marker.id
    }, function(place, status){
        if (status === google.maps.places.PlacesServiceStatus.OK){
            //Set the marker property on this infowindow so it isn't created again.
            infoWindow.marker = marker;
            var innerHTML = '<div>';
            if (place.name){
                innerHTML += '<strong>' + place.name + '</strong>';
            }
            if (place.formatted_address){
                innerHTML += '<br>' + place.formatted_address;
            }
            if (place.formatted_phone_number){
                innerHTML += '<br>' + place.formatted_phone_number;
            }
            if (place.opening_hours){
                innerHTML += '<br><br><strong>Hours:</strong><br>';
                for (var i = 0; i < place.opening_hours.weekday_text.length; i++){
                    innerHTML+= place.opening_hours.weekday_text[i] + '<br>';
                }
            }
            if (place.photos){
                innerHTML += '<br><br><img src="' + place.photos[0].getUrl({
                    maxHeight: 100, maxWidth: 200
                }) + '">';
            }
            infoWindow.setContent(innerHTML);
            infoWindow.open(map, marker);
            //Make sure info window marker is cleared when infowindow is closed
            infoWindow.addListener('closeclick', function(){
              infoWindow.marker = null;
            })
        }
    })
}

function createMarkersForPlaces(places){
    var bounds = new google.maps.LatLngBounds();
    for (var i =0; i< places.length; i++){
        var place = places[i];
        var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        var marker = new google.maps.Marker({
            map: map,
            icon: icon,
            title: place.name,
            position: place.geometry.location,
            id: place.place_id
        });

        var placeInfoWindow = new google.maps.InfoWindow();
        marker.addListener('click', function(){
            if (placeInfoWindow.marker == this){
                console.log("This info window is already on this marker");
            }
            else{
                getPlaceDetails(this, placeInfoWindow);
            }
        })

        placeMarkers.push(marker);
        if (place.geometry.viewport){
            bounds.union(place.geometry.viewport);
        } else{
            bounds.extend(place.geometry.location);
        }
    }
    map.fitBounds(bounds);
}
