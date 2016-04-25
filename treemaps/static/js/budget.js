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
      $parent = $('#parent'),
      $filterValues = $('.site-filters .value'),
      treemap = new OSDE.TreeMap('#treemap'),
      table =  new OSDE.Table('#table');
      
      
  function escapeCutString(cutString) {
      cutString = cutString.replace(/,/g, '\\,');
      cutString = cutString.replace(/-/g, '\\-');
      return cutString;
  }

  function getData(drilldown, cut, sortkey) {
    //console.log(drilldown, cut);
    //console.log(site)
    console.log(cut)
    var cutStr = $.map(cut, function(v, k) { if((v+'').length) { return site.keyrefs[k] + ':' + escapeCutString(v); }});
    console.log(cutStr);
    var drilldowns = [site.keyrefs[drilldown]]
    if (!sortkey) {
      sortkey = OSDE.default_sort;
    }
    if (site.keyrefs[drilldown] != site.labelrefs[drilldown]) {
      drilldowns.push(site.labelrefs[drilldown]);
    }
    return $.ajax({
      url: site.api + '/aggregate',
      crossDomain: true,
      data: {
        drilldown: drilldowns.join('|'),
        cut: cutStr.join('|'),
        order: sortkey + ':desc',
        page: 0,
        pagesize: 500
      },
      dataType: 'json',
      cache: true
    });
  }

  $('#infobox-toggle').click(function(e) {
    console.log("Hallo");
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

  function update() {
    var rawPath = window.location.hash.substring(1);
    if (!rawPath.length) {
      rawPath = site.default + '/'
    }
    var path = parsePath(rawPath),
        rootDimension = path.hierarchy.drilldowns[0],
        rootColor = null;
        color = d3.scale.ordinal().range(OSDE.categoryColors),
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
      $('.site-filters strong[data-field="' + f.field + '"]').html(label || 'Alle');
    });

    var baseCuts = $.extend({}, baseFilters, path.hierarchy.cuts);
    var sortKey = $('[data-sort-key].active').data('sort-key');

    getData(rootDimension, baseCuts, sortKey).done(function(base) {

      $.each(base.cells, function(i, drilldown) {
        drilldown._color = color(i);
        var rootRef = site.keyrefs[rootDimension];
        if (cuts[rootDimension] && cuts[rootDimension] == drilldown[rootRef]) {
          rootColor = d3.rgb(drilldown._color);
        }
      });

      getData(path.drilldown, cuts, sortKey).done(function(data) {
        var dimension = path.drilldown;

        if (dimension != rootDimension) {
          color = d3.scale.linear();
          color = color.interpolate(d3.interpolateRgb)
          color = color.range([rootColor.brighter(), rootColor.darker().darker()]);
          color = color.domain([data.total_cell_count, 0]);
        }

        data.summary._value = data.summary[site.aggregate];
        data.summary._value_fmt = OSDE.amount(data.summary._value);
        data.summary._num_items = data.summary['apc_num_items'];

        $.each(data.cells, function(e, cell) {
          cell._current_label = cell[site.labelrefs[dimension]];
          cell._current_key = cell[site.keyrefs[dimension]];
          cell._value = cell[site.aggregate];
          cell._value_fmt = OSDE.amount(cell._value);
          cell._percentage = cell[site.aggregate] / data.summary[site.aggregate];
          cell._small = cell._percentage < 0.01;
          cell._percentage_fmt = (cell._percentage * 100).toFixed(2) + '%';
          cell._percentage_fmt = cell._percentage_fmt.replace('.', ',');
          cell._avg_fmt = OSDE.amount(cell['apc_amount_avg']);
          cell._num_items = cell['apc_num_items'];

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
          cell._color = color(e);
          
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
    });
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
