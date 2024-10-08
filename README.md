## openapc-treemaps

openapc-treemaps implements a [visual frontend](https://treemaps.openapc.net) for the [OpenAPC project](https://github.com/OpenAPC/openapc-de), which collects and disseminates information on fee-based Open Access publishing from participating universities and research institutes.
The data is provided by a small backend OLAP service named [openapc-olap](https://olap.openapc.net) ([GitHub](https://github.com/OpenAPC/openapc-olap)).
openapc-treemaps is based on the project [OffenerHaushalt](http://offenerhaushalt.de/) ([GitHub](https://github.com/okfde/offenerhaushalt.de)) by the [Open Knowlege Foundation](http://okfn.de/).

### Building the site

Build instructions are identical to the original project OffenerHaushalt. Requirements:

* Python 3.10, virtualenv
* node.js >= v21.1.0 with npm, and global installs of: uglify-js + less

When you have openapc-treemaps checked out, follow these steps:
```bash
bower install
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
python setup.py develop
```

You can then run the site using the Flask script cli:
```bash
flask --app treemaps.web run -h 0.0.0.0
```

Having verified that the application work, you can build a frozen version of all the contents in this database by running:
```bash
python freeze.py
```

This will make a plain HTML version of the visualizations.
