from setuptools import setup, find_packages

setup(
    name='openapc_visual',
    version='1.0',
    description="Visual Frontend for OpenAPC data, based on OffenerHaushalt",
    long_description='',
    classifiers=[
        ],
    keywords='',
    author='Christoph Broschinski',
    author_email='openapc@uni-bielefeld.de',
    url='http://www.intact-project.org',
    license='MIT',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    namespace_packages=[],
    include_package_data=False,
    zip_safe=False,
    install_requires=[
    ],
    tests_require=[],
    entry_points=\
    """ """,
)
