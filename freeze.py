from treemaps.web import app
from treemaps.generators import freezer

app.config['DEBUG'] = False
app.config['ASSETS_DEBUG'] = False
freezer.freeze()
