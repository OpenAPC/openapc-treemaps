## openapc_visual

openapc_visual implements a visual frontend for the [OpenAPC project](https://github.com/OpenAPC/openapc-de), which collects and disseminates information on fee-based Open Access publishing from participating universities and research institutes.
The data is provided by a small backend OLAP service named openapc_cubes.
openapc_visual is based on the project [OffenerHaushalt](http://offenerhaushalt.de/) [(GitHub)](https://github.com/okfde/offenerhaushalt.de) by the [Open Knowlege Foundation](http://okfn.de/).

### Building the site

Build instructions are identical to the original project OffenerHaushalt. Requirements:

* Python 2.x, virtualenv
* node.js with npm, and global installs of: uglify-js, less, bower

When you have openapc_visual checked out, follow these steps:
```bash
bower install
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
python setup.py develop
```

You can then run the site like a normal Flask application:
```bash
python openapc_visual/manage.py runserver
```

Having verified that the application work, you can build a frozen version of all the contents in this database by running:
```bash
python openapc_visual/manage.py freeze
```

This will make a plain HTML version of the visualizations.
