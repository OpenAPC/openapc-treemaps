$(function() {
    
    var COUNTRY_MAPS = {
        'DEU': {
            'scale': 2500,
            'center': [10.5, 51.3]
        },
        'AUT': {
            'scale': 4000,
            'center': [13.3, 47.6]
        },
        'GBR': {
            'scale': 1800,
            'center': [-3, 55.0]
        }
    };
    
	var sites = JSON.parse($('#sites-data').html()),
		selectedEntity = null;
        currentMap = null;

	var $map = $('#map'),
		$welcome = $('#default-welcome'),
		$listing = $('#listing'),
		listingTemplate = Handlebars.compile($('#listing-template').html());

	var	width = $map.width(),
		height = $map.height();

	var path = d3.geo.path();

	var svg = d3.select("#map").append("svg")
    	.attr("width", width)
    	.attr("height", height);
    
    d3.json("/static/img/EUROPE.topo.json", showMap);

    function showMap(error, de) {
    	var subunits = topojson.feature(de, de.objects.subunits);
        
        var scale = 700;
        var center = [10.5, 50];
        if (currentMap) {
            scale = COUNTRY_MAPS[currentMap]['scale'];
            center = COUNTRY_MAPS[currentMap]['center'];
        }

	    var projection = d3.geo.mercator()
	        .center(center)
	        .scale(scale)
	        .translate([width / 2, height / 2]);


	    var path = d3.geo.path()
	        .projection(projection);

	    svg.selectAll(".subunit")
	        .data(subunits.features)
	      .enter().append("path")
	        .attr("class", function(d) { return "subunit " + d.properties.code; })
	        .attr("d", path)
	        .on("mouseover", function(d) {
	        	if (d.properties.code != selectedEntity) {
	        		d3.select(this).transition().duration(200)
    					.style({'fill':'#42928F'});	
	        	}
	        	if (selectedEntity===null) {
	        		renderListing(d.properties);
	        	}
	        })
	        .on("mouseout", function(d) {
	        	if (d.properties.code != selectedEntity) {
                    if (hasSites(d.properties.code)) {
                        d3.select(this).transition().duration(200).style({'fill':'#555'});
                    }
                    else {
                        d3.select(this).transition().duration(200).style({'fill':'#BBB'});
                    }
	        	}
	        	if (selectedEntity===null) {
	        		renderListing(null);
	        	}
	        })
	        .on("click", function(d) {
                var code = d.properties.code;
                if (hasStates(code)) {
                    currentMap = code;
                    selectedEntity = null;
                    d3.select("#map>svg").remove();
                    svg = d3.select("#map").append("svg")
                        .attr("width", width)
                        .attr("height", height);
                    d3.json("/static/img/" + code + ".topo.json", showMap);
                }
                else {
                    if (code == selectedEntity) {
                        selectedEntity = null;
                        d3.selectAll('.subunit').each(function(d) {
                            if (hasSites(d.properties.code)) {
                                d3.select(this).style({'fill':'#555'});
                            }
                            else {
                                d3.select(this).style({'fill':'#BBB'});
                            }
                        });
                        renderListing(null);
                    } 
                    else {
                        selectedEntity = d.properties.code;
                        d3.selectAll('.subunit').each(function(d) {
                            if (hasSites(d.properties.code)) {
                                d3.select(this).style({'fill':'#555'});
                            }
                            else {
                                d3.select(this).style({'fill':'#BBB'});
                            }
                        });
                        d3.select(this).style({'fill':'#42928F'});
                        renderListing(d.properties);
                    }
                }

	        })
            .each(function(d) {
                if (hasSites(d.properties.code)) {
                    d3.select(this).transition().duration(400).style({'fill':'#555'});
                }
                else {
                    d3.select(this).transition().duration(400).style({'fill':'#BBB'});
                }
            });
            if (currentMap) {
                $backbutton = $('<button id="backbutton">back</button>');
                $backbutton.on("click", function() {
                    currentMap = null;
                    selectedEntity = null;
                    d3.select("#map>svg").remove();
                    svg = d3.select("#map").append("svg")
                        .attr("width", width)
                        .attr("height", height);
                    d3.json("/static/img/EUROPE.topo.json", showMap);
                    $(this).remove();
                });
                $('#map').append($backbutton);
            }
    }
    
    // Determine if a political entity (country or state) has sites
    function hasSites(entityCode) {
        var entitySites = $.grep(sites.sites, function(site) {return site.country == entityCode || site.state == entityCode; });
        return entitySites.length > 0;
    }
    
    
    //Determine if a political entity (usually a country) consists of states
    function hasStates(countryCode) {
        var sitesWithStates = $.grep(sites.sites, function(site) {return site.country == countryCode && site.state && site.state.length > 0; });
        return sitesWithStates.length > 0;
    }

    function renderListing(entity) {
    	if (entity === null) {
    		$listing.hide();
    		$welcome.show();
    		return;
    	}
    	$welcome.hide();
		var entitySites = $.grep(sites.sites, function(site) { return site.country == entity.code || site.state == entity.code; });
		$listing.html(listingTemplate({
			'sites': entitySites,
            'length': entitySites.length,
			'only_one': entitySites.length == 1,
			'no_sites': entitySites.length == 0,
			'country': entity,
            'list_sites': !hasStates(entity.code) //Only list the sites if the country does not have a lower-level map
		}));
		$listing.fadeIn(100);
    }
});
