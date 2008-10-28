#!/usr/bin/env python
"""
Extract a list of sources used and output as JSON.
"""
# Find library locations relative to the working dir.
import sys, os
base_dir = os.getcwd()
sys.path.extend([ os.path.join(base_dir, d) for d in 
    ( 'lib', 'extlib', 'venus', 'venus/planet/vendor' ) 
])

import xml.sax
from xml.sax.handler import ContentHandler

import planet
from planet import config
from planet.spider import filename

import simplejson

def main():
    """Main driver, parse the feed and output the JSON list of sources"""

    handler = PlanetSourceHandler()

    parser = xml.sax.make_parser()
    parser.setFeature(xml.sax.handler.feature_namespaces, 1)
    parser.setContentHandler(handler)
    parser.parse(sys.stdin)

    print simplejson.JSONEncoder(indent=True).encode(handler.sources)

class PlanetSourceHandler(ContentHandler):
    """Simple SAX-based parser to pluck the planet:source elements and
        associated properties."""

    ATOM_NS   = 'http://www.w3.org/2005/Atom'
    PLANET_NS = 'http://planet.intertwingly.net/'

    def startDocument(self):
        self.sources   = []
        self.in_source = False
        self.source    = None
        self.chars     = ''
        self.key       = ''
        pass

    def startElementNS(self, name, qname, attrs):
        if name == (self.PLANET_NS, 'source'):
            """<planet:source> starts a new source record"""
            self.in_source, self.source = True, {}
        elif self.in_source and name[0] == self.PLANET_NS:
            """Any other tag in planet namespace within source is a property"""
            self.key, self.chars = name[1], ''

    def characters(self, content):
        """Collect characters while within a source record"""
        if self.in_source: self.chars += content

    def endElementNS(self, name, qname):
        if name == (self.PLANET_NS, 'source'):
            """Close out a <planet:source> by appending the collected record"""
            self.in_source = False
            self.sources.append(self.source)
        elif self.in_source and name[0] == self.PLANET_NS:
            """Close out any other planet namespace element by storing
                collected characters in a dictionary key"""
            self.source[self.key] = self.chars

if __name__ == "__main__": main()
