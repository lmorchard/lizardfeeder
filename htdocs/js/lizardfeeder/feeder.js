/**
 * Async feed streaming machine.
 */
if (typeof window.LizardFeeder == 'undefined')
    window.LizardFeeder = {}
LizardFeeder.Feeder = function(config) {
    return this.construct(config);
}
LizardFeeder.Feeder.prototype = (function() {
    
    // Status flags to control processing.
    var STATUS_READY   = 0,
        STATUS_RUNNING = 1,
        STATUS_PAUSED  = 2,
        STATUS_STOPPED = 3;

    // Positional constants for archive feed arrays.
    var START_TIME      = 0, 
        END_TIME        = 1, 
        STATS           = 2, 
        CHILDREN        = 3, 
        IS_PARENT_INDEX = 3;

    return {
        /** 
         * Default config settings
         */
        defaults: {
            main:        null,
            index_url:   'jsonp.php/archives/index.json',
            start_time:  new Date( new Date() - (30 * 60 * 1000) ),
            check_delay: 30 * 1000,
            max_entries: 50,
            time_factor: 1
        },

        /**
         * Construct an instance of this object.
         */
        construct: function(config) {
            this.config = $.extend(this.defaults, config || {});
            this.last_time = this.config.start_time;
            this.feed_urls = [];
            this.source_filters = {};
            this.status = STATUS_READY;
        },

        /**
         * Start this feeder running.
         */
        start: function() {
            this.status = STATUS_RUNNING;
            this.checkFeeds();
        },

        /**
         * Pause this feeder temporarily.
         */
        pause: function() {
            this.status = STATUS_PAUSED;
        },

        /**
         * Pause this feeder temporarily.
         */
        resume: function() {
            this.status = STATUS_RUNNING;
        },

        /**
         * Stop this feeder permanently.
         */
        stop: function() {
            this.status = STATUS_STOPPED;
        },

        /**
         * Scan checkboxes to update source filters.
         */
        updateFilters: function() {
            var that = this;
            $('.filters input[type=checkbox]').each(function() {
                if (!this.checked) {
                    that.source_filters[this.name] = false;
                } else {
                    delete that.source_filters[this.name];
                }
            });
        },

        /**
         * Load the feed index.
         */
        checkFeeds: function() {
            if (this.status == STATUS_STOPPED) return;

            $('body').attr('class', 'loading');
            this.fetchFeedsForTimeRange(
                $.dateToISO8601(this.last_time),
                null,
                $.hitch(this, function(feed_urls) {
                    this.feed_urls = feed_urls;
                    this.loadNextFeed();
                })
            );
        },

        /**
         * Load the next available feed.
         */
        loadNextFeed: function() {
            if (this.status == STATUS_STOPPED) return;

            $('body').attr('class', 'loading')
            var next_feed_url = this.feed_urls.shift();

            if (!next_feed_url) {
                // No more feeds to load, so schedule a check
                $('body').attr('class', 'waiting');
                return $.delay(
                    this, this.checkFeeds, 
                    this.config.check_delay
                );
            }

            // Load up the feed page and start processing.
            $.getJSON(
                next_feed_url + '?callback=?',
                $.hitch(this, function(feed, data) {
                    this.entries = feed.entries;
                    this.entries.sort(function(b,a) {
                        return (b.updated < a.updated) - 
                            (a.updated < b.updated);
                    });
                    this.last_time = this.entries[0].updated; 
                    $('body').attr('class', 'playing');
                    this.processNextEntry();
                })
            );
        },

        /**
         * Process the next available entry.
         */
        processNextEntry: function() {
            if (this.status == STATUS_STOPPED) return;

            if (this.status == STATUS_PAUSED) {
                // If we're paused, defer processing of entry for a second.
                return $.delay(this, this.processNextEntry, 1000);
            }

            var entry = this.entries.pop();
            if (!entry) {
                // No more entries, so schedule a page load.
                return $.delay(this, this.loadNextFeed, 1);
            }

            var updated = $.parseISO8601(entry.updated);
            if (updated < this.last_time) {
                console.log(updated + ' < ' + this.last_time);
                // This entry has probably already been displayed.
                return $.delay(this, this.processNextEntry, 1);
            }

            // Update the time of the latest entry loaded for this session.
            this.last_time = updated;

            // Get the tags and add the entry to the page.
            var tags = this.extractTagsFromEntry(entry);
            this.addEntryToPage(entry, tags);
            
            // Schedule the next entry to be processed.
            var wait_next_entry = 
                parseInt(this.calculateNextEntryDelay(entry) + 1);

            // this.updateStatusDisplay(); 

            return $.delay(this, this.processNextEntry, wait_next_entry);
        },

        /**
         * Add the given entry to the page layout.
         */
        addEntryToPage: function(entry, tags) {
            
            var bug_status     = tags['bugzilla:bug_status'],
                bug_resolution = tags['bugzilla:resolution'],
                entry_updated  = $.parseISO8601(entry.updated),
                domain         = entry.link.split('/')[2];

            var favicon = (domain == 'bugzilla.mozilla.org') ?
                'https://bugzilla.mozilla.org/skins/custom/images/bugzilla.png' :
                'http://www.google.com/s2/favicons?domain=' + domain;

            var entry_classes = [
                'entry',
                'group-'+tags['group'], 
                'short='+tags['short'],
                ( bug_status     ? 
                    'bug-status-' + bug_status.toLowerCase() : '' ),
                ( bug_resolution ?
                    'bug-resolution-' + bug_resolution.toLowerCase() : '' )
            ];

            // Clone and populate a new entry.
            var new_item = $('#feed-items .entry:last')
                .clone()
                .attr('class', entry_classes.join(' ')) 
                .find('.group span')
                    .text(tags['group'])
                .end()
                .find('.title')
                    .find('.favicon')
                        .attr('src', favicon)
                    .end()
                    .find('.link')
                        .attr('href', entry.link)
                        .text(entry.title)
                    .end()
                .end()
                .find('.updated')
                    .find('.timeago')
                        .attr('title', entry.updated)
                        .text(entry_updated.strftime('%+'))
                        .timeago()
                    .end()
                    .find('.time')
                        .text(entry_updated.strftime('%I:%M %p'))
                    .end()
                .end()
                .find('.author')
                    .text(entry.author || 'n/a')
                .end()
                .prependTo('#feed-items')
                .hide();

            // If this entry is not filtered, display it.
            if (this.source_filters[tags['group']] !== false) {
                new_item.show('fast');
            }

            // If there are too many entries on the page, remove from the end.
            $('#feed-items .entry:gt(' + (this.config.max_entries-1) + ')')
                .remove();
        },

        /**
         * Given a start and end time range, perform a selective walk through
         * the feeds archive to find feeds within the range.  The callback will
         * be called with the feeds collected during the walk.
         */
        fetchFeedsForTimeRange: function(start_time, end_time, callback) {
            var feeds = [];

            // HACK: This is muy ugly, but quick and dirty limit to 24 hrs.
            if (!end_time) {
                end_time = $.dateToISO8601(
                    new Date( $.parseISO8601(start_time).getTime() + 
                        ( 24 * 60 * 60 * 1000 ) )
                )
            }

            // Reentrant closure to handle sequenced and recursive async
            // requests for a walk through the feeds archive.
            (function(url, start_time, end_time, callback) {
                var walk_indexes = arguments.callee;
                $.getJSON(url + '?callback=?', function(index) {

                    // Make sure the child URLs are sorted by start time of the
                    // child index or feed.
                    var base_url   = url.split('/').slice(0, -1).join('/'),
                        child_urls = $.keys(index[CHILDREN]).sort(function(a,b) {
                            var a_time = index[CHILDREN][a][START_TIME];
                            var b_time = index[CHILDREN][b][START_TIME];
                            return (b_time < a_time) - (a_time < b_time);
                        });

                    // Search through children for indexes or feeds within the
                    // desired time range.
                    var children    = [],
                        found_start = false;
                    for (var i=0, child_url; child_url=child_urls[i]; i++) {
                        var child = index[CHILDREN][child_url];
                        if (!found_start && start_time < child[END_TIME])
                            found_start = true;
                        if (found_start) {
                            if (!child[IS_PARENT_INDEX]) {
                                // Accumulate non-index leaf node feeds.
                                feeds.push(base_url+'/'+child_url);
                            } else {
                                // Queue up index children for async fetch.
                                children.push(child_url);
                            }
                        }
                        if (end_time && child[END_TIME] >= end_time) 
                            break;
                    }

                    // This closure chains sequential async AJAX requests until
                    // the list of child indexes is exhausted, after which the 
                    // callback passed into walk_indexes (if any) is called.
                    (function() {
                        if (!children.length) {
                            if (callback) callback(feeds);
                        } else {
                            var child_url = children.shift(),
                                child     = index[CHILDREN][child_url];
                            walk_indexes(
                                base_url+'/'+child_url,
                                (child[START_TIME] < start_time) ? 
                                    start_time : child[START_TIME],
                                (child[END_TIME] > end_time) ? 
                                    end_time : child[END_TIME],
                                arguments.callee
                            );
                        }
                    })();
                });
            })(
                this.config.index_url, 
                start_time, end_time, callback
            );
        },

        /**
         * Calculate the wait between displaying the given entry and the next
         * in the stack.
         */
        calculateNextEntryDelay: function(entry) {
             // Zero or negative time factor treated as instantaneous.
             if (this.config.time_factor < 1) return 0;

            var wait_next_entry = 0;
            if (this.entries.length) {
                var time_now  = $.parseISO8601(entry.updated).getTime();
                var time_next = $.parseISO8601(this.entries[this.entries.length-1].updated).getTime();
                wait_next_entry = ( time_next - time_now ) / this.config.time_factor;
            }
            return wait_next_entry;
        },

        /**
         * Parse out the machine-tag style categories in the entry.
         */
        extractTagsFromEntry: function(entry) {
            var tags = {};
            for (var i=0, tag; tag=entry.tags[i]; i++) {
                var parts = tag.term.split('=');
                if (parts.length == 2) {
                    tags[parts[0]] = parts[1];
                } else if (parts.length == 1) {
                    tags[parts[0]] = true;
                }
            }
            return tags;
        },
        
        EOF:null
    };

})();
