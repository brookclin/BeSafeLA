apikey = "AIzaSyB7UKHekldhwyNLDUopg6hIHT6ECX4gnng";

function initMap() {
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;
    var startMarker;
    var startListener;
    var endMarker;
    var endListener;
    var crimeMarkerArray = [];
    var map = new google.maps.Map(document.getElementById('routemap'), {
        zoom: 10,
        center: { lat: 34.02255525, lng: -118.28189665 }
    });

    map.data.loadGeoJson('lapd-bureaus.geojson');
    map.data.setStyle({ fillColor: '#007bff', fillOpacity: 0.01, strokeWeight: 1.2, strokeColor: '#007bff', strokeOpacity: 0.5 });

    // crimeIcon=new google.maps.Symbol({path:'CIRCLE'});


    map.addListener('mouseout', function() {
        if (startListener) {
            google.maps.event.removeListener(startListener);
        }
        if (endListener) {
            google.maps.event.removeListener(endListener);
        }
    });

    // var onChangeHandler = function() {
    //     calculateAndDisplayRoute(directionsService, directionsDisplay);
    // };
    // document.getElementById('start').addEventListener('change', onChangeHandler);
    // document.getElementById('end').addEventListener('change', onChangeHandler);

    google.maps.event.addDomListener(document.getElementById('startButton'), 'click', function() {

        directionsDisplay.setMap(null);
        for (var i = 0; i < crimeMarkerArray.length; i++) {
            crimeMarkerArray[i].setMap(null);
        }
        crimeMarkerArray = [];
        // document.getElementById('startAddress').innerHTML = "start point address";
        // document.getElementById('endAddress').innerHTML = "end point address";

        startListener = map.data.addListener('click', function(e) {
            if (startMarker) {
                startMarker.setPosition(e.latLng);

            } else {
                startMarker = new google.maps.Marker({
                    position: e.latLng,
                    map: map,
                    draggable: true,
                    title: "start",
                    label: "S"
                });
            }
            var geocoder = new google.maps.Geocoder;

            geocoder.geocode({ 'location': e.latLng }, function(results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        document.getElementById('startAddress').innerHTML = results[0].formatted_address;

                    } else {

                    }
                } else {
                    window.alert('Geocoder failed due to: ' + status);
                }
            });

        });


    });

    google.maps.event.addDomListener(document.getElementById('endButton'), 'click', function() {
        directionsDisplay.setMap(null);
        for (var i = 0; i < crimeMarkerArray.length; i++) {
            crimeMarkerArray[i].setMap(null);
        }
        crimeMarkerArray = [];
        // document.getElementById('startAddress').innerHTML = "start point address";
        // document.getElementById('endAddress').innerHTML = "end point address";
        endListener = map.data.addListener('click', function(e) {
            if (endMarker) {
                endMarker.setPosition(e.latLng);
            } else {
                endMarker = new google.maps.Marker({
                    position: e.latLng,
                    map: map,
                    draggable: true,
                    title: "end",
                    label: "E"
                });
            }
            var geocoder = new google.maps.Geocoder;

            geocoder.geocode({ 'location': e.latLng }, function(results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        document.getElementById('endAddress').innerHTML = results[0].formatted_address;

                    } else {

                    }
                } else {
                    window.alert('Geocoder failed due to: ' + status);
                }
            });

        });


    });

    google.maps.event.addDomListener(document.getElementById('find'), 'click', function() {

        directionsService.route({
            origin: startMarker.position,
            destination: endMarker.position,
            travelMode: 'WALKING'
        }, function(response, status) {
            if (status === 'OK') {
                // console.log(response);
                //draw crime points

                d3.csv("recentCrime.csv", function(data) {
                    // console.log(data[0]['Location ']);
                    // console.log(data[0]);
                    var lat, lng;
                    var crimeStatics = {};
                    var crimeLocations = {};
                    // console.log(response.routes[0].legs[0].steps[0].path[0]);
                    for (var i = 0; i < response.routes.length; i++) {
                        for (var j = 0; j < response.routes[i].legs.length; j++) {
                            for (var k = 0; k < response.routes[i].legs[j].steps.length; k++) {
                                for (var l = 0; l < response.routes[i].legs[j].steps[k].path.length; l++) {
                                    lat = +(response.routes[i].legs[j].steps[k].path[l].lat()).toFixed(4);
                                    lng = +(response.routes[i].legs[j].steps[k].path[l].lng()).toFixed(4);
                                    // console.log(lat,lng)
                                    for (var crimeidx = 0; crimeidx < data.length; crimeidx++) {
                                        var a = data[crimeidx]['Location '].replace('(', '');
                                        a = a.replace(')', '');
                                        clat = +a.split(',')[0];
                                        clng = +a.split(',')[1];
                                        if (Math.abs(clat - lat) < 0.003 && Math.abs(clng - lng) < 0.003) {

                                            if (crimeLocations['' + clat +' '+ clng]) {
                                                crimeLocations['' + clat +' '+ clng] += 1
                                            } else {
                                                crimeLocations['' + clat +' '+ clng] = 1
                                            }
                                            // console.log(data[crimeidx]['Date Occurred']);

                                            // var crimeMarker = new google.maps.Marker({
                                            //     position: { lat: clat, lng: clng },
                                            //     map: map,
                                            //     icon: {
                                            //         path: google.maps.SymbolPath.CIRCLE,
                                            //         scale: 20,
                                            //         fillColor: '#007bff',
                                            //         strokeColor: '#007bff',
                                            //         strokeOpacity: 0,
                                            //         strokeWeight: 1,
                                            //         fillOpacity: 0.02

                                            //     }
                                            // });

                                            // setCrimeMarker(crimeMarker, data[crimeidx]);
                                            // crimeMarkerArray.push(crimeMarker);

                                            if (crimeStatics[data[crimeidx]['Crime Code']]) {
                                                crimeStatics[data[crimeidx]['Crime Code']]['count'] += 1
                                            } else {
                                                crimeStatics[data[crimeidx]['Crime Code']] = {
                                                    'description': data[crimeidx]['Crime Code Description'],
                                                    'count': 1
                                                }
                                            }
                                            // console.log(data[crimeidx]);

                                        }
                                    }
                                }
                            }
                        }
                    }

                    for (var key in crimeLocations) {
                        var crimeMarker = new google.maps.Marker({
                            position: { lat: +key.split(' ')[0], lng: +key.split(' ')[1] },
                            map: map,
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 20,
                                fillColor: '#007bff',
                                strokeColor: '#007bff',
                                strokeOpacity: 0,
                                strokeWeight: 1,
                                fillOpacity: 0.02*crimeLocations[key]

                            }
                        });

                        // setCrimeMarker(crimeMarker, data[crimeidx]);
                        crimeMarkerArray.push(crimeMarker);

                    }

                    console.log(Object.values(crimeStatics));
                });



                directionsDisplay.setDirections(response);
                directionsDisplay.setMap(map);




            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
        startMarker.setMap(null);
        endMarker.setMap(null);
        startMarker = null;
        endMarker = null;
    });
    google.maps.event.addDomListener(document.getElementById('reset'), 'click', function() {
        directionsDisplay.setMap(null);
        for (var i = 0; i < crimeMarkerArray.length; i++) {
            crimeMarkerArray[i].setMap(null);
        }
        crimeMarkerArray = [];
        document.getElementById('startAddress').innerHTML = "Select start point";
        document.getElementById('endAddress').innerHTML = "Select end point";
    });
}

function setCrimeMarker(marker, data) {
    var crimeInfoWindow = new google.maps.InfoWindow({ content: data['Date Occurred'] });
    marker.addListener('click', function() {
        // console.log(data[crimeidx]);

        crimeInfoWindow.open(marker.get('map'), marker);
    });
}