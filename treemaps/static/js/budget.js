$(function(){
  var site = JSON.parse($('#site-config').html()),
      embedTemplate = Handlebars.compile($('#embed-template').html());
      embedTemplateReduced = Handlebars.compile($('#embed-template-reduced').html());
      $embedCode = $('#embed-code')
      $embedCodeReduced = $('#embed-code-reduced')
      baseFilters = {};
  $.each(site.filters, function(i, f) {
    baseFilters[f.field] = f.default;
  });

  var $hierarchyMenu = $('#hierarchy-menu'),
      $infobox = $('#infobox'),
      $plotbox = $('#plotbox'),
      $parent = $('#parent'),
      $filterValues = $('.site-filters .value'),
      treemap = new OSDE.TreeMap('#treemap'),
      table =  new OSDE.Table('#table');
      
      
  function escapeCutString(cutString) {
      cutString = cutString.replace(/,/g, '\\,');
      cutString = cutString.replace(/-/g, '\\-');
      return cutString;
  }
  
  function buildCutString(cutObject) {
    var cutStr = $.map(cutObject, function(v, k) { if((v+'').length) { return site.keyrefs[k] + ':' + escapeCutString(v); }});
    return cutStr.join('|');
  }

  function getData(drilldown, cut, sortkey) {
    var cutStr = buildCutString(cut);
    var drilldowns = [site.keyrefs[drilldown]]
    if (!sortkey) {
      sortkey = site["aggregate"];
    }
    if (site.keyrefs[drilldown] != site.labelrefs[drilldown]) {
      drilldowns.push(site.labelrefs[drilldown]);
    }
    return $.ajax({
      url: site.api + '/aggregate',
      crossDomain: true,
      data: {
        drilldown: drilldowns.join('|'),
        cut: cutStr,
        order: sortkey + ':desc'
      },
      dataType: 'json',
      cache: true
    });
  }

  $('#infobox-toggle').click(function(e) {
    var $e = $(e.target);
    if ($e.hasClass('active')) {
      $e.removeClass('active');
      $infobox.slideUp();
    } else {
      $e.addClass('active');
      $infobox.slideDown();
    }
    return false;
  });
  
  $('#plotbox-toggle').click(function(e) {
    var $e = $(e.target);
    if ($e.hasClass('active')) {
      $e.removeClass('active');
      $plotbox.slideUp();
    } else {
      $e.addClass('active');
      $plotbox.slideDown();
      generatePieChart();
    }
    return false;
  });

  function parsePath(hash) {
    var path = {},
        location = hash.split('/'),
        levels = location.slice(1, location.length-1);

    path.hierarchyName = location[0];
    path.hierarchy = site.hierarchies[path.hierarchyName];
    path.hierarchy.cuts = path.hierarchy.cuts || {};
    path.level = levels.length;
    path.root = path.level == 0;
    path.bottom = path.level >= (path.hierarchy.drilldowns.length - 1);
    path.drilldown = path.hierarchy.drilldowns[path.level];
    path.args = OSDE.parseArgs(location[location.length-1]);

    $.each(levels, function(i, val) {
      path.args[path.hierarchy.drilldowns[i]] = decodeURIComponent(val);
    });
    return path;
  }
  
  function getPathObject() {
    var rawPath = window.location.hash.substring(1);
    if (!rawPath.length) {
      rawPath = site.default + '/'
    }
    return parsePath(rawPath);
  }

  function parentUrl(path) {
    if (path.level < 1) {
      return makeUrl(path, null);
    }
    var p = $.extend(true, {}, path);
    $.each(p.hierarchy.drilldowns, function(i, drilldown) {
      if (i >= (p.level-1) ) {
        delete p.args[drilldown];
      }
    });
    return makeUrl(p, {});
  }

  function makeUrl(path, modifiers) {
    var args = $.extend({}, path.args, modifiers),
        url = '#' + path.hierarchyName + '/';

    if (!modifiers) args = {};

    $.each(path.hierarchy.drilldowns, function(i, drilldown) {
      if (args[drilldown]) {
        url += args[drilldown] + '/';
        delete args[drilldown];
      }
    });
    return url + OSDE.mergeArgs(args);
  }
  
  function generatePieChart() {
    var $plot = $("#pie-plot");
    $plot.empty();
    var width = $plot.width(),
        height = $plot.height(),
        radius = (Math.min(width, height) / 2) - 100,
        path = getPathObject();

    var cuts = $.extend({}, baseFilters, path.hierarchy.cuts || {}, path.args),
      cutStr = buildCutString(cuts),
      csv_url = site.api + '/facts?format=csv&header=names&cut=' + encodeURIComponent(cutStr);

    var arc = d3.svg.arc()
        .outerRadius(radius)
        .innerRadius(radius - 40);

    var pie = d3.layout.pie();

    d3.csv(csv_url, function(d) {
      d.euro = +d.euro;
      return d;
    }, function(error, data) {
      if (error) throw error;
      
      var reduced_data = {},
        sum = 0;
      for (var i in data) {
        var key = data[i][path.drilldown];
        if (!(key in reduced_data)) {
          reduced_data[key] = data[i].euro;
        }
        else {
          reduced_data[key] += data[i].euro;
        }
        sum += data[i].euro;
      }
      
      var values = [],
          labels = [];
          show_label = [];
      for (var key in reduced_data) {
        labels.push(key);
        values.push(reduced_data[key]);
        if (reduced_data[key] < (sum / 20)) {
          show_label.push(false);
        }
        else {
          show_label.push(true);
        }
      }
      
      var svg = d3.select("#pie-plot")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
      
      var slices = svg.selectAll("path")
        .data(pie(values))
        .enter();
        
      slices.append("path")
        .style("fill", function(d, i) { return OSDE.labelToColor(labels[i]); })
        .attr("d", arc);
        
      slices.append("text")
        .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .text(function(d, i) { 
          if (show_label[i]) {
            return labels[i];
          }
          return "";
        });
    });
  }
  

  function update() {
    var path = getPathObject();
    var rootDimension = path.hierarchy.drilldowns[0],
        cuts = $.extend({}, baseFilters, path.hierarchy.cuts || {}, path.args);
    $hierarchyMenu.find('.btn').removeClass('active');
    $hierarchyMenu.find('.btn.' + path.hierarchyName).addClass('active');

    $parent.unbind();
    if (path.root) {
      $parent.hide();
    } else {
      $parent.show();
      $parent.attr('href', parentUrl(path));
    }

    $filterValues.removeClass('active');
    $filterValues.each(function(i, f) {
      var $f = $(f), field = $f.data('field'), value = $f.data('value'), modifiers = {};
      modifiers[field] = value;
      $f.attr('href', makeUrl(path, modifiers));
      if (cuts[field] == value) {
        $f.addClass('active');
      }
    });

    $.each(site.filters, function(i, f) {
      var val = cuts[f.field], label = val;
      $.each(f.values, function(j, v) {
        if (v.key == val) {
          label = v.label;
        }
      });
      $('.site-filters strong[data-field="' + f.field + '"]').html(label || 'All');
    });

    var baseCuts = $.extend({}, baseFilters, path.hierarchy.cuts);
    var sortKey = $('[data-sort-key].active').data('sort-key');
    
    getData(path.drilldown, cuts, sortKey).done(function(data) {

      var dimension = path.drilldown;

      data.all_aggregates = site.all_aggregates;
      data.summary._value = data.summary[site.aggregate];
      data.summary._value_fmt = OSDE.format_value(data.summary._value, site.aggregate_function);
      data.other_aggregate_summaries = {};
      $.each(site.all_aggregates, function(f, aggregate) {
        if (aggregate.name != site.aggregate) {
          data.other_aggregate_summaries[aggregate.name] = OSDE.format_value(data.summary[aggregate.name], aggregate.function);
        }
      });
      data.summary._num_items = data.summary['apc_num_items'];
      if (data.total_cell_count > 500) {
        data._reduction_hint = true;
      }
      //Construct the breadcrumb
      var title = "";
      $.each(path.hierarchy.drilldowns, function(i, drilldown) {
        if (drilldown in path.args) {
          title += path.args[drilldown];
          title += " // ";
        }
      });
      if (path.drilldown in OSDE.drilldownLabels) {
        title += OSDE.drilldownLabels[path.drilldown];
      }
      else {
        title += "Title";
      }
      data._title = title;
      
      var cutStr = buildCutString(cuts);
      data._facts_url_csv = site.api + '/facts?format=csv&header=names&cut=' + encodeURIComponent(cutStr);
      data._facts_url_json = site.api + '/facts?format=json_lines&cut=' + encodeURIComponent(cutStr);
      
      $.each(data.cells, function(e, cell) {
        cell._current_label = cell[site.labelrefs[dimension]];
        cell._current_key = cell[site.keyrefs[dimension]];
        cell._value = cell[site.aggregate];
        cell._value_fmt = OSDE.format_value(cell._value, site.aggregate_function);
        cell._percentage = cell[site.aggregate] / data.summary[site.aggregate];
        cell._small = cell._percentage < 0.01;
        cell._percentage_fmt = (cell._percentage * 100).toFixed(2) + '%';
        cell._percentage_fmt = cell._percentage_fmt.replace('.', ',');
        cell.other_aggregate_values = {};
        $.each(site.all_aggregates, function(f, aggregate) {
          if (aggregate.name != site.aggregate) {
            cell.other_aggregate_values[aggregate.name] = OSDE.format_value(cell[aggregate.name], aggregate.function);
          }
        });
        if (!path.bottom) {
          var modifiers = {};
          modifiers[dimension] = cell._current_key;
          cell._url = makeUrl(path, modifiers);
        } else if (cell.doi) {
          cell._doi = "http://dx.doi.org/" + cell.doi;
        }
        else {
          cell._no_url = true;
        }
        cell._color = OSDE.labelToColor(cell._current_key);
        if (cell.doi) {
          cell._doi = "http://dx.doi.org/" + cell.doi;
        }
      });

      treemap.render(data, path.drilldown);
      //store current sort key and set it again after rendering
      if (!$('[data-sort-key].active').length) {
        $('[data-sort-key="' + OSDE.default_sort + '"]').addClass('active');
        var sort_key = OSDE.default_sort;
      }
      else {
        var sort_key = $('[data-sort-key].active').data('sort-key');
      }
      table.render(data, path.drilldown);
      
      $('[data-sort-key]').removeClass('active');
      $('[data-sort-key="' + sort_key + '"]').addClass('active');
      
      $('[data-sort-key]').each(function() {
        $(this).click(function(e) {
          $('[data-sort-key]').removeClass('active');
          var $e = $(e.target);
          $e.addClass('active');
          update();
        });
      });
    });
    /*});*/
    $embedCode.text(embedTemplate({
      name: site.name,
      baseurl: document.location.href.split('#')[0],
      url: document.location.href,
      hash: document.location.hash,
    }));
    $embedCodeReduced.text(embedTemplateReduced({
      name: site.name,
      baseurl: document.location.href.split('#')[0],
      url: document.location.href,
      hash: document.location.hash,
    }));
  }
  hashtrack.onhashchange(update);
});
