$(function(){
  var site = JSON.parse($('#site-config').html()),
      embedTemplate = Handlebars.compile($('#embed-template').html());
      embedTemplateReduced = Handlebars.compile($('#embed-template-reduced').html());
      $embedCode = $('#embed-code')
      $embedCodeReduced = $('#embed-code-reduced')
      baseFilters = {};
      activeHierarchy = site.active_hierarchy;
      activeHierarchyName = site.active_hierarchy.internal_name;

  $.each(activeHierarchy.filters, function(i, f) {
    baseFilters[f.field] = f.default;
  });

  var $hierarchyMenu = $('#hierarchy-menu'),
      $infobox = $('#infobox'),
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
    var cutStr = $.map(cutObject, function(v, k) { if((v+'').length) { return activeHierarchy.keyrefs[k] + ':' + escapeCutString(v); }});
    return cutStr.join('|');
  }

  function getData(drilldown, cut, sortkey) {
    var cutStr = buildCutString(cut);
    var drilldowns = [activeHierarchy.keyrefs[drilldown]]
    if (!sortkey) {
      sortkey = activeHierarchy["aggregate"];
    }
    if (activeHierarchy.keyrefs[drilldown] != activeHierarchy.labelrefs[drilldown]) {
      drilldowns.push(activeHierarchy.labelrefs[drilldown]);
    }
    return $.ajax({
      url: activeHierarchy.api + '/aggregate',
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

  function parsePath(hash) {
    var path = {},
        location = hash.split('/'),
        levels = location.slice(1, location.length-1);
    path.hierarchyName = activeHierarchyName;
    path.hierarchy = activeHierarchy;
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
        //url = '#' + path.hierarchyName + '/';
        url = '#/';
    if (!modifiers) args = {};

    $.each(path.hierarchy.drilldowns, function(i, drilldown) {
      if (args[drilldown]) {
        url += encodeURIComponent(args[drilldown]) + '/';
        delete args[drilldown];
      }
    });
    return url + OSDE.mergeArgs(args);
  }

  function update() {
    var rawPath = window.location.hash.substring(1);
    if (!rawPath.length) {
      rawPath = activeHierarchyName + '/'
    }
    var path = parsePath(rawPath),
        rootDimension = path.hierarchy.drilldowns[0],
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

    $.each(activeHierarchy.filters, function(i, f) {
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
      if (dimension != rootDimension) {
        var rootColor = d3.rgb(OSDE.labelToColor(cuts[rootDimension])),
          color_scale = d3.scale.linear();
        color_scale = color_scale.interpolate(d3.interpolateRgb)
        color_scale = color_scale.range([rootColor.brighter(), rootColor.darker().darker()]);
        color_scale = color_scale.domain([data.total_cell_count, 0]);
      }
      data.table_items = [];
      $.each(activeHierarchy.table_items, function(f, item) {
        if (item.not_shown_in && item.not_shown_in.includes(path.hierarchyName)) {
          return;
        }
        data.table_items.push(item);
      });
      $.each(data.table_items, function(f, item) {
        if (item.type == "aggregate") {
          // Sorting takes place in the OLAP backend, so we can only use aggregates here
          item.sort_key = true;
          item._summary = data.summary[item.name];
          item._summary_fmt =  OSDE.format_value(item._summary, item.format);
          var agg = activeHierarchy.all_aggregates.find(function(aggregate) {
            return aggregate.ref == item.name;
          });
          if (!Object.hasOwn(item, "label")) {
            item.label = agg.label;
          }
        }
        else if (item.type == "cross_item_percentage") {
          item._summary = data.summary[item.fraction_item] / data.summary[item.total_item];
          item._summary_fmt = OSDE.format_value(item._summary, item.format);
        }
        else if (item.type == "total_percentage") {
          item._summary_fmt = "100%";
        }
      });
      
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
      data._facts_url_csv = activeHierarchy.api + '/facts?format=csv&header=names&cut=' + encodeURIComponent(cutStr);
      data._facts_url_json = activeHierarchy.api + '/facts?format=json_lines&cut=' + encodeURIComponent(cutStr);
      $.each(data.cells, function(e, cell) {
        cell._current_label = cell[activeHierarchy.labelrefs[dimension]];
        cell._current_key = cell[activeHierarchy.keyrefs[dimension]];
        cell._values = [];
        $.each(data.table_items, function(g, item) {
            var treemap_key = activeHierarchy.primary_aggregate;
            if (typeof sortKey !== "undefined") {
                treemap_key = sortKey;
            }
            if (item.name == treemap_key) {
                // treemap relevant fields
                cell._value = cell[item.name]
                cell._value_fmt = OSDE.format_value(cell._value, item.format);
                cell._percentage = cell._value / item._summary;
            }
            if (item.type == "aggregate") {
                var formatted_value = OSDE.format_value(cell[item.name], item.format);
                cell._values.push(formatted_value);
            }
            else if (item.type == "total_percentage") {
                var related = data.table_items.find(function(table_item) {
                    return table_item.name == item.relates_to;
                });
                var value = cell[related.name] / related._summary;
                var formatted_value = OSDE.format_value(value, item.format);
                cell._values.push(formatted_value);
                cell._small = value < 0.01;
            }
            else if (item.type == "cross_item_percentage") {
                var value = cell[item.fraction_item] / cell[item.total_item];
                if (cell[item.total_item] == 0) {
                    cell._values.push("NA");
                }
                else {
                    cell._values.push(OSDE.format_value(value, item.format));
                }
            }
        });
        
        if (!path.bottom) {
          var modifiers = {};
          modifiers[dimension] = cell._current_key;
          cell._url = makeUrl(path, modifiers);
        } else if (cell.publication_key) {
          if (cell.publication_key.startsWith("10.")) {
            cell._url = "https://doi.org/" + cell.publication_key;
          }
          else {
            cell._url = "https://" + cell.publication_key;
          }
        } else if (cell.doi) {
          cell._doi = "https://doi.org/" + cell.doi;
        }
        else {
          cell._no_url = true;
        }
        if (dimension == "cost_type") {
            cell._color = OSDE.costTypeColors[cell._current_key];
        }
        else if (dimension != rootDimension) {
          cell._color = color_scale(e);
        }
        else {
          cell._color = OSDE.labelToColor(cell._current_key);
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
    var siteurl = document.location.href.split('#')[0];
    siteurl = siteurl.substring(0, siteurl.lastIndexOf(activeHierarchy.internal_name));
    $embedCode.text(embedTemplate({
      name: activeHierarchy.name,
      baseurl: siteurl,
      hierarchy: activeHierarchy.internal_name,
      url: document.location.href,
      hash: document.location.hash,
    }));
    $embedCodeReduced.text(embedTemplateReduced({
      name: activeHierarchy.name,
      baseurl: siteurl,
      hierarchy: activeHierarchy.internal_name,
      url: document.location.href,
      hash: document.location.hash,
    }));
  }
  hashtrack.onhashchange(update);
});
