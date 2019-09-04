var OSDE = OSDE ? OSDE : {};

OSDE.TreeMap = function(elementID) {
	var self = this,
		$treemap = $(elementID);

	var treemap = null,
      	div = null;

	function create() {
		var width = $treemap.width(),
		    height = $treemap.height();

		$treemap.empty();

		treemap = d3.layout.treemap()
            .size([width, height])
            .sticky(true)
            .sort(function(a, b) { return a.value - b.value; })
            .value(function(d) {
                if (d.value == null) {
                    return 1;
                } 
                return d.value; 
            });

		div = d3.select("#treemap").append("div")
		  .style("position", "relative")
		  .style("width", width + "px")
		  .style("height", height + "px");
	}
	self.render = function render(data, dimension) {
		// TODO: remove elements, don't create each time. 
		create();

		var root = {
		  children: []
		};
		for (var i = 0; i < data.cells.length; i += 1) {
		  root.children.push({
		    name: data.cells[i]._current_label,
		    value: data.cells[i]._value,
		    value_fmt: data.cells[i]._value_fmt,
		    percentage: data.cells[i]._percentage,
		    href: data.cells[i]._url,
		    color: data.cells[i]._color
		  });
		}
		var node = div.datum(root).selectAll(".node")
		    .data(treemap.nodes)
		  .enter().append("a")
		    .attr("href", function(d) { return d.href; })
		    .attr("class", "node")
		    .call(positionNode)
		    .style("background", '#fff')
		    .classed("big", function(d) { return d.dx > 250 && d.dy > 65})
        .classed("medium", function(d) { return d.dx <= 250 && d.dx > 100 && d.dy > 65})
        .classed("small", function(d) { return d.dx <= 100 || d.dy <= 65})
		    .html(function(d) {
            return d.children ? null : '<span class="amount">' + d.value_fmt + '</span>' + d.name;
		    })
		    .on("mouseover", function(d) {
          if (d3.select(this).classed("small")) {
            var new_width = Math.max(d.dx, 170);
            var new_height = Math.max(d.dy, 70);
            var new_left = Math.min(d.x, $treemap.width() - new_width);
            var new_top = Math.min(d.y, $treemap.height() - new_height);
            d3.select(this)
              .classed("small-zoomed", true)
              .transition().duration(200)
              .style({'width': new_width + "px",
                      'height': new_height + "px",
                      'left': new_left + "px",
                      'top': new_top + "px"
              });
          }
          else {
            d3.select(this)
              .transition().duration(200)
              .style({'background': d3.rgb(d.color).darker()});
          }
		    })
		    .on("mouseout", function(d) {
          if (d3.select(this).classed("small-zoomed")) {
            d3.select(this)
              .classed("small-zoomed", false)
              .transition().duration(200)
              .style({'width': d.dx + "px",
                      'height': d.dy + "px",
                      'left': d.x + "px",
                      'top': d.y + "px"
              });
          }
          else {
            d3.select(this)
              .transition().duration(200)
              .style({'background': d.color});
          }
		    })
		    .transition()
		    .duration(500)
		    .delay(function(d, i) { return Math.min(i * 30, 1500); })
		    .style("background", function(d) { return d.color; });
	}

	function positionNode() {
	    this.style("left", function(d) { return d.x + "px"; })
	        .style("top", function(d) { return d.y + "px"; })
	        .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
	        .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
  }
  
};
