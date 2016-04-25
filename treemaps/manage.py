from flask.ext.script import Manager, Server

from treemaps.web import app
from treemaps.generators import freezer

server = Server(host='0.0.0.0', port=5000)
manager = Manager(app)

manager.add_command("runserver", server)

@manager.command
def freeze():
    """ Freeze the entire site to static HTML. """
    app.config['DEBUG'] = False
    app.config['ASSETS_DEBUG'] = False
    freezer.freeze()

if __name__ == '__main__':
    manager.run()

