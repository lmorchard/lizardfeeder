#!/usr/bin/env python
"""
Simple filter to run Atom through the feed parser, whose results 
are output as JSON.
"""
import sys, os

# Find library locations relative to the working dir.
base_dir = os.getcwd()
sys.path.extend([ os.path.join(base_dir, d) for d in 
    ( 'lib', 'extlib', 'venus', 'venus/planet/vendor' ) 
])

import planet
from planet import config
from planet.spider import filename

import feedparser, simplejson

def main():
    """
    Run the Atom feed through the feedparser, then save the results as a
    set of paginated JSON files indexed by an overall feed description
    doc.
    """
    args = dict(zip([name.lstrip('-') for name in sys.argv[1::2]], sys.argv[2::2]))

    page_fn_tmpl = ('page_filename' in args) and \
        args['page_filename'] or 'atom-page-%s.json'
    page_size = ('page_size' in args) and \
        args['page_size'] or 15
    output_dir = ('output_dir' in args) and \
        args['output_dir'] or 'htdocs'

    json = MyJSONEncoder()
    feed = feedparser.parse(sys.stdin.read())

    # Dump out the whole parsed feed without pagination.
    open('%s/%s' % (output_dir, page_fn_tmpl % 'all'), 'w').write(json.encode(feed))
    
    # Yank the list of entries out of the main feed.
    entries = feed['entries']
    del feed['entries']
    feed['entry_pages'] = []

    # Chop the list of entries up into pages.
    count = len(entries)
    pages = count / page_size
    for page in range(pages):

        # Extract a page worth of entries from the parsed feed.
        page_start   = page * page_size
        page_end     = page_start + page_size
        entries_page = entries[page_start:page_end]
        entries_data = json.encode(entries_page)

        # Save this page of feed entries
        page_fn = page_fn_tmpl % (page + 1)
        open('%s/%s' % (output_dir, page_fn), 'w').write(entries_data)

        # Add this page to the feed index, along with the
        # start and end times for entries contained within.
        feed['entry_pages'].append({
            'href'       : page_fn,
            'start_time' : entries_page[0].updated,
            'end_time'   : entries_page[-1].updated
        })

    print json.encode(feed)

class MyJSONEncoder(simplejson.JSONEncoder):

    def default(self, o):
        """
        Support arbitrary iterators for encoding.
        """
        try:
            iterable = iter(o)
        except TypeError:
            pass
        else:
            return list(iterable)
        return JSONEncoder.default(self, o)

if __name__ == "__main__": main()
