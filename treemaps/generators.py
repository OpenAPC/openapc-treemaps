from treemaps.core import freezer, pages
from treemaps.sites import load_sites

sites = load_sites()


@freezer.register_generator
def page():
    for page in pages:
        yield {'path': page.path}

@freezer.register_generator
def site():
    for site in sites:
        yield {'slug': site.slug}

@freezer.register_generator
def embed_full():
    for site in sites:
        for hierarchy in site.hierarchies:
            yield {'slug': site.slug, 'hierarchy_name': hierarchy}

@freezer.register_generator
def redirect_embed_full():
    for site in sites:
        yield {'slug': site.slug}

@freezer.register_generator
def embed_reduced():
    for site in sites:
        for hierarchy in site.hierarchies:
            yield {'slug': site.slug, 'hierarchy_name': hierarchy}

@freezer.register_generator
def redirect_embed_reduced():
    for site in sites:
        yield {'slug': site.slug}

