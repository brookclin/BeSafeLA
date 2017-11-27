function dashboard(id, fData){
    var barColor = '#f2b076';
    function segColor(c){ return {"Unknown": "#98abc5","A":"#8a89a6","B":"#7b6888","H":"#6b486b","O":"#a05d56","W":"#d0743c","X":"#ff8c00"}[c]; }
    
    // compute total for each state.

    fData.forEach(function(d){d.total=d.freq.Unknown+d.freq.A+d.freq.B+d.freq.H+d.freq.O+d.freq.W+d.freq.X;});
    
    // function to handle histogram.
    function histoGram(fD){
        var hG={},    
        hGDim = {t: 40, r: 0, b: 50, l: 60};
        hGDim.w = 400 - hGDim.l - hGDim.r, 
        hGDim.h = 300 - hGDim.t - hGDim.b;
            
        //create svg for histogram.
        var hGsvg = d3.select(id).append("svg")
            .attr("width", hGDim.w + hGDim.l + hGDim.r)
            .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
            .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");

        // create function for x-axis mapping.
        var x = d3.scaleBand().rangeRound([0, hGDim.w]).padding(0.1)
                .domain(fD.map(function(d) { return d[0]; }));

        // Add x-axis to the histogram svg.
        hGsvg.append("g").attr("class", "x axis")
            .attr("transform", "translate(0," + hGDim.h + ")")
            .call(d3.axisBottom(x));

        // Create function for y-axis map.
        var y = d3.scaleLinear().range([hGDim.h, 0])
                .domain([0, d3.max(fD, function(d) { return d[1]; })]);
        var btext = hGsvg.append('text')
                        .attr('x', hGDim.t+145)
                        .attr('y', hGDim.h+30)
                        .style('font-size','12px')
                btext.append('tspan').text('Year');
                
        // Add y-axis to the histogram svg.
        hGsvg.append("g").attr("class", "y axis")
            .attr('transform','translate('+ (hGDim.h-205) +',0)')
            .call(d3.axisLeft(y));
        var ltext = hGsvg.append('text')
                              .attr('x', hGDim.t-100)
                              .attr('y', hGDim.h-260)
                              .style('font-size','12px')
                              .attr('transform','rotate(-90,'+hGDim.t +',' +hGDim.t+')');
                ltext.append('tspan').text('The number of cases');
                
        // Create bars for histogram to contain rectangles and freq labels.
        var bars = hGsvg.selectAll(".bar").data(fD).enter()
                .append("g").attr("class", "bar");
        
        //create the rectangles.
        bars.append("rect")
            .attr("x", function(d) { return x(d[0]); })
            .attr("y", function(d) { return y(d[1]); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return hGDim.h - y(d[1]); })
            .attr('fill',barColor)
            .on("mouseover",mouseover)// mouseover is defined below.
            .on("mouseout",mouseout);// mouseout is defined below.
            
        //Create the frequency labels above the rectangles.
        bars.append("text").text(function(d){ return d3.format(",")(d[1])})
            .attr("x", function(d) { return x(d[0])+x.bandwidth()/2; })
            .attr("y", function(d) { return y(d[1])-5; })
            .style('fill','black')
            .style('font-size','11px')
            .attr("text-anchor", "middle");
        
        function mouseover(d){  // utility function to be called on mouseover.
            // filter for selected state.
            var st = fData.filter(function(s){ return s.State == d[0];})[0],
                nD = d3.keys(st.freq).map(function(s){ return {type:s, freq:st.freq[s]};});
               
            // call update functions of pie-chart and legend.    
            pC.update(nD);
            leg.update(nD);
        }
        
        function mouseout(d){    // utility function to be called on mouseout.
            // reset the pie-chart and legend.    
            pC.update(tF);
            leg.update(tF);
        }
        
        // create function to update the bars. This will be used by pie-chart.
        hG.update = function(nD, color){
            // update the domain of the y-axis map to reflect change in frequencies.
            y.domain([0, d3.max(nD, function(d) { return d[1]; })]);
            
            // Attach the new data to the bars.
            var bars = hGsvg.selectAll(".bar").data(nD);
            
            // transition the height and color of rectangles.
            bars.select("rect").transition().duration(500)
                .attr("y", function(d) {return y(d[1]); })
                .attr("height", function(d) { return hGDim.h - y(d[1]); })
                .attr("fill", color);

            // transition the frequency labels location and change value.
            bars.select("text").transition().duration(500)
                .text(function(d){ return d3.format(",")(d[1])})
                .attr("y", function(d) {return y(d[1])-5; });            
        }        
        return hG;
    }
    
    // function to handle pieChart.
    function pieChart(pD){
        var pC ={},    pieDim ={w:220, h: 300};
        pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;
                
        // create svg for pie chart.
        var piesvg = d3.select(id).append("svg")
            .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
            .attr("transform", "translate("+pieDim.w/2+","+pieDim.h/2+")");
        
        // create function to draw the arcs of the pie slices.
        var arc = d3.arc().outerRadius(pieDim.r - 10).innerRadius(0);

        // create a function to compute the pie slice angles.
        var pie = d3.pie().sort(null).value(function(d) { return d.freq; });

        // Draw the pie slices.
        piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
            .each(function(d) { this._current = d; })
            .style("fill", function(d) { return segColor(d.data.type); })
            .on("mouseover",mouseover).on("mouseout",mouseout);

        // create function to update pie-chart. This will be used by histogram.
        pC.update = function(nD){
            piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
                .attrTween("d", arcTween);
        }        
        // Utility function to be called on mouseover a pie slice.
        function mouseover(d){
            // call the update function of histogram with new data.
            hG.update(fData.map(function(v){ 
                return [v.State,v.freq[d.data.type]];}),segColor(d.data.type));
        }
        //Utility function to be called on mouseout a pie slice.
        function mouseout(d){
            // call the update function of histogram with all data.
            hG.update(fData.map(function(v){
                return [v.State,v.total];}), barColor);
        }
        // Animating the pie-slice requiring a custom function which specifies
        // how the intermediate paths should be drawn.
        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) { return arc(i(t));    };
        }    
        return pC;
    }
    
    // function to handle legend.
    function legend(lD){
        var leg = {};
            
        // create table for legend.
        var legend = d3.select(id).append("table").attr('class','legend');
        
        // create one row per segment.
        var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");
            
        // create the first column for each segment.
        tr.append("td").append("svg").attr("width", '8').attr("height", '8').append("rect")
            .attr("width", '8').attr("height", '8')
			.attr("fill",function(d){ return segColor(d.type); });
            
        // create the second column for each segment.
        tr.append("td").text(function(d){ return d.type;}).style('font-size','11px');

        // create the third column for each segment.
        tr.append("td").attr("class",'legendFreq')
            .text(function(d){ return d3.format(",")(d.freq);}).style('font-size','11px');

        // create the fourth column for each segment.
        tr.append("td").attr("class",'legendPerc')
            .text(function(d){ return getLegend(d,lD);}).style('font-size','11px');

        // Utility function to be used to update the legend.
        leg.update = function(nD){
            // update the data attached to the row elements.
            var l = legend.select("tbody").selectAll("tr").data(nD);

            // update the frequencies.
            l.select(".legendFreq").text(function(d){ return d3.format(",")(d.freq);}).style('font-size','11px');

            // update the percentage column.
            l.select(".legendPerc").text(function(d){ return getLegend(d,nD);}).style('font-size','11px');        
        }
        
        function getLegend(d,aD){ // Utility function to compute percentage.
            return d3.format("%")(d.freq/d3.sum(aD.map(function(v){ return v.freq; })));
        }

        return leg;
    }
    
    // calculate total frequency by segment for all state.
    var tF = ["Unknown","A","B","H","O","W","X"].map(function(d){ 
        return {type:d, freq: d3.sum(fData.map(function(t){ return t.freq[d];}))}; 
    });    
    
    // calculate total frequency by state for all segment.
    var sF = fData.map(function(d){return [d.State,d.total];});

    var hG = histoGram(sF), // create the histogram.
        pC = pieChart(tF), // create the pie-chart.
        leg= legend(tF);  // create the legend.
}
var freqData=[
 {State:'2010',freq:{Unknown: 19954, A: 4409, B: 33903, H: 73254, O: 18911, W: 53913,  X: 2617}}
,{State:'2011',freq:{Unknown: 17895, A: 4390, B: 32565, H: 70552, O: 18960, W: 51296, X: 3206}}
,{State:'2012',freq:{Unknown: 17535, A: 4443, B: 33496, H: 69957, O: 18969, W: 51842,  X: 3161}}
,{State:'2013',freq:{Unknown: 16603, A: 4444, B: 31933, H: 66348, O: 18927, W: 48371,  X: 3766}}
,{State:'2014',freq:{Unknown: 16367, A: 4675, B: 32802, H: 68193, O: 19069,  W: 47481, X: 4463}}
,{State:'2015',freq:{Unknown: 19173, A: 5351, B: 33752, H: 73758, O: 20987, W: 52580,  X: 6767}}
,{State:'2016',freq:{Unknown: 22191, A: 5585, B: 33858, H: 76401, O: 21660,  W: 52102,  X: 9882}}
,{State:'2017',freq:{Unknown: 17288, A: 4342, B: 25508, H: 57387, O: 17185,  W: 38437,  X: 8712}}
];

dashboard('#v-pills-descent',freqData);