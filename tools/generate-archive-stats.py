#!/usr/bin/env python
"""
"""
import sys, os, os.path
import xml.dom, xml.dom.minidom
from StringIO import StringIO
from xml.dom.minidom import parse, parseString, Node
from subprocess import Popen, PIPE

# Find library locations relative to the working dir.
base_dir = os.getcwd()
sys.path.extend([ os.path.join(base_dir, d) for d in 
    ( 'lib', 'extlib', 'venus', 'venus/planet/vendor' ) 
])

import feedparser, simplejson

ATOM_NS = 'http://www.w3.org/2005/Atom'

def main():
    """Main driver"""
    args = dict(zip([name.lstrip('-') for name in sys.argv[1::2]], sys.argv[2::2]))

    output_dir   = 'htdocs'
    archives_dir = 'htdocs/archives'

    entries = []
    all_stats = {}
    for root, dirs, files in os.walk(archives_dir):
        for file in files:
            if file.endswith('.xml') and file != 'index.xml':
                stats = {}   
                fn    = os.path.join(root, file)
                doc   = xml.dom.minidom.parse(fn)
                feed  = doc.firstChild

                updated = None

                for entry in findall(feed, 'entry'):
                    
                    entry_updated = findtext(entry, 'updated')
                    if updated is None or entry_updated < updated: 
                        updated = entry_updated

                    tags = dict([ 
                        ( x.getAttribute('term') + '=True' ).split('=', 2)[0:2]
                        for x in findall(entry, 'category') 
                    ])

                    if 'group' in tags:
                        label = tags['group']
                        if 'bugzilla:bug_status' in tags:
                            label = label + ';' + tags['bugzilla:bug_status']
                        if label in stats:
                            stats[label] += 1
                        else:
                            stats[label] = 1

                all_stats[updated] = stats

    json = simplejson.JSONEncoder(indent=True)
    open(output_dir + '/stats.json', 'w').write(json.encode(all_stats))

def findall(parent, name, ns=ATOM_NS):
    """
    Given a parent node, attempt to find children with the given 
    node name.
    """
    return [ 
        node for node in parent.childNodes
        if node.nodeType == Node.ELEMENT_NODE and \
            node.nodeName == name
    ]

def find(parent, name, ns=ATOM_NS):
    """
    For the given parent and node name, attempt to find the 
    first node.
    """
    nodes = findall(parent, name, ns)
    return len(nodes) and nodes[0] or None

def findtext(parent, name, ns=ATOM_NS):
    """
    Find the text for the first named node from the given parent.
    """
    node = find(parent, name, ns)
    return node and node.firstChild.nodeValue or None

if __name__ == '__main__': main()
