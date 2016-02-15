from flask.ext.script import Manager, Server

from openapc_visual.web import app
from openapc_visual.generators import freezer

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

