from flask import abort, render_template

from treemaps.core import app, pages
from treemaps.util import JSONEncoder
from treemaps.sites import load_sites

sites = load_sites()


@app.route('/apcdata/<slug>/')
def site(slug, template='site.html'):
    site = sites.get(slug)
    site_json = JSONEncoder().encode(site)
    return render_template(template, site=site, site_json=site_json)


@app.route('/apcdata/<slug>/embed/full')
def embed_full(slug):
    return site(slug, template='embed.html')


@app.route('/apcdata/<slug>/embed/reduced')
def embed_reduced(slug):
    return site(slug, template='embed_reduced.html')
   

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
