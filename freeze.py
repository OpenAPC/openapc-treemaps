import argparse
from os import environ

parser = argparse.ArgumentParser()
parser.add_argument("-d", "--dev", action="store_true", help="Freeze with settings for dev server")
args = parser.parse_args()
if args.dev:
    environ["TREEMAP_SETTINGS"] = "dev_settings.py"
    
from treemaps.web import app
from treemaps.generators import freezer

freezer.freeze()
