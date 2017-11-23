var width = 500;
var height = 600;
var projection = d3.geoMercator()
    .scale(40000)
    // Center the Map in LA
    .center([-118.245, 34.05])
    .translate([width / 2 + 100, height / 2]);
// var projection = d3.geoAlbersUsa()
//     .translate([width / 2, height / 2])
//     .scale([5000]);

var tooltip = d3.select("body").append("div").attr("class", "toolTip");
var path = d3.geoPath()  
    .projection(projection);
var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// multiple async tasks
var queue = d3.queue();
queue.defer(d3.json, "lapd-divisions.geojson")
queue.defer(d3.json, "data processing/dataByAreaV2.json")
queue.await(ready);

function ready(error, geojson, areadata) {
    if (error) throw error;
    var json_features = geojson.features;
    var crime_count = d3.map();
    for (i = 0; i < areadata.length; i++) {
        crime_count.set(areadata[i]['Area Name'], +areadata[i].count);
    }
    for (i = 0; i < json_features.length; i++) {
        var cur_id = json_features[i].properties.name;
        if (crime_count.has(cur_id)) {
            json_features[i].properties.count = crime_count.get(cur_id);
        }
    }
    var color = d3.scaleQuantize()
        .domain([Math.floor(d3.min(areadata, function (d) { return d.count; })),
        Math.ceil(d3.max(areadata, function (d) { return d.count; }))])
        .range(d3.schemeOranges[9]);
    svg.selectAll("path")
        .data(json_features)
        .enter()
        .append("path")
        .attr("d", path);
    var paths = svg.selectAll("path")
        .attr("fill", function(d) {
            return color(d.properties.count);
        });
    paths.on("mousemove", function (d) {
        tooltip.style("left", d3.event.pageX + 10 + "px");
        tooltip.style("top", d3.event.pageY - 25 + "px");
        tooltip.style("display", "inline-block");
        tooltip.html("<b>"+(d.properties.name)+"</b><br>#Cases: " + (d.properties.count));
    });
    paths.on("mouseout", function (d) {
        tooltip.style("display", "none");
    });
}
// d3.json("lapd-divisions.geojson", function (json) {
    
//     d3.json("data processing/dataByAreaV2.json", function (error, areadata) {
//         if (error) throw error;
        
//     });
// });