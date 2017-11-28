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
        zoom: 15,
        center: { lat: 34.02255525, lng: -118.28189665 }
    });
    // https://maps.google.com/maps/api/staticmap?center=34.02255525%2C-118.28189665&zoom=15&size=256x256&language=en&sensor=false&client=google-maps-frontend&signature=reL4qZBZ1BTUXSsvk7E0X8k1y4Q
    map.data.loadGeoJson('lapd-bureaus.geojson');
    map.data.setStyle({ fillColor: '#007bff', fillOpacity: 0.01, strokeWeight: 1.2, strokeColor: '#007bff', strokeOpacity: 0.5 });

    // crimeIcon=new google.maps.Symbol({path:'CIRCLE'});


    map.addListener('mouseout', function() {
        if (directionsDisplay.map == null) {
            if (document.getElementById('startButton')['disabled']) {
                document.getElementById('startButton')['disabled'] = null;
            }

            if (document.getElementById('endButton')['disabled']) {
                document.getElementById('endButton')['disabled'] = null;
            }
        }


        if (startListener) {
            google.maps.event.removeListener(startListener);
        }
        if (endListener) {
            google.maps.event.removeListener(endListener);
        }
    });


    google.maps.event.addDomListener(document.getElementById('startButton'), 'click', function() {

        directionsDisplay.setMap(null);
        for (var i = 0; i < crimeMarkerArray.length; i++) {
            crimeMarkerArray[i].setMap(null);
        }
        crimeMarkerArray = [];
        document.getElementById('startButton')["disabled"] = "disabled";

        startListener = map.data.addListener('click', function(e) {
            if (startMarker) {
                startMarker.setPosition(e.latLng);

            } else {
                startMarker = new google.maps.Marker({
                    position: e.latLng,
                    map: map,
                    // draggable: true,
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
        document.getElementById('endButton')["disabled"] = "disabled";
        // document.getElementById('startAddress').innerHTML = "start point address";
        // document.getElementById('endAddress').innerHTML = "end point address";
        endListener = map.data.addListener('click', function(e) {
            if (endMarker) {
                endMarker.setPosition(e.latLng);
            } else {
                endMarker = new google.maps.Marker({
                    position: e.latLng,
                    map: map,
                    // draggable: true,
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
        document.getElementById('endButton')["disabled"] = "disabled";
        document.getElementById('startButton')["disabled"] = "disabled";
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
                                        if (Math.abs(clat - lat) < 0.002 && Math.abs(clng - lng) < 0.002) {

                                            if (crimeLocations['' + clat + ' ' + clng]) {
                                                // crimeLocations['' + clat + ' ' + clng].count+=1
                                                if (crimeLocations['' + clat + ' ' + clng][data[crimeidx]['Crime Code']]) {
                                                    crimeLocations['' + clat + ' ' + clng][data[crimeidx]['Crime Code']]['count'] += 1
                                                } else {
                                                    crimeLocations['' + clat + ' ' + clng][data[crimeidx]['Crime Code']] = { 'description': data[crimeidx]['Crime Code Description'], 'count': 1 }
                                                }
                                            } else {
                                                crimeLocations['' + clat + ' ' + clng] = {}
                                                crimeLocations['' + clat + ' ' + clng][data[crimeidx]['Crime Code']] = { 'description': data[crimeidx]['Crime Code Description'], 'count': 1 }
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
                        var totalcount=0;
                        for (var i=0;i<Object.values(crimeLocations[key]).length;i++){
                            totalcount+=Object.values(crimeLocations[key])[i].count;
                        }
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
                                fillOpacity: 0.02*totalcount>0.8?0.8:0.02*totalcount

                            }
                        });

                        setCrimeMarker(crimeMarker, Object.values(crimeLocations[key]), crimeMarkerArray.length);
                        crimeMarkerArray.push(crimeMarker);

                    }

                    // console.log(Object.values(crimeStatics));
                });



                directionsDisplay.setDirections(response);
                directionsDisplay.setMap(map);
                // console.log(directionsDisplay);




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
        // startMarker.setMap(null);
        // endMarker.setMap(null);
        startMarker = null;
        endMarker = null;
        document.getElementById('endButton')["disabled"] = null;
        document.getElementById('startButton')["disabled"] = null;
    });
}

var margin = { top: 15, right: 25, bottom: 15, left: 0  }

function setCrimeMarker(marker, data, markeridx) {
    var crimeInfoWindow = new google.maps.InfoWindow();
    var container = d3.select(document.createElement("div"));

    var width = 200 - margin.left - margin.right;
    var height = 200 - margin.top - margin.bottom;
    var svg = container.append('svg').attr('width', width + margin.left + margin.right)
        .attr('height', width + margin.top + margin.bottom)
        .append('g')
        .attr("transform","translate("+margin.left+","+margin.top+")");
    // svg.selectAll('text').data(data).enter().append('text')
    //     .text(function(d){return d.description.split(" ")[0]+d.count;});
    var x=d3.scaleLinear()
        .range([0,width])
        .domain([0,d3.max(data,function(d){return d.count;})]);
    var y=d3.scaleBand()
        .rangeRound([height,0])
        .padding(0.5)
        .domain(data.map(function(d){
            return d.description;
        }));
    var yAxis=d3.axisLeft(y).ticks(0);
    var gy=svg.append("g")
            .attr("class","yaxis")
            .call(yAxis);
    var bars=svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("g");
    bars.append("rect")
        .attr("class","bar")
        .attr("y",function(d){
            return y(d.description);
        })
        .attr("height",y.bandwidth())
        .attr("x",0)
        .attr("width",function(d){
            return x(d.count);
        })
        .attr('fill','#007bff')
        .attr('fill-opacity',0.7);
    var texts = svg.selectAll(".label")
            .data(data);
    texts.text(function (d) {
            return d.description.split(" ")[0];;
        });
    texts.enter()
            .append("text")
            .attr("class", "label")
            .attr("y", function (d) {
                return y(d.description) + y.bandwidth() / 2+5;
            })
            .style("font-size", "1em")
            .style("fill", "black")
            //x position is 3 pixels to the right of the bar
            .attr("x", 3)
            .text(function (d) {
                return d.description.split(" ")[0]+":"+d.count;
            });

    
    var graphhtml = container.node().outerHTML;
    crimeInfoWindow.setContent(graphhtml);

    marker.addListener('click', function() {
        // console.log(data[crimeidx]);
        //     var svg=d3.select('#latlng'+markeridx);
        // // console.log(svg);
        //     svg.append('circle').attr('r',5);
        // var svg=d3.select('.routechart').select('svg');


        crimeInfoWindow.open(marker.get('map'), marker);
    });

    // marker.addListener('mouseout', function() {
    //     // console.log(data[crimeidx]);

    //     crimeInfoWindow.close();
    // });
}