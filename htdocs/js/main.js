/**
 * Main code package for the lizardfeeder page.
 */
window.Lizardfeeder_Main = (function(){

    return {

        config: {
            debug: 
                true,
            sources_url:
                'sources.json',
            feed_url:           
                'atom.json',
            max_entries:
                150,
            expected_update_period:
                10 * 60 * 1000, // 10 minutes
            feed_check_delay:   
                30 * 1000, // 30 seconds
            last_time_start:    
                24 * 60 * 60 * 1000
        },

        /**
         * Initialize the code package on load.
         */
        init: function() {
            var that = this;

            this.paused = false;
            this.time_factor = 1;
            this.setupSession();

            $(document).ready($.hitch(this, function() {

                // Eschew timeago's built-in per-call interval call and setup a
                // global periodic time refresh.
                $.timeago.settings.refreshMillis = 0;
                $.periodical(this, function() { 
                    $('*[class*=timeago]').timeago(); 
                }, 60 * 1000);

                // Set up a handler to try pausing the flow on mouse-over.
                $('#feed-items').hover(
                    function() { $(this).addClass('paused'); that.paused = true; },
                    function() { $(this).removeClass('paused'); that.paused = false; }
                );
            
                // Kick things off by fetching the list of sources and
                // starting the first feed check after that.
                $.getJSON(
                    this.config.sources_url + '?__=' + (new Date().getTime()), 
                    $.hitch(this, function(sources) {
                        this.setupSources(sources);
                        this.checkFeed();
                    })
                );

            }));

            return this;
        },

        /**
         * Set up the variables for this session.
         */
        setupSession: function() {
            // TODO: Manage this in a cookie?
            this.session = {};

            if (!this.session.source_filters) {
                this.session.source_filters = {};
            }

            /*
            if (!this.session.last_time) {
                var last_time = new Date();
                last_time.setTime( last_time.getTime() - this.config.last_time_start );
                this.session.last_time = last_time;
            }
            */
        },

        /**
         * Set up the UI with the list of sources as filters.
         */
        setupSources: function(sources) {
            var that = this;
            this.sources = sources;

            // Collate the sources into groups.
            var groups = {};
            $.each(sources, function() {
                if (this.group) {
                    if (!groups[this.group]) 
                        groups[this.group] = [];
                    groups[this.group].push(this);
                }
            });
            
            // Populate the filter groups from the collated sources.
            var ele = $('#filters > ul.template')
                .taltemplate({
                    groups: $.keys(groups).sort().map(function(group_name) {
                        return {
                            name: group_name,
                            sources: groups[group_name]
                        };
                    })
                })
                .removeClass('template');

            // Accordionify the source filters list.
            $('#filters .group .sources').hide();
            $('#filters .group a.expand')
                .click(function(e) {
                    $(this).siblings('.sources').toggle('fast');
                    return false;
                });
            $('#filters label')
                .hover(
                    function() { $(this).addClass('hover') },
                    function() { $(this).removeClass('hover') }
                )

            // Clicks on labels toggle checkboxes and update filters.
            $('#filters label')
                .click(function(e) {
                    $(this).prev().each(function() {
                        this.checked = !this.checked;
                        that.handleFilterChange($(this));
                    })
                });
            
            // Event delegation to handle checkbox clicks in filters.
            $('#filters').change(function(e) { 
                that.handleFilterChange($(e.target));
            });

            // TODO: Retain checkbox status in a cookie session?
            $('#filters input[type=checkbox]').attr('checked', true);

        },

        /**
         * Handle when a source filter checkbox is changed.
         */
        handleFilterChange: function(ele) {
            var checked = ele.attr('checked');
            var name    = ele.attr('name');
            var items;

            if (ele.parent().hasClass('group')) {
                // Toggle all sources to match the group checkbox.
                ele.parent()
                    .find('.sources input[type=checkbox]')
                    .attr('checked', checked);
                // Select all feed items for group except template.
                items = $('#feed-items .group-' + name)
                    .filter(':not(.template)');
            } else {
                // Select all feed items for source except template.
                items = $('#feed-items .short-' + name)
                    .filter(':not(.template)');
            }

            // Hide or show all entries for the group or source.
            // HACK: Deferred because it seems to let the checkboxes respond
            $.delay(this, function() {
                if (checked) {
                    items.show('fast').effect('highlight', {}, 250);
                } else { 
                    items.hide('fast');
                }
            }, 1);

            this.updateFilters();
        },

        /**
         * Scan checkboxes to update source filters.
         */
        updateFilters: function() {
            var that = this;
            $('#filters .source input[type=checkbox]').each(function() {
                if (!this.checked) {
                    that.session.source_filters[this.name] = false;
                } else {
                    delete that.session.source_filters[this.name];
                }
            });
        },

        /**
         * Load the feed index.
         */
        checkFeed: function() {
            $.getJSON(
                this.config.feed_url + '?__=' + (new Date().getTime()),
                $.hitch(this, function(feed) {
                    this.feed = feed;

                    this.start_time = 
                        $.parseISO8601(feed.entry_pages[0].start_time);
                    this.end_time = 
                        $.parseISO8601(feed.entry_pages[feed.entry_pages.length-1].end_time);

                    if (!this.session.last_time) {
                        this.time_factor = -1;
                        this.session.last_time = //$.parseISO8601(feed.entry_pages[0].end_time);
                            $.parseISO8601(feed.entry_pages[feed.entry_pages.length-1].end_time);
                    } else {
                        this.time_factor = this.calculateTimeFactor();
                    }

                    this.loadNextPage();
                })
            );
        },

        /**
         * Update the status displayed on page.
         */
        updateStatusDisplay: function() {
            $('#time-factor')
                .text(this.time_factor);
            $('#start-time')
                .attr('title', $.dateToISO8601(this.start_time)).timeago();
            $('#last-time')
                .attr('title', $.dateToISO8601(this.session.last_time)).timeago();
            $('#end-time')
                .attr('title', $.dateToISO8601(this.end_time)).timeago();
        },

        /**
         * Load the next page of the feed.
         */
        loadNextPage: function() {
            var next_page = this.feed.entry_pages.pop();

            if (!next_page) {
                // No more pages, so schedule a feed check.
                return $.delay(this, this.checkFeed,
                    this.config.feed_check_delay);
            }

            if ($.parseISO8601(next_page.start_time) <= this.session.last_time) {
                // The start of this page is too old, so skip.
                return $.delay(this, this.loadNextPage, 1);
            }

            // Load up the feed page and start processing.
            $.getJSON(
                next_page.href + '?__=' + (new Date().getTime()),
                $.hitch(this, function(entries, data) {
                    this.entries = entries;
                    this.processNextEntry();
                })
            );
        },

        /**
         * Process the next available entry.
         */
        processNextEntry: function(entry) {
            if (!entry) entry = this.entries.pop();

            if (this.paused) {
                // If we're paused, defer processing of entry for a second.
                return $.delay(this, function() {
                    this.processNextEntry(entry)
                }, 1000);
            }

            if (!entry) {
                // No more entries, so schedule a page load.
                return $.delay(this, this.loadNextPage, 1);
            }

            var updated = $.parseISO8601(entry.updated);

            if (updated <= this.session.last_time) {
                // This entry has probably already been displayed.
                return $.delay(this, this.processNextEntry, 1);
            }

            // Update the time of the latest entry loaded for this session.
            this.session.last_time = updated;

            // Get the tags and add the entry to the page.
            var tags = this.extractTagsFromEntry(entry);
            this.addEntryToPage(entry, tags);
            
            // Schedule the next entry to be processed.
            var wait_next_entry = 
                this.calculateNextEntryDelay(entry) + 1;

            this.updateStatusDisplay(); 

            return $.delay(this, this.processNextEntry, wait_next_entry);
        },

        /**
         * Add the given entry to the page layout.
         */
        addEntryToPage: function(entry, tags) {

            // Clone and populate a new instance of the template.
            var new_item = $('#feed-items .template')
                .clone()
                .taltemplate({
                    time:   $.parseISO8601(entry.updated),
                    author: entry.author || 'n/a',
                    title:  entry.title,
                    href:   entry.link,
                    domain: entry.link.split('/')[2],
                    tags:   tags
                })
                .removeClass('template')
                .prependTo('#feed-items')
                .hide();

            // If this entry is not filtered, display it.
            if (this.session.source_filters[tags['short']] !== false) {
                new_item.find('*[class*=timeago]').timeago();
                if (this.time_factor > 0 && this.time_factor <= 20)  {
                    // Flash the group and source associated with the new entry
                    $('#filters .source > label[for=' + tags['short'] + ']')
                        .effect('highlight', {}, 250);
                    $('#filters .group > label[for=' + tags['group'] + ']')
                        .effect('highlight', {}, 250);
                    new_item.show('fast');
                } else {
                    new_item.show();
                }
            }

            // If there are too many entries on the page, remove from the end.
            var all_entries = $('#feed-items .entry').filter(':not(.template)');
            if (all_entries.length > this.config.max_entries) {
                all_entries.eq(all_entries.length - 1).hide().remove();
            }
            
            /*
            var group_count = 
                $('#filters .group > label[for=' + tags['group'] + '] .count');
            group_count.text( parseInt(0 + group_count.text()) + 1 );
            */
        },

        /**
         * Calculate a time factor for page updates that hopefully gets things
         * caught up in time for the next expected update.
         */
        calculateTimeFactor: function() {
            var last_time = 
                    Math.max(this.session.last_time.getTime(), this.end_time.getTime()),
                available_duration = 
                    this.start_time.getTime() - last_time,
                catchup_duration =
                    (this.start_time.getTime() + this.config.expected_update_period) - ( new Date().getTime() );

            var out = available_duration / catchup_duration;
            return (out < 0) ? 50 : ( (out > 50 ) ? 50 : out );
        },

        /**
         * Calculate the wait between displaying the given entry and the next
         * in the stack.
         */
        calculateNextEntryDelay: function(entry) {
             // Zero or negative time factor treated as instantaneous.
             if (this.time_factor < 1) return 0;

            var wait_next_entry = 0;
            if (this.entries.length) {
                var time_now  = $.parseISO8601(entry.updated).getTime();
                var time_next = $.parseISO8601(this.entries[this.entries.length-1].updated).getTime();
                wait_next_entry = ( time_next - time_now ) / this.time_factor;
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

        EOF: null
    };

})().init();
