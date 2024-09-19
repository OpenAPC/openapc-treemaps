from flask import abort, render_template, redirect

from treemaps.core import app, pages
from treemaps.util import JSONEncoder
from treemaps.sites import load_sites

sites = load_sites()


@app.route('/apcdata/<slug>/')
def site(slug):
    site = sites.get(slug)
    default_hierarchy = site.data['default']
    return redirect('/apcdata/' + slug + '/' + default_hierarchy)

@app.route('/apcdata/<slug>/<hierarchy_name>')
def site_hierarchy(slug, hierarchy_name, template='site.html'):
    site = sites.get(slug)
    if hierarchy_name not in site.hierarchies:
        abort(404)
    for name, hierarchy in site.hierarchies.items():
        if name == hierarchy_name:
            site.active_hierarchy = hierarchy
            break
    site_json = JSONEncoder().encode(site)
    return render_template(template, site=site, site_json=site_json)

@app.route('/apcdata/<slug>/embed/full/')
def redirect_embed_full(slug):
    site = sites.get(slug)
    default_hierarchy = site.data['default']
    return redirect('/apcdata/' + slug + '/embed/full/' + default_hierarchy)

@app.route('/apcdata/<slug>/embed/reduced/')
def redirect_embed_reduced(slug):
    site = sites.get(slug)
    default_hierarchy = site.data['default']
    return redirect('/apcdata/' + slug + '/embed/reduced/' + default_hierarchy)

@app.route('/apcdata/<slug>/embed/full/<hierarchy_name>')
def embed_full(slug, hierarchy_name):
    return site_hierarchy(slug, hierarchy_name, template='embed.html')

@app.route('/apcdata/<slug>/embed/reduced/<hierarchy_name>')
def embed_reduced(slug, hierarchy_name):
    return site_hierarchy(slug, hierarchy_name, template='embed_reduced.html')

@app.route('/page/<path:path>.html')
def page(path):
    page = pages.get_or_404(path)
    template = page.meta.get('template', 'page.html')
    return render_template(template, page=page,
                           framed=page.meta.get('framed', True))

@app.route('/')
def index():
    sites_json = JSONEncoder().encode(sites)
    state_sites = [s for s in sites if s.level == 'land']
    local_sites = [s for s in sites if s.level not in ['land', 'bund']]
    return render_template('index.html', sites=sites, sites_json=sites_json,
                           state_sites=state_sites, local_sites=local_sites)
