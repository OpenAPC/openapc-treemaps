import logging

from flask import Flask
from flask_assets import Environment
from flask_frozen import Freezer
from flask_flatpages import FlatPages


from treemaps import default_settings

logging.basicConfig(level=logging.ERROR)

app = Flask(__name__)
app.config.from_object(default_settings)
app.config.from_envvar('TREEMAP_SETTINGS', silent=True)

assets = Environment(app)
freezer = Freezer(app)
pages = FlatPages(app)
