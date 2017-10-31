var all;
var top5;
var bottom5;
var margin = { top: 50, left: 75, bottom: 50, right: 50 };
var width = 1000 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

var svg = d3.select("#chart").append("svg")
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr("viewBox", "0 0 1000 500")
    .append('g')
    .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

var x = d3.scaleBand();  //x scale
var y = d3.scaleLinear();  //y scale

d3.json("data processing/crimedataperarea.json", function (error, data) {
    all = data;
    top5 = all.sort(function (a, b) { return b['count'] - a['count']; }).slice(0, 5);
    bottom5 = all.sort(function (a, b) { return a['count'] - b['count']; }).slice(0, 5);
    drawBar();
});

// all data
d3.select("#all")
    .on("click", function () {
        var dataset = all;
        buttons = d3.selectAll("button");
        buttons.classed("active", false);
        buttons.attr("disabled", "disabled")
            .transition()
            .duration(0)
            .delay(1000)
            .attr("disabled", null);
        
        datajoin(dataset);
    });
// top 5
d3.select("#top5")
    .on("click", function () {
        buttons = d3.selectAll("button");
        buttons.classed("active", false);
        buttons.attr("disabled", "disabled")
            .transition()
            .duration(0)
            .delay(1000)
            .attr("disabled", null);
        var dataset = top5;
        datajoin(dataset);
    });
d3.select("#bottom5")
    .on("click", function () {
        buttons = d3.selectAll("button");
        buttons.classed("active", false);
        buttons.attr("disabled", "disabled")
            .transition()
            .duration(0)
            .delay(1000)
            .attr("disabled", null);
        var dataset = bottom5;
        datajoin(dataset);
    });
function datajoin(dataset) {
    x.domain(dataset.map(function (d) { return d['_id']; }));
    // DATA JOIN.
    var bars = svg.selectAll(".bar")
        .data(dataset, function (d) { return d['_id']; });

    var delay = function (d, i) { 
        if (dataset.length == 10 && d3.selectAll(".bar").size() == 5) {
            return 50;
        }
        return i * 50; 
    };
    // UPDATE.
    bars.transition()
        .duration(750)
        .delay(delay)
        .attr("x", function (d) { return x(d['_id']); })
        .attr("width", x.bandwidth());
    // ENTER
    bars.enter().append("rect")
        .attr("x", function (d) { return x(d['_id']); })
        .attr("y", function (d) {return y(0);})
        .style("opacity", 0)
        .transition()
        .duration(750)
        .delay(delay)
        .style("opacity", 1)
        .attr("class", "bar")
        .attr("y", function (d) { return y(d['count']); })
        .attr("width", x.bandwidth())
        .attr("height", function (d) { return height - y(d['count']); })
        .attr("fill", "#343a40");
    // EXIT.
    bars.exit()
        .transition()
        .duration(500)
        .style("opacity", 0)
        .attr("y", function (d) {return y(0);})
        .attr("height", 0)
        .remove();

    // area label
    var countries = svg.selectAll(".area_label")
        .data(dataset, function (d) { return d['_id']; });
    // UPDATE
    countries.transition()
        .duration(750)
        .delay(delay)
        .attr("x", function (d, i) { return x(d['_id']) + x.bandwidth() / 2; })
    // ENTER.
    countries.enter().append("text")
        .attr("x", function (d) { return x(d['_id']) + x.bandwidth() / 2; })
        .attr("y", function (d) {return y(0);})
        .style("opacity", 0)
        .transition()
        .duration(750)
        .delay(delay)
        .style("opacity", 1)
        .text(function (d) { return d['_id']; })
        .attr("class", "area_label")
        .attr("y", function (d) { return y(d['count']) - 5; })
        .attr("class", "area_label")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px");

    // EXIT.    
    countries.exit()
        .transition()
        .duration(500)
        .style("opacity", 0)
        .attr("y", function (d) {return y(0);})
        .remove();

    // Value label
    var values = svg.selectAll(".value_label")
        .data(dataset, function (d) { return d['count']; });
    // UPDATE
    values.transition()
        .duration(750)
        .delay(delay)
        .attr("x", function (d, i) { return x(d['_id']) + x.bandwidth() / 2; })
    // ENTER.
    values.enter().append("text")
        .attr("x", function (d) { return x(d['_id']) + x.bandwidth() / 2; })
        .attr("y", function (d) { return y(0);})
        .style("opacity", 0)
        .transition()
        .duration(750)
        .delay(delay)
        .style("opacity", 1)
        .text(function (d) { return d['count']; })
        .attr("class", "value_label")
        .attr("y", function (d) { return y(d['count']) + 15; })
        .attr("class", "value_label")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "white");

    // EXIT.    
    values.exit()
        .transition()
        .duration(500)
        .style("opacity", 0)
        .attr("y", function (d) {return y(0);})
        .remove();
}
// sort strings
function sortString(a, b) {
    if (a['_id'] < b['_id']) {
        return -1;
    } else if (a['_id'] > b['_id']) {
        return 1;
    }
    return 0;
}

// sort functions
d3.select("#alpha")
    .on("click", function () {
        d3.selectAll(".dropdown-item").classed("active", false);
        dataset = d3.selectAll(".bar").data();
        x.domain(dataset.sort(
            function (a, b) {
                return sortString(a, b);
            }
        ).map(function (d) { return d['_id']; }));  //only need to change x scale
        all = all.sort(function (a, b) { return sortString(a, b); });
        top5 = top5.sort(function (a, b) { return sortString(a, b); });
        bottom5 = bottom5.sort(function (a, b) { return sortString(a, b); });
        transitionBars();
        d3.select(this).classed("active", true);
    });

d3.select("#asce")
    .on("click", function () {
        d3.selectAll(".dropdown-item").classed("active", false);
        dataset = d3.selectAll(".bar").data();
        x.domain(dataset.sort(
            function (a, b) { return a['count'] - b['count']; }
        ).map(function (d) { return d['_id']; }));
        all = all.sort(function (a, b) { return a['count'] - b['count']; });
        top5 = top5.sort(function (a, b) { return a['count'] - b['count']; });
        bottom5 = bottom5.sort(function (a, b) { return a['count'] - b['count']; });
        transitionBars();
        d3.select(this).classed("active", true);
    });

d3.select("#desc")
    .on("click", function () {
        d3.selectAll(".dropdown-item").classed("active", false);
        dataset = d3.selectAll(".bar").data();
        x.domain(dataset.sort(
            function (a, b) { return b['count'] - a['count']; }
        ).map(function (d) { return d['_id']; }));
        all = all.sort(function (a, b) { return b['_id'] - a['_id']; });
        top5 = top5.sort(function (a, b) { return b['_id'] - a['_id']; });
        bottom5 = bottom5.sort(function (a, b) { return b['_id'] - a['_id']; });
        transitionBars();
        d3.select(this).classed("active", true);
    });


function transitionBars() {
    //transition bars for cases where only the scale changes (no add/remove)
    var transition = svg.transition()
        .duration(750);

    var delay = function (d, i) {
        return i * 50;
    };
    transition.selectAll(".bar")
        .delay(delay)
        .attr("x", function (d) {
            return x(d['_id']);
        });

    transition.selectAll(".area_label")
        .delay(delay)
        .attr("x", function (d) {
            return x(d['_id']) + x.bandwidth() / 2;
        });

    transition.selectAll(".value_label")
        .delay(delay)
        .attr("x", function (d) {
            return x(d['_id']) + x.bandwidth() / 2;
        });
}

function drawBar() {
    var dataset = all;
    x.domain(dataset.map(function (d) { return d['_id']; })) //map keys
        .round(true)
        .range([0, width])
        .paddingInner(0.05);  //padding in range [0, 1]

    y.domain([0, d3.max(dataset, function (d) { return d['count']; })])
        .range([height, 0]);

    svg.selectAll(".bar")
        .data(dataset, function (d) { return d['_id']; })
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) { return x(d['_id']); })
        .attr("y", function (d) { return y(d['count']); })
        .attr("width", x.bandwidth())
        .attr("height", function (d) { return height - y(d['count']); })
        .attr("fill", "#343a40");

    svg.selectAll(".area_label")
        .data(dataset, function (d) { return d['_id']; })
        .enter().append("text")
        .text(function (d) { return d['_id']; })
        .attr("class", "area_label")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("x", function (d) { return x(d['_id']) + x.bandwidth() / 2; })
        .attr("y", function (d) { return y(d['count']) - 5; });

    svg.selectAll(".value_label")
        .data(dataset, function (d) { return d['count']; })
        .enter().append("text")
        .text(function (d) { return d['count']; })
        .attr("class", "value_label")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("x", function (d) { return x(d['_id']) + x.bandwidth() / 2; })
        .attr("y", function (d) { return y(d['count']) + 15; })
        .attr("fill", "white");

    var xAxis;
    xAxis = d3.axisBottom()
        .scale(x)
        .ticks(0)
        .tickSize(0)
        .tickFormat('');

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("text")
        .attr("class", "label")
        .text("Area")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom * .5);

    var yAxis = d3.axisLeft()
        .scale(y)
        .ticks(5, '.0f');

    svg.append("g")
        .attr("class", "axis")
        .call(yAxis);

    svg.append("text")
        .attr("x", - width / 4)
        .attr("y", - margin.left * 0.5)
        .attr("transform", "rotate(-90)")
        .attr('class', 'label')
        .attr("text-anchor", "start")
        .text("# of cases")
}