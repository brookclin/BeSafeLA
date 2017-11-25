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
    .select("div#map-left")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
var color;
// multiple async tasks
var queue = d3.queue();
queue.defer(d3.json, "lapd-divisions.geojson")
queue.defer(d3.json, "data processing/dataByAreaV2.json")
queue.defer(d3.json, "data processing/dataOverall.json")
queue.await(ready);
var select_years = ['All', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010'];

// current selection on year and area, all times and all areas by default
var selected_year = 'All';
var selected_area;
var overall_data;
var area_data;
// dispatch
var dispatch = d3.dispatch("load", "statechange", "areachange");
dispatch.on("load.menu", function () {
    var select = d3.select("body")
        .select("div#select-year")
        .append("select")
        .attr("class", "custom-select")
        .on("change", function () { dispatch.call("statechange", this, this.value); });

    select.selectAll("option")
        .data(select_years)
        .enter().append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; });

    dispatch.on("statechange.menu", function (d) {
        select.property("value", d);
        selected_year = d;
    });
});

dispatch.on("load.map", function () {
    var paths = svg.selectAll("path");
    paths_data = paths.data();
    paths.on("mouseout", function (d) {
        tooltip.style("display", "none");
    });

    dispatch.on("statechange.map", function (y) {
        color.domain([Math.floor(d3.min(paths_data, function (d) { return d.properties.byYear[y][0]['count']; })),
        Math.ceil(d3.max(paths_data, function (d) { return d.properties.byYear[y][0]['count']; }))]);
        paths.transition().duration(800).attr("fill", function (d) {
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

dispatch.on("load.line", function () {
    var current_dataset;
    if (selected_area == null) {
        current_dataset = overall_data;
    } else {
        current_dataset = area_data[selected_area][0];
    }
    dispatch.on("statechange.line", function (y) {
        if (y == 'All') {
            drawLine(current_dataset['CountByMonth']);
        } else {
            var month_filtered = Object.keys(current_dataset['CountByMonth'])
                .filter(function (key) { return key.includes(y); });
            var time_subset = {}
            for (var i = 0; i < month_filtered.length; i++) {
                time_subset[month_filtered[i]] = current_dataset['CountByMonth'][month_filtered[i]];
            }
            drawLine(time_subset);
        }
        
    });
    dispatch.on("areachange.line", function (data) {
        
    });
});

dispatch.on("areachange.title", function (data) {
    d3.selectAll("path")
        .classed("selected", false);
    selected_area = data.properties.name;
    // title on selected area
    d3.select("body")
        .select("div#area")
        .select("span#current-area")
        .text(selected_area);
});


function ready(error, geojson, areadata, overall) {

    if (error) throw error;
    overall_data = overall;
    area_data = d3.nest()
        .key(function (d) { return d['Area Name']; })
        .object(areadata);

    var json_features = dataPrep(geojson, areadata);
    color = d3.scaleQuantize()
        .range(d3.schemeOranges[9]);
    svg.selectAll("path")
        .data(json_features)
        .enter()
        .append("path")
        .attr("class", "map")
        .attr("d", path)
        .on("click", function (d) {
            dispatch.call("areachange", this, d);
            d3.select(this).classed("selected", true);
        });
    
    // right part
    // line chart
    d3.select('body')
        .select('div#map-right')
        .append('svg')
        .attr("class", "map-line");

    dispatch.call("load", this);
    dispatch.call('statechange', this, selected_year);
}

function drawLine(data) {
    
    if ("10/2017" in data) {
        delete data["10/2017"];
    }
    var data = d3.entries(data); // [{key:.., value:..}]
    data.forEach(function (entry) {
        entry['key'] = entry['key'].split('/').reverse().join('/'); // 01/2010 -> 2010/01
    });
    data.sort(function (x, y) { // sort by date
        return d3.ascending(x.key, y.key);
    });
    console.log(data);
    var mind = d3.min(data, function (d) { return d['value']; });
    var maxd = d3.max(data, function (d) { return d['value']; });
    var w = 500, h = 200, padding = 30;

    var xscale = d3.scaleBand()
        .domain(data.map(function (d) {
            return d['key'];
        }))
        .range([padding, w - padding])

    var yscale = d3.scaleLinear()
        .domain([mind - 1000, maxd])
        .range([h - padding, padding]);

    var svg = d3.select('body')
        .select('div#map-right')
        .select('svg.map-line')
        .attr('width', w)
        .attr('height', h);

    var line = d3.line()
        .x(function (d) { return xscale(d['key']) + 35; })
        .y(function (d) { return yscale(d['value']); })
        .curve(d3.curveMonotoneX);

    var change = false;
    var line_path = svg.selectAll("path.line").data([!change]);
    
    line_path.exit().remove();
    //update 
    line_path.attr("d", line(data))
    line_path.enter().append("path")
        .attr("d", line(data))
        .attr("class", "line");
    
    var circles = svg.selectAll(".dot").data(data);
    circles.exit().remove();
    // update
    circles.attr("class", "dot") // Assign a class for styling
        .attr("cx", function (d) { return xscale(d['key']) + 35; })
        .attr("cy", function (d) { return yscale(d['value']); })
        .attr("r", 2);
    circles.enter()
        .append("circle") // Uses the enter().append() method
        .attr("class", "dot") // Assign a class for styling
        .attr("cx", function (d) { return xscale(d['key']) + 35; })
        .attr("cy", function (d) { return yscale(d['value']); })
        .attr("r", 2);
    
    // avoid x-axis labels overlap
    var ticks = data.map(function (d) { return d['key']; })
        .filter(function (v, i) { return i % 6 == 0; });
    var xAxis = d3.axisBottom()
        .scale(xscale)
        .ticks(10)
        .tickValues(ticks);
    var g_xaxis = svg.selectAll('g.xaxis').data([!change]);
    // update
    g_xaxis.attr('class', 'xaxis')
        .attr('transform', "translate(0," + (h - padding) + ")")
        .call(xAxis);
    // svg.append('g')
    g_xaxis.enter().append('g')
        .attr('class', 'xaxis')
        .attr('transform', "translate(0," + (h - padding) + ")")
        .call(xAxis);
    
    // todo: text should not append again 
    var btext = svg.append('text')
        .attr('x', w - 5 * padding)
        .attr('y', h - padding / 10)
        .style('font-size', '10px');
    btext.append('tspan').text('Year/Month')

    var yAxis = d3.axisLeft()
        .scale(yscale)
        .ticks(10);
    var g_yaxis = svg.selectAll('g.yaxis').data([!change]);
    // update
    g_yaxis.attr('class', 'yaxis')
        .attr('transform', 'translate(' + padding + ',0)')
        .call(yAxis);
    g_yaxis.enter().append('g')
        .attr('class', 'yaxis')
        .attr('transform', 'translate(' + padding + ',0)')
        .call(yAxis);
    var ltext = svg.append('text')
        .attr('x', w / 2 + 80)
        .attr('y', padding / 2 - 20)
        .attr('transform', 'rotate(-90,' + w / 2 + ',' + w / 2 + ')');
    ltext.append('tspan').text('#Cases');
}

function updateLine_axis() {

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