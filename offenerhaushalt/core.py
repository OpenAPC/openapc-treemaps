import logging

from flask import Flask
from flask.ext.assets import Environment
from flask_frozen import Freezer
from flask_flatpages import FlatPages


from offenerhaushalt import default_settings

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.config.from_object(default_settings)
app.config.from_envvar('OFFENERHAUSHALT_SETTINGS', silent=True)

assets = Environment(app)
freezer = Freezer(app)
pages = FlatPages(app)
