#!/usr/bin/env python
"""
Scan through htdocs/archives for JSON feeds.  Create index.json files at each
directory level summarizing the contents beneath and providing navigation links
into the date-based hierarchy.  Also, offer start/end timestamps and counts of
tags found in entries for statistical purposes.

An attempt is made to work incrementally and not update or parse where indexes
are still fresh with respect to available JSON feeds.
"""
import sys, os, os.path
import xml.dom, xml.dom.minidom
from StringIO import StringIO
from collections import defaultdict

# Find library locations relative to the working dir.
base_dir = os.path.dirname( os.path.dirname( __file__ ) ) or '.'
sys.path.extend([ os.path.join(base_dir, d) for d in 
    ( 'lib', 'extlib', 'venus', 'venus/planet/vendor' ) 
])

import feedparser, simplejson

# TODO: Grab this from conf/config.conf
ARCHIVES_DIR = '%s/htdocs/archives' % base_dir

def main():
    """
    Main driver
    """

    # Create a deeply-nested defaultdict of defaultdicts
    def deep_defaultdict(): return defaultdict(deep_defaultdict)
    index = deep_defaultdict()

    # Find all non-index JSON feeds and build a dict tree from the paths.
    for root, dirs, files in os.walk(ARCHIVES_DIR):
        for file in files:
            if file.endswith('.json') and file != 'index.json':
                fn = os.path.join(root, file).replace(ARCHIVES_DIR+'/','')
                curr = index
                for part in fn.split('/'): curr = curr[part]
                curr = 1

    # Write out index.json files.
    write_index_files(ARCHIVES_DIR, index)

def write_index_files(root, index):
    """
    Given a root directory and index tree of files, perform scanning and write
    index.json file.  Works recursively and incrementally.
    """

    # Establish index constants for the entry data records
    START, END, COUNTS, ENTRIES = 0, 1, 2, 3

    # Get the sorted index keys
    index_keys = index.keys()
    index_keys.sort()
    
    # Try loading up an existing index and grab its modification time
    index_fn = '%s/index.json' % root
    if os.path.isfile(index_fn):
        index_data    = simplejson.load(open(index_fn, 'r'))
        index_mtime   = os.path.getmtime(index_fn)
    else:
        index_data    = [ None, None, {}, {} ]
        index_mtime   = None
    
    entry_counts = {}

    for key in index_keys:

        if not key.endswith('.json'):
            # Levels of the tree with non-JSON keys are parent directories, 
            # so recursively build indexes and get summary results
            href = '%s/index.json' % key
            sub_start, sub_end, sub_entry_counts = \
                write_index_files(os.path.join(root, key), index[key])
        
        else:
            # Levels of the tree with JSON keys are leaf directories containing
            # feeds, so gather feed details.
            href       = key
            feed_fn    = '%s/%s' % (root, key)
            feed_mtime = os.path.getmtime(feed_fn)
            
            if index_mtime is not None and index_mtime > feed_mtime:
                # The index is newer than this feed, so use existing or 
                # default values for the feed and skip reading it.
                if href not in index_data[ENTRIES]:
                    index_data[ENTRIES][href] = [None, None, {}, False]
                sub_start, sub_end, sub_entry_counts, ignored = \
                    index_data[ENTRIES][href]
            
            else:
                feed = simplejson.load(open(feed_fn, 'r'))

                # Count the tags in the feed entries
                sub_entry_counts = count_tags(feed)

                # Use the update timestamps list to get an entry count, 
                # start time, and end time.
                times = [ x['updated'] for x in feed['entries'] ]
                times.sort()
                sub_start, sub_end = times[0], times[-1]
            
        # If a sub-feed or index produced a count, update the entry 
        # count for this index.
        for key in sub_entry_counts:
            if key in entry_counts:
                entry_counts[key] += sub_entry_counts[key]
            else:
                entry_counts[key] = sub_entry_counts[key]

        # Update the index entry for this href
        index_data[ENTRIES][href] = \
            [sub_start, sub_end, sub_entry_counts, False]

        # Keep the start and end times for this parent index updated
        if index_data[START] is None or sub_start < index_data[START]:
            index_data[START] = sub_start
        if index_data[END] is None or sub_end > index_data[END]:
            index_data[END] = sub_end

    index_data[COUNTS] = entry_counts

    simplejson.dump(index_data, open(index_fn, 'w'), indent=True)

    return (index_data[START], index_data[END], index_data[COUNTS])

def count_tags(feed):
    """
    Build a dict of keys and counts for all entries in a feed.
    """
    sub_entry_counts = defaultdict(lambda: 0)
    sub_entry_counts['total'] = len(feed['entries'])
    
    for entry in feed['entries']:
        tags = []
        
        # Use parsed categories as tags.
        if 'tags' in entry:
            tags.extend( x['term'] for x in entry['tags'] )
        
        # Consider planet_* properties as tags also.
        tags.extend( 
            '%s=%s' % (x, entry[x]) 
            for x in entry if x.startswith('planet_') 
        )

        # Accumulate counts for each of the tags.
        for tag in tags:
            if '=' not in tag: continue
            if tag.startswith('bugzilla:'): continue
            sub_entry_counts[tag] = sub_entry_counts[tag] + 1

    return sub_entry_counts

if __name__ == '__main__': main()
