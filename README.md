# Lizardfeeder v0.0

A firehose feed aggregator for the Mozilla community
http://feeds.mozilla.com/
lorchard@mozilla.com

Lizardfeeder is a set of configuration, plugins, theme parts, and patches
against Planet Venus.  The original Planet Venus can be found here:

http://www.intertwingly.net/code/venus/

## Requirements

* Python 2.4 and above

## Installation

# Create a local config, optionally edit it.
cp conf/config.ini-dist conf/config.ini
cp conf/hg-feeds.opml-dist conf/hg-feeds.opml

## Usage

# For best results, set up a crontab, eg:
*/10 * * * * $HOME/devel/mozilla/lizardfeeder/run.sh

# For a full run, expunge / spider / splice
./run.sh

# Fetch all subscribed feeds
./venus/spider.py ./conf/config.ini

# Rebuild output from cached data
./venus/splice.py ./conf/config.ini

# Expunge old entries from data cache
./venus/expunge.py ./conf/config.ini

# To run periodically without crontab (handy for development)
./tools/loop-run.sh
