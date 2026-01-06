#!/bin/bash

# Update script for openapc-treemaps, should be run after changes to the OLAP server have been made (update_olap.sh)
# This script should be executed from ~/dev

freezeparams=""
if [[ $1 == "dev" ]]
	then
		echo "Using dev settings for treemaps server"
		freezeparams=" --dev"
fi
# Delete old yamls, copy static files
if [ -d  ~/dev/openapc-treemaps/sites ]
	then
		rm -rf ~/dev/openapc-treemaps/sites
fi
mkdir ~/dev/openapc-treemaps/sites
cp ~/dev/openapc-treemaps/static_sites/*.yaml ~/dev/openapc-treemaps/sites/
# Pull a fresh copy of the OpenAPC core data file and use it to generate the yaml files
cd ~/dev/openapc-de
git pull
cd ~/dev/openapc-olap
. venv/bin/activate
python assets_generator.py -d ~/dev/openapc-treemaps/sites yamls
deactivate
# Delete old builds
cd ~/dev/openapc-treemaps
if [ -d build ]
	then
		rm -rf build
fi
# Rebuild the site and copy it
. venv/bin/activate
python freeze.py $freezeparams
sudo cp -r build/* /var/www/openapc-treemaps
