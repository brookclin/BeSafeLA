var w = 1120,
    h = 600,
    x = d3.scaleLinear().range([0, w]),
    y = d3.scaleLinear().range([0, h]);

var vis = d3.select("#v-pills-type").append("div")
    .attr("class", "chart")
    .style("width", w + "px")
    .style("height", h + "px")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h);

// var root1 = d3.hierarchy(data, getChildren)
//     .sum(function(d) { return 1})
//     .sort(null);
var partition = d3.partition()
    .size([h, w])
    .padding(1)
    .round(true);

// .value(function(d) { return d.size; });

d3.json("yearandcode.json", function (data) {
    
    var root = d3.hierarchy(data);
    partition(d3.hierarchy(data));
    console.log(root);

    var g = vis.selectAll("g")
        .data(root.descendants())
        .enter().append("svg:g")
        .attr("transform", function (d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; })
        .on("click", click);

    var kx = w / root.dx,
        ky = h / 1;

    g.append("svg:rect")
        .attr("width", root.dy * kx)
        .attr("height", function (d) { return d.dx * ky; })
        .attr("class", function (d) { return d.children ? "parent" : "child"; });

    g.append("svg:text")
        .attr("transform", transform)
        .attr("dy", ".35em")
        .style("opacity", function (d) { return d.dx * ky > 12 ? 1 : 0; })
        .style("font-size", "16px")
        .text(function (d) { return d.name; })

    d3.select(window)
        .on("click", function () { click(root); })

    function click(d) {
        if (!d.children) return;

        kx = (d.y ? w - 40 : w) / (1 - d.y);
        ky = h / d.dx;
        x.domain([d.y, 1]).range([d.y ? 40 : 0, w]);
        y.domain([d.x, d.x + d.dx]);

        var t = g.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .attr("transform", function (d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; });

        t.select("rect")
            .attr("width", d.dy * kx)
            .attr("height", function (d) { return d.dx * ky; });

        t.select("text")
            .attr("transform", transform)
            .style("opacity", function (d) { return d.dx * ky > 12 ? 1 : 0; });

        d3.event.stopPropagation();
    }

    function transform(d) {
        return "translate(8," + d.dx * ky / 2 + ")";
    }
});