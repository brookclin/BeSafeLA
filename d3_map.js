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
    .attr("viewBox", "0 0 500 600");
// .attr("width", width)
// .attr("height", height);
var color;
// multiple async tasks
var queue = d3.queue();
queue.defer(d3.json, "lapd-divisions.geojson")
queue.defer(d3.json, "data processing/dataByAreaV2.json")
queue.defer(d3.json, "data processing/dataOverall.json")
queue.defer(d3.json, "data processing/timeOccurredTotal.json")
queue.defer(d3.json, "data processing/timeOccurredTotalByYear.json")
queue.defer(d3.json, "data processing/timeOccurredByArea.json")
queue.await(ready);
var select_years = ['All', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010'];

// current selection on year and area, all times and all areas by default
var selected_year = 'All';
var selected_area;
var overall_data;
var area_data;
var time_year_data;
var time_area_data;
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

dispatch.on("load.reset", function () {
    var button = d3.select("body")
        .select("div#select-year")
        .append("button")
        .attr("class", "btn btn-secondary")
        .attr("type", "button")
        .attr("disabled", "disabled")
        .on("click", function () {
            dispatch.call("areachange", this, null);
        });
    button.text("All Divisions");

    dispatch.on("areachange.reset", function (d) {
        if (!d) {
            button.attr("disabled", "disabled");
            button.text("All Divisions");
        } else {
            button.attr("disabled", null);
            button.text("Reset Division");
        }
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
    var w = 500, h = 200;
    var margin = { top: 10, right: 20, bottom: 30, left: 50 },
        width = w - margin.left - margin.right,
        height = h - margin.top - margin.bottom;
    var svg = d3.select('body')
        .select('div#map-right')
        .select("div#map-line")
        .append('svg')
        .attr("width", w)
        .attr("height", h);
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "xaxis");

    var yg = g.append("g")
        .attr("class", "yaxis");
    yg.append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("#Cases");
    g.append("path")
        .attr("class", "path")
        .attr("fill", "none")
        .attr("stroke", "#18b0df")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5);

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
        var area;

        if (!data) {
            current_dataset = overall_data;
            if (selected_year == 'All') {
                drawLine(current_dataset['CountByMonth']);
            } else {
                var month_filtered = Object.keys(current_dataset['CountByMonth'])
                    .filter(function (key) { return key.includes(selected_year); });
                var time_subset = {}
                for (var i = 0; i < month_filtered.length; i++) {
                    time_subset[month_filtered[i]] = current_dataset['CountByMonth'][month_filtered[i]];
                }
                drawLine(time_subset);
            }
        } else {
            area = data.properties.name;
            current_dataset = area_data[area][0];
            if (selected_year == 'All') {
                drawLine(current_dataset['CountByMonth']);
            } else {
                var month_filtered = Object.keys(current_dataset['CountByMonth'])
                    .filter(function (key) { return key.includes(selected_year); });
                var time_subset = {}
                for (var i = 0; i < month_filtered.length; i++) {
                    time_subset[month_filtered[i]] = current_dataset['CountByMonth'][month_filtered[i]];
                }
                drawLine(time_subset);
            }
        }
    });
    function drawLine(data) {
        // customized multi time formats
        var formatMillisecond = d3.timeFormat(".%L"),
            formatSecond = d3.timeFormat(":%S"),
            formatMinute = d3.timeFormat("%I:%M"),
            formatHour = d3.timeFormat("%I %p"),
            formatDay = d3.timeFormat("%a %d"),
            formatWeek = d3.timeFormat("%b %d"),
            formatMonth = d3.timeFormat("%b"),
            formatYear = d3.timeFormat("%Y");

        function multiFormat(date) {
            return (d3.timeSecond(date) < date ? formatMillisecond
                : d3.timeMinute(date) < date ? formatSecond
                    : d3.timeHour(date) < date ? formatMinute
                        : d3.timeDay(date) < date ? formatHour
                            : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
                                : d3.timeYear(date) < date ? formatMonth
                                    : formatYear)(date);
        }

        if ("10/2017" in data) {
            delete data["10/2017"];
        }

        var parseTime = d3.timeParse("%m/%Y");
        var data = d3.entries(data); // [{key:.., value:..}]
        data.forEach(function (entry) {
            entry['key'] = parseTime(entry['key']);
        });
        data.sort(function (x, y) { // sort by date
            return d3.ascending(x.key, y.key);
        });

        var x = d3.scaleTime()
            .domain(d3.extent(data, function (d) { return d['key']; }))
            .rangeRound([0, width]);
        var y = d3.scaleLinear()
            .domain(d3.extent(data, function (d) { return d['value']; }))
            .rangeRound([height, 0]);
        var line = d3.line()
            .x(function (d) { return x(d['key']); })
            .y(function (d) { return y(d['value']); });
        g.select("g.xaxis")
            .transition()
            .duration(400)
            .call(d3.axisBottom(x).tickFormat(multiFormat));
        g.select("g.yaxis")
            .transition()
            .duration(400)
            .call(d3.axisLeft(y));


        g.select("path.path")
            .datum(data)
            .transition()
            .duration(400)
            .attr("d", line);

    }
});

dispatch.on("load.24bar", function () {
    var margin = { top: 10, right: 20, bottom: 30, left: 50 };
    var width = 500 - margin.left - margin.right;
    var height = 200 - margin.top - margin.bottom;
    // var dataset = [66206, 45961, 38693, 28366, 21289, 19349, 27188, 40561, 68318, 60339, 67940, 63966, 128902, 69347, 76857, 83679, 82337, 88845, 95739, 90813, 92676, 87066, 84240, 74220];
    // for (var i = 0; i < dataset.length; i++) {
    //     dataset[i] = {time: i, count: dataset[i]};
    // }
    var svg = d3.select("div#map-24bar").append("svg")
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    var x = d3.scaleBand();  //x scale
    var y = d3.scaleLinear();  //y scale
    // x.domain(dataset.map(function (d) { return d['time']; })) //map keys
    x.round(true)
        .range([0, width])
        .paddingInner(0.05);  //padding in range [0, 1]

    // y.domain([0, d3.max(dataset, function (d) { return d['count']; })])
    y.range([height, 0]);

    var xAxis;
    xAxis = d3.axisBottom()
        .scale(x);

    xg = svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")");


    var yAxis = d3.axisLeft()
        .scale(y)
        .ticks(5);

    var yg = svg.append("g")
        .attr("class", "axis")
    yg.append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("#Cases");



    dispatch.on("statechange.24bar", function (d) {
        var dataset;
        if (selected_area) {
            dataset = time_area_data[selected_area][d];
        } else {
            dataset = time_year_data[d];
        }
        update24bar(dataset);
    });
    dispatch.on("areachange.24bar", function (d) {
        var dataset;
        if (!d) {
            dataset = time_year_data[selected_year];
        } else {
            var area = d.properties.name;
            dataset = time_area_data[area][selected_year];
        }
        update24bar(dataset);
    });
    function update24bar(dataset) {
        x.domain(dataset.map(function (d) { return d['time']; })) //map keys
        y.domain([0, d3.max(dataset, function (d) { return d['count']; })])


        var bars = svg.selectAll(".bar")
            .data(dataset, function (d) { return d['time']; });

        bars.exit().remove();
        bars.transition().duration(400)
            .attr("x", function (d) { return x(d['time']); })
            .attr("y", function (d) { return y(d['count']); })
            .attr("height", function (d) { return height - y(d['count']); })

        bars.enter().append("rect")
            .attr("class", "bar")
            .style("fill", "#1a9bc2")
            .attr("x", function (d) { return x(d['time']); })
            .attr("y", y(0))
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .transition().duration(400)
            .attr("y", function (d) { return y(d['count']); })
            .attr("height", function (d) { return height - y(d['count']); })
            .attr("fill", "#343a40");
        xg.transition().duration(400).call(xAxis);
        yg.transition().duration(400).call(yAxis);
    }
});

// A pie chart to show population by age group; uses the "pie" namespace.
dispatch.on("load.pie", function () {
    var width = 240,
        height = 240,
        radius = Math.min(width, height) / 2;
    //age
    var groups = [
        "Under 5 Years",
        "5 to 13 Years",
        "14 to 17 Years",
        "18 to 24 Years",
        "25 to 44 Years",
        "45 to 64 Years",
        "65 Years and Over"
    ];

    var color = d3.scaleOrdinal()
        .domain(groups)
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    var arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(radius - 40);

    var pie = d3.pie()
        .sort(null)
        .value(function (d) { return d.count; });

    var svg = d3.select("body")
        .select("div#map-right")
        .select("div#donuts")
        .append("svg")
        .attr("class", "map-age")
        .attr("width", width)
        .attr("height", height)
    var g = svg.append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var path = g.selectAll("path")
        .data(groups)
        .enter().append("path")
        .style("fill", color)
        .each(function () { this._current = { startAngle: 0, endAngle: 0 }; });

    g.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "1em")
        .attr("y", 5)
    path.on("mouseout", function (d) {
        tooltip.style("display", "none");
    });
    // sex 
    var color2 = d3.scaleOrdinal()
        .domain(["M", "F"])
        .range(["#98abc5", "#6b486b"]);

    var arc2 = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(radius - 40);

    var pie2 = d3.pie()
        .sort(null)
        .value(function (d) { return d.count; });

    var svg2 = d3.select("body")
        .select("div#map-right")
        .select("div#donuts")
        .append("svg")
        .attr("class", "map-sex")
        .attr("width", width)
        .attr("height", height)
    var g2 = svg2.append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var path2 = g2.selectAll("path")
        .data(["M", "F"])
        .enter().append("path")
        .style("fill", color2)
        .each(function () { this._current = { startAngle: 0, endAngle: 0 }; });

    g2.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "1em")
        .attr("y", 5)
    path2.on("mouseout", function (d) {
        tooltip.style("display", "none");
    });
    dispatch.on("statechange.pie", function (d) {
        if (d == "All" && selected_area == null) {
            // age
            svg.transition().duration(400).style("opacity", 0);
            path.on("mousemove", function (d) {
                tooltip.style("display", "none");
            });
            // sex
            svg2.transition().duration(400).style("opacity", 0);
            path2.on("mousemove", function (d) {
                tooltip.style("display", "none");
            });
            return; // todo: reset pie
        }
        svg.transition().duration(400).style("opacity", 1);
        svg2.transition().duration(400).style("opacity", 1);
        var dataset;
        if (d != "All" && selected_area == null) {
            dataset = overall_data['byYear'][d];
        } else if (d != "All" && selected_area) {
            dataset = area_data[selected_area][0]['byYear'][d];
        } else {
            dataset = area_data[selected_area][0]['overall'];
        }
        updatepie(dataset)
    });

    dispatch.on("areachange.pie", function (data) {
        if (!data) {
            if (selected_year == "All") {
                svg.transition().duration(400).style("opacity", 0);
                svg2.transition().duration(400).style("opacity", 0);
                path.on("mousemove", function (d) {
                    tooltip.style("display", "none");
                });
                path2.on("mousemove", function (d) {
                    tooltip.style("display", "none");
                });
            } else {
                var dataset = overall_data['byYear'][selected_year];
                updatepie(dataset);
            }
        } else {
            var area = data.properties.name;
            var dataset;
            svg.transition().duration(400).style("opacity", 1);
            svg2.transition().duration(400).style("opacity", 1);
            if (selected_year == 'All') {
                dataset = area_data[area][0]['overall'];
            } else {
                dataset = area_data[area][0]['byYear'][selected_year];
            }
            updatepie(dataset);
        }
    })
    function updatepie(dataset) {
        var age_dataset = dataset['victimAge'];
        var sex_dataset = dataset['victimSex'];
        g.select("text").text("Victim's Age");
        g2.select("text").text("Victim's Sex");
        var age_object = [];
        for (var i = 1; i < age_dataset.length; i++) {
            // ignore entries with no age
            age_object.push({
                group: groups[i - 1],
                count: age_dataset[i]
            });
        }
        var sex_object = [
            { group: "Male", count: sex_dataset["M"] },
            { group: "Female", count: sex_dataset["F"] }
        ];
        //age
        path.data(pie.value(function (a) { return a.count; })(age_object)).transition()
            .attrTween("d", function (d) {
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function (t) {
                    return arc(interpolate(t));
                };
            });
        path.on("mousemove", function (d) {
            tooltip.style("left", d3.event.pageX + 10 + "px");
            tooltip.style("top", d3.event.pageY - 25 + "px");
            tooltip.style("display", "inline-block");
            tooltip.html("<b>" + (d.data.group) + "</b><br>#Cases: " + (d.data.count));
        });
        //sex
        path2.data(pie2.value(function (a) { return a.count; })(sex_object)).transition()
            .attrTween("d", function (d) {
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function (t) {
                    return arc(interpolate(t));
                };
            });
        path2.on("mousemove", function (d) {
            tooltip.style("left", d3.event.pageX + 10 + "px");
            tooltip.style("top", d3.event.pageY - 25 + "px");
            tooltip.style("display", "inline-block");
            tooltip.html("<b>" + (d.data.group) + "</b><br>#Cases: " + (d.data.count));
        });
    }
});
dispatch.on("load.bar", function () {
    var descents = {
        "A": "Other Asian",
        "C": "Chinese",
        "B": "Black",
        "D": "Cambodian",
        "G": "Guamanian",
        "F": "Filipino",
        "I": "American Indian/Alaskan Native",
        "H": "Hispanic/Latin/Mexican",
        "K": "Korean",
        "J": "Japanese",
        "L": "Laotian",
        "O": "Other",
        "P": "Pacific Islander",
        "S": "Samoan",
        "U": "Hawaiian",
        "W": "White",
        "V": "Vietnamese",
        "X": "Unknown",
        "Z": "Asian Indian"
    };

    var margin = {
        top: 30,
        right: 25,
        bottom: 15,
        left: 0
    };

    var width = 245 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    var svg = d3.select("#bars").append("svg")
        .attr("class", "crimetype")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "1em")
        .attr("x", width / 2);
    // .text("Top 7 Crime Types");

    var svg2 = d3.select("#bars").append("svg")
        .attr("class", "descent")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + 20 + "," + margin.top + ")");

    svg2.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "1em")
        .attr("x", width / 2)

    var x = d3.scaleLinear()
        .range([0, width]);

    var y = d3.scaleBand()
        .rangeRound([height, 0])
        .padding(0.1);

    var yAxis = d3.axisLeft(y)
        //no tick marks
        .ticks(0);

    // descent
    var x2 = d3.scaleLinear()
        .range([0, width]);

    var y2 = d3.scaleBand()
        .rangeRound([height, 0])
        .padding(0.1);

    var yAxis2 = d3.axisLeft(y2);
    //no tick marks
    // .ticks(0);

    var gy = svg.append("g")
        .attr("class", "yaxis");
    var gy2 = svg2.append("g")
        .attr("class", "yaxis");


    dispatch.on("statechange.bar", function (d) {
        var bars = svg.selectAll(".bar");
        var bars2 = svg2.selectAll(".bar2");
        if (d == "All" && selected_area == null) {
            svg.transition().duration(400).style("opacity", 0);
            svg2.transition().duration(400).style("opacity", 0);
            bars.on("mousemove", function (d) {
                tooltip.style("display", "none");
            });
            bars2.on("mousemove", function (d) {
                tooltip.style("display", "none");
            });
            return; // todo: reset pie
        }
        svg.transition().duration(400).style("opacity", 1);
        svg2.transition().duration(400).style("opacity", 1);
        var dataset;
        if (d != "All" && selected_area == null) {
            // crimecode_dataset = overall_data['byYear'][d]['crimeCodeCount'];
            dataset = overall_data['byYear'][d];
        } else if (d != "All" && selected_area) {
            // crimecode_dataset = area_data[selected_area][0]['byYear'][d]['crimeCodeCount'];
            dataset = area_data[selected_area][0]['byYear'][d];
        } else {
            // crimecode_dataset = area_data[selected_area][0]['overall']['crimeCodeCount'];
            dataset = area_data[selected_area][0]['overall'];
        }
        updatebar(dataset);
    });
    dispatch.on("areachange.bar", function (d) {
        if (!d) {
            if (selected_year == "All") {
                var bars = svg.selectAll(".bar");
                var bars2 = svg2.selectAll(".bar2");
                svg.transition().duration(400).style("opacity", 0);
                svg2.transition().duration(400).style("opacity", 0);

                bars.on("mousemove", function (d) {
                    tooltip.style("display", "none");
                });
                bars2.on("mousemove", function (d) {
                    tooltip.style("display", "none");
                });

            } else {
                var dataset = overall_data['byYear'][selected_year];
                updatebar(dataset);
            }
        } else {
            svg.transition().duration(400).style("opacity", 1);
            svg2.transition().duration(400).style("opacity", 1);
            var area = d.properties.name;
            var dataset;
            if (selected_year == 'All') {
                dataset = area_data[area][0]['overall'];
            } else {
                dataset = area_data[area][0]['byYear'][selected_year];
            }
            updatebar(dataset);
        }
    });
    function updatebar(dataset) {
        svg.select("text").text("Top 7 Crime Types");
        svg2.select("text").text("Top 7 Victim's Descent")
        // crime code
        var data = Object.values(dataset['crimeCodeCount']);
        data.sort(function (a, b) { return b.count - a.count; });
        data = data.slice(0, 7);
        data.reverse();

        // descent
        descent_keys = Object.keys(dataset['victimDescent']);
        descent_data = [];
        for (var i = 0; i < descent_keys.length; i++) {
            if (descent_keys[i] == "") continue;
            descent_data.push({
                type: descents[descent_keys[i]],
                initial: descent_keys[i],
                count: dataset['victimDescent'][descent_keys[i]]
            });
        }
        descent_data.sort(function (a, b) { return b.count - a.count; });
        descent_data = descent_data.slice(0, 7);
        descent_data.reverse();

        // crime code
        gy.call(yAxis)
        x.domain([0, d3.max(data, function (d) {
            return d.count;
        })]);
        y.domain(data.map(function (d) {
            return d.description;
        }));

        bars = svg.selectAll(".bar")
            .data(data);

        bars.exit().remove();
        bars.transition().duration(400).attr("y", function (d) {
            return y(d.description);
        })
            .attr("height", y.bandwidth())
            .attr("x", 0)
            .style("opacity", function (d) { return (d.count / d3.max(data, function (p) { return p.count; })); })
            .attr("width", function (d) {
                return x(d.count);
            });

        var texts = svg.selectAll(".label")
            .data(data);
        texts.exit().remove();
        texts.text(function (d) {
            return d.description.split(" ")[0];;
        });

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", function (d) {
                return y(d.description);
            })
            .transition().duration(400)
            .attr("height", y.bandwidth())
            .attr("x", 0)
            .style("opacity", function (d) { return (d.count / d3.max(data, function (p) { return p.count; })); })
            .attr("width", function (d) {
                return x(d.count);
            });
        texts.enter()
            .append("text")
            .attr("class", "label")
            .attr("y", function (d) {
                return y(d.description) + y.bandwidth() / 2 + 5;
            })
            .style("font-size", "0.7em")
            .style("fill", "#FFFFFF")
            //x position is 3 pixels to the right of the bar
            .attr("x", 3)
            .text(function (d) {
                return d.description.split(" ")[0];
            });

        var bars = svg.selectAll(".bar"); // include bars and texts
        bars.on("mousemove", function (d) {
            tooltip.style("left", d3.event.pageX + 10 + "px");
            tooltip.style("top", d3.event.pageY - 25 + "px");
            tooltip.style("display", "inline-block");
            tooltip.html("<b>" + (d.description) + "</b><br>#Cases: " + (d.count));
        });
        bars.on("mouseout", function (d) {
            tooltip.style("display", "none");
        });

        // descent
        x2.domain([0, d3.max(descent_data, function (d) {
            return d.count;
        })]);
        y2.domain(descent_data.map(function (d) {
            return d.initial;
        }));
        bars2 = svg2.selectAll(".bar2")
            .data(descent_data);

        bars2.exit().remove();
        bars2.transition().duration(400).attr("y", function (d) {
            return y2(d.initial);
        })
            .attr("height", y2.bandwidth())
            .attr("x", 0)
            .attr("width", function (d) {
                return x2(d.count);
            });

        // var texts2 = svg2.selectAll(".label")
        //     .data(descent_data);
        // texts2.exit().remove();
        // texts2.text(function (d) {
        //     return d.initial;
        // });

        bars2.enter()
            .append("rect")
            .attr("class", "bar2")
            .attr("y", function (d) {
                return y2(d.initial);
            })
            .transition().duration(400)
            .attr("height", y2.bandwidth())
            .attr("x", 0)
            .attr("width", function (d) {
                return x2(d.count);
            });
        // texts2.enter()
        //     .append("text")
        //     .attr("class", "label")
        //     .attr("y", function (d) {
        //         return y2(d.initial) + y2.bandwidth() / 2 + 5;
        //     })
        //     .style("font-size", "0.7em")
        //     .style("fill", "#FFFFFF")
        //     //x position is 3 pixels to the right of the bar
        //     .attr("x", 3)
        //     .text(function (d) {
        //         return d.initial;
        //     });

        gy2.call(yAxis2);

        var bars2 = svg2.selectAll(".bar2"); // include bars and texts
        bars2.on("mousemove", function (d) {
            tooltip.style("left", d3.event.pageX + 10 + "px");
            tooltip.style("top", d3.event.pageY - 25 + "px");
            tooltip.style("display", "inline-block");
            tooltip.html("<b>" + (d.type) + "</b><br>#Cases: " + (d.count));
        });
        bars2.on("mouseout", function (d) {
            tooltip.style("display", "none");
        });
    }
});

dispatch.on("statechange.title", function (y) {
    d3.select("body")
        .select("div#area")
        .select("span#current-area")
        .text((selected_area == null ? "All Divisions" : selected_area)
        + " - " + (y == "All" ? "All Times" : y));
});
dispatch.on("areachange.title", function (data) {
    d3.selectAll("path")
        .classed("selected", false);
    if (data) {
        selected_area = data.properties.name;
    } else {
        selected_area = null;
    }
    // title on selected area
    d3.select("body")
        .select("div#area")
        .select("span#current-area")
        .text((selected_area ? selected_area : "All Divisions") + " - " + (selected_year == "All" ? "All Times" : selected_year));
});



function ready(error, geojson, areadata, overall, timeTotal, timeYear, timeArea) {

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
    time24Prep(timeTotal, timeYear, timeArea);
    // right part
    // line chart
    // initLine();

    dispatch.call("load", this);
    dispatch.call('statechange', this, selected_year);
}

function time24Prep(timeTotal, timeYear, timeArea) {
    time_year_data = {};
    time_area_data = {};
    for (var i = 0; i < timeTotal.length; i++) {
        timeTotal[i] = { time: i, count: timeTotal[i] };
    }
    time_year_data['All'] = timeTotal;
    var year_labels = ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017'];
    for (var i = 0; i < timeYear.length; i++) {
        for (var j = 0; j < timeYear[i].length; j++) {
            timeYear[i][j] = { time: j, count: timeYear[i][j] };
        }
        time_year_data[year_labels[i]] = timeYear[i];
    }

    //area
    for (var i = 0; i < timeArea.length; i++) {
        var area_name = timeArea[i]['Area Name'];
        var byYear = timeArea[i]['byYear'];
        var total = timeArea[i]['total'];
        var key_value = {};
        for (var j = 0; j < total.length; j++) {
            total[j] = { time: j, count: total[j] };
        }
        key_value['All'] = total;
        for (var j = 0; j < byYear.length; j++) {
            for (var k = 0; k < byYear[j].length; k++) {
                byYear[j][k] = { time: k, count: byYear[j][k] };
            }
            key_value[year_labels[j]] = byYear[j];
        }
        time_area_data[area_name] = key_value;
    }
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