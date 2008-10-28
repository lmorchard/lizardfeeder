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

                    for tag_ele in findall(entry, 'category'):
                        tag = tag_ele.getAttribute('term')
                        if tag.startswith('group'): 
                            if tag in stats:
                                stats[tag] += 1
                            else:
                                stats[tag] = 1

                all_stats[updated] = stats

    json = simplejson.JSONEncoder(indent=True)
    open(output_dir + '/stats.json', 'w').write(json.encode(all_stats))

def writeFeed(file, feed):
    """
    Write a feed out to the given file object, attempting to use xmllint to
    tidy up first.
    """
    try:
        # HACK: The feed XML looks a bit nasty here after all the transformations,
        # so attempt a quick pass though xmllint to tidy things up
        lint = Popen( 
            ('xmllint', '--format','-'), 
            stdin=PIPE, 
            stdout=file 
        )
        lint.stdin.write(feed.toxml('utf-8'))
    except Exception, e:
        # If the above fails, assume it's because xmllint didn't work and try
        # writing the ugly version.
        file.write(feed.toxml('utf-8'))

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

def getFeedLinks(doc, feed):
    """
    For the given document and feed, attempt to dig up the Atom pagination 
    links.  The links will be created if not already present.
    """
    rels  = ( 'self', 'next', 'previous' )
    links = {}

    for link in findall(feed, 'link'):
        for rel in rels:
            if link.getAttribute('rel') == rel:
                links[rel] = link
    
    # Check to see if the desired links were found.
    for rel in rels:
        if not rel in links or not links[rel]:
            # The link wasn't found in the page, so 
            # create a new one.
            link = doc.createElement('link')
            link.setAttribute('rel', rel)
            links[rel] = link
        else:
            link = links[rel]
            feed.removeChild(link)

        # Ensure the links stay at the top of the feed.
        feed.insertBefore(link, feed.firstChild)

    return links

if __name__ == '__main__': main()
