import yaml
import requests
import os
from slugify import slugify

from treemaps.core import app


def urlpath(*a):
    a = [p.strip('/') for p in a]
    return '/'.join(a)


class _DataObject(object):

    def __getattr__(self, k):
        return self.data.get(k)


class SiteCollection(object):

    def __init__(self, directory):
        self.sites = []
        for site_file in os.listdir(directory):
            with open(os.path.join(directory, site_file), 'rb') as fh:
                site = Site(yaml.load(fh))
                if not site.data.get('skip'):
                    self.sites.append(site)

    def get(self, slug):
        for site in self.sites:
            if site.slug == slug:
                return site

    def __iter__(self):
        return self.sites.__iter__()

    def to_dict(self):
        return {'sites': self.sites}


class Filter(_DataObject):

    def __init__(self, site, data):
        self.site = site
        self.data = data
        self.default = unicode(data.get('default'))
        self.field = self.data.get('field')
        self.dimension = self.field.split('.')[0]
        self.label_ref = None
        self.key_ref = None
        self._values = None

    @property
    def values(self):
        if self._values is None:
            url = urlpath(self.site.api_base, 'members', self.dimension)
            res = requests.get(url)
            #raise Exception()
            for dim in self.site.model.get('dimensions'):
                dname = dim['name']
                if dname != self.dimension:
                    continue
                self.key_ref = dname
                self.label_ref = dname

            self._values = []
            for value in res.json().get('data'):
                self._values.append({
                    'key': value.get(self.key_ref),
                    'label': value.get(self.label_ref)
                })
            self._values = list(sorted(self._values,
                                key=lambda v: v.get('label')))
        return self._values

    @property
    def class_name(self):
        _ = self.values  # noqa
        return self.field.replace('.', ' ')

    def to_dict(self):
        values = self.values
        data = self.data.copy()
        data['label_ref'] = self.label_ref
        data['key_ref'] = self.key_ref
        data['values'] = values
        return data


class Site(_DataObject):

    def __init__(self, data):
        self.data = data
        self.slug = slugify(data.get('slug', data.get('name')))
        self.filters = [Filter(self, d) for d in data.get('filters', [])]
        self.api_base = urlpath(app.config['SLICER_URL'], 'cube',
                                self.data.get('dataset'))
        self._model = None

    @property
    def model(self):
        if self._model is None:
            res = requests.get(os.path.join(self.api_base, 'model'))
            self._model = res.json()
        return self._model

    def get_aggregate(self):
        if 'aggregate' in self.data:
            return self.data.get('aggregate')
        sum_aggs = []
        count_aggs = []
        print self.model.get('aggregates')
        for agg in self.model.get('aggregates'):
            if agg.get('function') == 'sum':
                sum_aggs.append(agg['ref'])
            elif agg.get('function') == 'count':
                count_aggs.append(agg['ref'])
        if len(sum_aggs) == 1:
            return {"aggregate": sum_aggs[0], "function": "sum"}
        elif len(count_aggs) == 1:
            return {"aggregate": count_aggs[0], "function": "count"}
        else:
            raise ValueError('Neither a singular sum aggregate nor a singular count aggregate found!')

    def to_dict(self):
        data = self.data.copy()
        data['slug'] = self.slug
        data['api'] = self.api_base
        aggregate_dict = self.get_aggregate()
        data['aggregate'] = aggregate_dict["aggregate"]
        data['aggregate_function'] = aggregate_dict["function"]
        data['all_aggregates'] = self.model.get('aggregates')

        # This seems hacky.
        data['keyrefs'] = {}
        data['labelrefs'] = {}
        for dim in self.model.get('dimensions'):
            name = dim['name']
            #data['keyrefs'][name] = dim['key_ref']
            #data['labelrefs'][name] = dim['label_ref']
            data['keyrefs'][name] = name
            data['labelrefs'][name] = name
            #for attr in dim.get('attributes').values():
             #   data['keyrefs'][attr['ref']] = attr['ref']
             #   data['labelrefs'][attr['ref']] = attr['ref']

        data['filters'] = self.filters
        return data


def load_sites():
    return SiteCollection(app.config['SITES_FOLDER'])
