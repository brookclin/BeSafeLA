
var margin = { top: 50, left: 75, bottom: 50, right: 50 };
var width = 1000 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

var svg2 = d3.select("#piechart").append("svg")
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr("viewBox", "0 0 1000 500"),

    radius = Math.min(width, height) / 2,
    g = svg2.append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2   + ")")
    ;

var color = d3.scaleOrdinal(d3.schemeCategory20c);

var pie = d3.pie()
    .sort(null)
    .value(function(d) { return d.count; });

var path = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(0);

var label = d3.arc()
    .outerRadius(radius - 40)
    .innerRadius(radius - 40);

d3.json("data processing/crimedatacode.json", 
//   function(d) {
//     d.count = +d.count;
//     console.log(d);
//     return d;
// },
 function(error, data) {
    if (error) throw error;
    // console.log(data);
    var arc = g.selectAll(".arc")
        .data(pie(data))
        .enter().append("g")
        .attr("class", "arc");

    arc.append("path")
        .attr("d", path)
        .attr("fill", function(d,i){return color(i);})
        ;

    arc.append("text")
        .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
        .attr("dy", "0.35em")
        .text(function(d,i) { return d["_id"]; });
});