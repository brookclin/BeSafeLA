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
var color;
// multiple async tasks
var queue = d3.queue();
queue.defer(d3.json, "lapd-divisions.geojson")
queue.defer(d3.json, "data processing/dataByAreaV2.json")
queue.await(ready);
var select_years = ['All', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010'];

// dispatch
var dispatch = d3.dispatch("load", "statechange");
dispatch.on("load.menu", function (select_years) {
    var select = d3.select("body")
        .select("div#select-year")
        .append("select")
        .attr("class", "custom-select")
        .on("change", function () { dispatch.call("statechange", this, this.value); });
    // console.log(select_years);
    select.selectAll("option")
        .data(select_years)
        .enter().append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; });

    dispatch.on("statechange.menu", function (d) {
        select.property("value", d);
    });
});

dispatch.on("load.map", function (select_years) {
    var paths = svg.selectAll("path");
    paths_data = paths.data();
    paths.on("mouseout", function (d) {
        tooltip.style("display", "none");
    });

    dispatch.on("statechange.map", function(y) {
        color.domain([Math.floor(d3.min(paths_data, function (d) { return d.properties.byYear[y][0]['count']; })),
            Math.ceil(d3.max(paths_data, function (d) { return d.properties.byYear[y][0]['count']; }))]);
        paths.attr("fill", function (d) {
            return color(d.properties.byYear[y][0]['count']);
        })
        paths.on("mousemove", function (d) {
            tooltip.style("left", d3.event.pageX + 10 + "px");
            tooltip.style("top", d3.event.pageY - 25 + "px");
            tooltip.style("display", "inline-block");
            tooltip.html("<b>" + (d.properties.name) + "</b><br>#Cases: " + (d.properties.byYear[y][0]['count']));
        });
    });
});


function ready(error, geojson, areadata) {
    // console.log(areadata);
    if (error) throw error;
    var json_features = dataPrep(geojson, areadata);
    color = d3.scaleQuantize()
        .range(d3.schemeOranges[9]);
    svg.selectAll("path")
        .data(json_features)
        .enter()
        .append("path")
        .attr("d", path);
    dispatch.call("load", this, select_years);
    dispatch.call('statechange', this, 'All');
}

function dataPrep(geojson, areadata) {
    var json_features = geojson.features;
    var crime_count = d3.map();
    var year_area_count = [];
    for (i = 0; i < areadata.length; i++) {
        var total_count = areadata[i]['count'];
        var years = Object.keys(areadata[i]['byYear']);
        var area = areadata[i]['Area Name'];
        for (var j = 0; j < years.length; j++) {
            var count = areadata[i]['byYear'][years[j]]['count'];
            year_area_count.push({
                'year': years[j],
                'Area Name': area,
                'count': count
            });
        }
        year_area_count.push({
            'year': 'All',
            'Area Name': area,
            'count': total_count
        });
    }
    var nested_data = d3.nest()
        .key(function (d) { return d['Area Name']; })
        .key(function (d) { return d['year'] })
        .object(year_area_count);
    // console.log(nested_data);
    for (i = 0; i < areadata.length; i++) {
        crime_count.set(areadata[i]['Area Name'], +areadata[i].count);
    }
    for (i = 0; i < json_features.length; i++) {
        var cur_id = json_features[i].properties.name;
        if (cur_id in nested_data) {
            json_features[i].properties.byYear = nested_data[cur_id];
        }
    }
    return json_features;
}