$(function() {
    
    var MAP_PARAMETERS = {
        'DEU': {
            'scale': 2500,
            'center': [10.5, 51.3]
        },
        'FRA': {
            'scale': 2100,
            'center': [2, 46.5]
        },
        'AUT': {
            'scale': 4000,
            'center': [13.3, 47.6]
        },
        'CHE': {
            'scale': 6500,
            'center': [8.3, 46.8]
        },
        'GBR': {
            'scale': 1800,
            'center': [-3, 55.0]
        },
        'NLD': {
            'scale': 5500,
            'center': [5, 52.0]
        },
        'GRC': {
            'scale': 3000,
            'center': [24, 38.0]
        },
        'ITA': {
            'scale': 2100,
            'center': [13, 42.0]
        },
        'ESP': {
            'scale': 2200,
            'center': [-2.5, 40.0]
        },
        'SWE': {
            'scale': 1050,
            'center': [16, 63.0]
        },
        'USA': {
            'scale': 550,
            'center': [-96, 35.0]
        },
        'CAN': {
            'scale': 350,
            'center': [-96, 60.0]
        },
        'NOR': {
            'scale': 950,
            'center': [16, 65.5]
        },
        'CZE': {
            'scale': 4500,
            'center': [15.5, 50]
        },
        'HUN': {
            'scale': 4500,
            'center': [19.5, 47]
        },
        'QAT': {
            'scale': 17000,
            'center': [51.2, 25.35]
        },
        'EUROPE': {
            'scale': 700,
            'center': [10.5, 50]
        },
        'NORTH_AMERICA': {
            'scale': 600,
            'center': [-80, 30]
        },
        'WESTERN_ASIA': {
            'scale': 850,
            'center': [42, 29]
        },
        'WORLD': {
            'scale': 105,
            'center': [25, -30]
        }
    };
    
	var sites = JSON.parse($('#sites-data').html()),
		selectedEntity = null;
        hierarchieStack = [];
        currentMap = 'WORLD';

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
    
    d3.json("/static/img/" + currentMap + ".topo.json", showMap);

    function showMap(error, de) {
    	var subunits = topojson.feature(de, de.objects.subunits);
        
        var scale = MAP_PARAMETERS[currentMap]['scale'];
        var center = MAP_PARAMETERS[currentMap]['center'];

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
                if (hasSubunits(code)) {
                    hierarchieStack.push(currentMap);
                    currentMap = code;
                    selectedEntity = null;
                    $('#backbutton').remove();
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
            if (hierarchieStack.length > 0) {
                $backbutton = $('<button id="backbutton">back</button>');
                $backbutton.on("click", function() {
                    $(this).remove();
                    currentMap = hierarchieStack.pop();
                    selectedEntity = null;
                    renderListing(null);
                    d3.select("#map>svg").remove();
                    svg = d3.select("#map").append("svg")
                        .attr("width", width)
                        .attr("height", height);
                    d3.json("/static/img/" + currentMap + ".topo.json", showMap);
                });
                $('#map').append($backbutton);
            }
    }
    
    // Determine if a geographical entity (continent, country or state) has sites
    function hasSites(entityCode) {
        var entitySites = $.grep(sites.sites, function(site) {return site.continent == entityCode || site.country == entityCode || site.state == entityCode; });
        return entitySites.length > 0;
    }
    
    
    //Determine if a geographical entity (continent or country) consists of subunits
    function hasSubunits(countryCode) {
        var countriesInContinent = $.grep(sites.sites, function(site) {return site.continent == countryCode && site.country && site.country.length > 0; });
        if (countriesInContinent.length > 0) {
            return true;
        }
        var statesInCountry = $.grep(sites.sites, function(site) {return site.country == countryCode && site.state && site.state.length > 0; });
        if (statesInCountry.length > 0) {
            return true;
        }
        return false;
    }

    function renderListing(entity) {
    	if (entity === null) {
    		$listing.hide();
    		$welcome.show();
    		return;
    	}
    	$welcome.hide();
		var entitySites = $.grep(sites.sites, function(site) { return site.continent == entity.code || site.country == entity.code || site.state == entity.code; });
		$listing.html(listingTemplate({
			'sites': entitySites,
            'length': entitySites.length,
			'only_one': entitySites.length == 1,
			'no_sites': entitySites.length == 0,
			'country': entity,
            'list_sites': !hasSubunits(entity.code) //Only list the sites if the country does not have a lower-level map
		}));
		$listing.fadeIn(100);
    }
});
