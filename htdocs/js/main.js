/**
 * Main code package for the lizardfeeder page.
 */
if (typeof window.LizardFeeder == 'undefined')
    window.LizardFeeder = {}

LizardFeeder.Main = (function(){

    var START_TIME      = 0, 
        END_TIME        = 1, 
        STATS           = 2, 
        CHILDREN        = 3, 
        IS_PARENT_INDEX = 3;

    return {

        config: {
            debug:       true,
            index_url:   'jsonp.php/archives/index.json',
            sources_url: 'jsonp.php/sources.json',
            max_entries: 50,
            check_delay: 30 * 1000, // 30 seconds
        },

        /**
         * Initialize the code package on load.
         */
        init: function() {
            var that = this;

            $(document).ready($.hitch(this, function() {

                // Attempt to set a start time scraped from the last static
                // entry on the page.  Defaults to now, if none found.
                var start_time = new Date();
                $('#feed-items')
                    .find('.entry:not(.template):last .updated .timeago')
                    .each(function() {
                        start_time = $.parseISO8601(this.getAttribute('title'));
                    })

                this.wireUpWindowShade();
                this.wireUpFeedItems();
                this.wireUpFilters();

                this.time_control = new LizardFeeder.TimeControl({ 
                    main: this 
                });
                this.time_control.init();

                this.feeder = new LizardFeeder.Feeder({
                    main:        this,
                    start_time:  start_time,
                    index_url:   this.config.index_url,
                    check_delay: this.config.check_delay,
                    max_entries: this.config.max_entries
                });
                this.feeder.start();

            }));

            return this;
        },

        /**
         * Set up the pull-down window shade
         * TODO: make this into a jquery plugin?
         */
        wireUpWindowShade: function() {
            var that = this;
            $('.windowshade').each(function() {
                var shade = $(this);

                var show_it = function() {
                    var nav_id = $(this).attr('href').substr(1);

                    $(shade).find('.panes>div').removeClass('selected');
                    $(shade).find('.panes #'+nav_id).addClass('selected');
                    
                    $(shade).find('.nav li').removeClass('selected');
                    $(this).parent().addClass('selected');
                    
                    $(shade).find('.nav li.hide a').css('display', 'block');
                    
                    shade.animate({ 'marginTop': 0 }, 250);
                    return false;
                }
                
                var hide_it = function() {
                    $(shade).find('.nav li').removeClass('selected');
                    $(shade).find('.panes>div').removeClass('selected');
                    $(shade).find('.nav li.hide a').css('display', 'none');
                    
                    // HACK: 14 is a magic number, should be the margin of the panes area.
                    shade.animate({ 'marginTop': 0 - shade.height() + 14 }, 250);
                    return false;
                }

                $(shade).find('.nav li:not(.hide) a').click(show_it);
                $(shade).find('.nav li.hide a').click(hide_it);
            });
        },

        /**
         * Set up interactivity with the feed items list.
         */
        wireUpFeedItems: function() {
            var that = this;

            $('#feed-items')
                // Remove all the static items to make way for dynamic fetch.
                .find('li:not(.template)').remove().end()
                // Set up handlers to pause the flow on mouse-over.
                .hover(
                    function() { 
                        $(this).addClass('paused'); 
                        that.feeder.pause();
                        that.paused_class = $('body').attr('class');
                        $('body').attr('class', 'paused');
                    },
                    function() { 
                        $(this).removeClass('paused'); 
                        that.feeder.resume();
                        $('body').attr('class', that.paused_class);
                    }
                )

            // Eschew timeago's built-in per-call interval call and setup a
            // global periodic time refresh.
            $.timeago.settings.refreshMillis = 0;
            (function() { 
                $('*[class*=timeago]').timeago(); 
                setTimeout(arguments.callee, 60 * 1000);
            })();
        },

        /**
         * Set up the checkbox filters, attach hover and click events.
         */
        wireUpFilters: function() {
            var that = this;
            $('.filters')
                .change(function(e) { 
                    that.handleFilterChange($(e.target));
                })
                .find('input[type=checkbox]').attr('checked', true).end()
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

            this.feeder.updateFilters();
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

        EOF: null
    };

})().init();
