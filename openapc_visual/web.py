from flask import abort, render_template

from openapc_visual.core import app, pages
from openapc_visual.util import JSONEncoder
from openapc_visual.sites import load_sites

sites = load_sites()


@app.route('/apcdata/<slug>/')
def site(slug, template='site.html'):
    site = sites.get(slug)
    site_json = JSONEncoder().encode(site)
    return render_template(template, site=site, site_json=site_json)


@app.route('/apcdata/<slug>/embed/<coverage>')
def embed_site(slug, coverage):
    if coverage == 'full':
        return site(slug, template='embed.html')
    elif coverage == 'reduced':
        return site(slug, template='embed_reduced.html')
    else:
        abort(404)

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
