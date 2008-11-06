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
                50,
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
            this.time_factor = 50;
            this.session = {
                source_filters: {}
            };

            $(document).ready($.hitch(this, function() {

                $('#feed-items')
                    .find('li:not(.template)').remove().end()
                    .hover(
                        // Set up handlers to try pausing the flow on mouse-over.
                        function() { $(this).addClass('paused'); that.paused = true },
                        function() { $(this).removeClass('paused'); that.paused = false }
                    )
                    /*
                    .find('.entry:first .updated .timeago').each(function() {
                        // Set last update time to update time of the first entry.
                        that.session.last_time = 
                            $.parseISO8601( this.getAttribute('title') );
                    });
                    */
            
                // Set up the checkbox filters, attach hover and click events.
                $('.filters')
                    .change(function(e) { 
                        that.handleFilterChange($(e.target));
                    })
                    .find('input[type=checkbox]')
                        .attr('checked', true)
                    .end()
                    .find('label')
                        .hover(
                            function() { $(this).addClass('hover') },
                            function() { $(this).removeClass('hover') }
                        )
                        .click(function(e) {
                            $(this).prev().each(function() {
                                this.checked = !this.checked;
                                that.handleFilterChange($(this));
                            })
                        })
                    .end();

                // Eschew timeago's built-in per-call interval call and setup a
                // global periodic time refresh.
                $.timeago.settings.refreshMillis = 0;
                (function() { 
                    $('*[class*=timeago]').timeago(); 
                    setTimeout(arguments.callee, 60 * 1000);
                })();

                // Kick off the first feed check.
                this.checkFeed();
            }));

            return this;
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
                        this.session.last_time = $.parseISO8601(feed.entry_pages[feed.entry_pages.length-1].end_time);
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
                this.time_factor = 1;

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
            if (this.session.source_filters[tags['short']] !== false) {
                new_item.show('fast');
            }

            // If there are too many entries on the page, remove from the end.
            $('#feed-items .entry:gt(' + (this.config.max_entries-1) + ')')
                .remove();
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
