#!/usr/bin/env python
"""
Quick and dirty script to build an Atom feed from a Flickr API public photo search

TODO: Cache photo metadata in inner loop
"""
import sys, os, os.path, time
import xml.dom, xml.dom.minidom
from xml.sax.saxutils import escape
from xml.dom.minidom import parse, parseString, Node
import urllib

MAX_PHOTOS   = 50
API_KEY      = 'e2c6b12dd1cbf864d99060f6425b42cf'
SEARCH_TERMS = 'mozilla OR firefox'
OUTPUT_FN    = 'htdocs/mozilla-flickr-search.xml'

def main():
    """Main driver"""

    # Perform the photo search
    rsp = xml.dom.minidom.parse(urllib.urlopen(
        'http://api.flickr.com/services/rest/' + \
        '?method=flickr.photos.search&api_key=%s&text=%s&per_page=%s' % \
        ( API_KEY, urllib.quote(SEARCH_TERMS), MAX_PHOTOS )
    ))
    photos = findall(rsp.firstChild, 'photos')[0]

    # Iterate through the photo search results and collect metadata
    items = []
    for photo in findall(photos, 'photo')[0:MAX_PHOTOS]:

        # Extract some attributes from the photo search result
        attrs = dict( (x, photo.getAttribute(x)) for x in [
            'title', 'owner', 'farm', 'server', 'id', 'secret'
        ])
        
        # Fetch metadata on the current photo
        rsp = xml.dom.minidom.parse(urllib.urlopen(
            'http://api.flickr.com/services/rest/' + \
            '?method=flickr.photos.getInfo&api_key=%s&photo_id=%s&secret=%s' % \
            ( API_KEY, attrs['id'], attrs['secret'] )
        ))
        photo = find(rsp.firstChild, 'photo')

        # Build a template data item for the current photo.
        item = {
            'title':
                escape(attrs['title']),
            'link':        
                'http://www.flickr.com/photos/%(owner)s/%(id)s' % attrs,
            'img':         
                'http://farm%(farm)s.static.flickr.com/%(server)s/%(id)s_%(secret)s_m.jpg' % attrs,
            'author':      
                escape( find(photo, 'owner').getAttribute('realname') ),
            'posted':      
                time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(int(photo.getAttribute('dateuploaded')))),
            'description': 
                findtext(photo, 'description')
        }
        items.append(item)

    # Assemble the feed from the collected items.
    feed = FEED_TMPL % {
        'now':  
            time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'entries': 
            ''.join(ENTRY_TMPL % x for x in items)
    }
    
    # Finally, output the finished feed to disk.
    open(OUTPUT_FN, 'w').write(feed.encode('utf-8'))

def findall(parent, name, ns=''):
    """
    Given a parent node, attempt to find children with the given 
    node name.
    """
    return [ 
        node for node in parent.childNodes
        if node.nodeType == Node.ELEMENT_NODE and \
            node.nodeName == name
    ]

def find(parent, name, ns=''):
    """
    For the given parent and node name, attempt to find the 
    first node.
    """
    nodes = findall(parent, name, ns)
    return len(nodes) and nodes[0] or None

def findtext(parent, name, ns=''):
    """
    Find the text for the first named node from the given parent.
    """
    node = find(parent, name, ns)
    try:
        return node and node.firstChild.nodeValue or None
    except Exception:
        return ''

FEED_TMPL = """<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Mozilla on Flickr</title>
  <updated>%(now)s</updated>
  <author>
    <name>l.m.orchard</name>
    <email>lorchard@mozilla.com</email>
  </author>
  %(entries)s
</feed>
"""

ENTRY_TMPL = """
  <entry>
    <id>%(link)s</id>
    <link href="%(link)s" rel="alternate" type="text/html"/>
    <title>%(title)s</title>
    <summary type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml">
      <img src="%(img)s" />
    </div></summary>
    <updated>%(posted)s</updated>
    <author>
      <name>%(author)s</name>
    </author>
  </entry>
"""

if __name__ == '__main__': main()
