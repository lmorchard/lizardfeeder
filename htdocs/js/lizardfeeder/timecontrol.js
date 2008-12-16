/**
 * Builds and manages an activity-based navigation for the feeder.
 */
if (typeof window.LizardFeeder == 'undefined')
    window.LizardFeeder = {}
LizardFeeder.TimeControl = function(config) {
    return this.construct(config);
}
LizardFeeder.TimeControl.prototype = (function() {

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
            main:      null,
            index_url: 'jsonp.php/archives/index.json'
        },

        /**
         * Construct an instance of this object.
         */
        construct: function(config) {
            this.config = $.extend(this.defaults, config || {});
        },

        /**
         * Grab overall stats for years, months, and days from the archive.
         * Build an interactive activity graph that can be used to select a
         * start time for event streaming.
         */
        init: function() {
            var that = this;
            this.fetchArchiveStats(function(stats) {

                // Do a quick sweep to find the maximum total over days
                var max_total = 0;
                for (var i=0, year_stats; year_stats=stats[i]; i++) {
                    for (var j=0, month_stats; month_stats=year_stats[3][j]; j++) {
                        for (var k=0, day_stats; day_stats=month_stats[3][k]; k++) {
                            if (day_stats[2]['total'] > max_total)
                                max_total = day_stats[2]['total']
                        }
                    }
                }

                // Build nested lists representing years, months, and days.
                for (var i=0, year_stats; year_stats=stats[i]; i++) {
                    var year = year_stats[1].substr(0, 4);

                    var year_el = $('#date-nav>.template')
                        .clone().removeClass('template');

                    year_el.find('.year-label').text(year).end()
                           .find('.year-total').text(year_stats[2]['total']).end();

                    for (var j=0, month_stats; month_stats=year_stats[3][j]; j++) {
                        var month = month_stats[1].substr(5, 2);

                        var month_el = year_el.find('.months>.template')
                            .clone().removeClass('template');

                        month_el
                            .find('.month-label').text(month).end()
                            .find('.month-total').text(month_stats[2]['total']).end();

                        for (var k=0, day_stats; day_stats=month_stats[3][k]; k++) {
                            var day = day_stats[1].substr(8, 2);

                            var day_el = month_el.find('.days>.template')
                                .clone().removeClass('template');

                            // Days will be bars of relative height with
                            // respect to the maximum total found earlier.
                            day_el
                                .find('.day-meta').height(
                                    ( ( day_stats[2]['total'] / max_total ) * 100 ) + '%'
                                ).end()
                                .find('.day-label').text(day).end()
                                .find('.day-total').text(day_stats[2]['total']).end();

                            month_el.find('.days').append(day_el);
                        }
                        year_el.find('.months').append(month_el);
                    }
                    year_el.appendTo('#date-nav')
                }

                // Wire up interactivity, remove the templates, and select the
                // latest year and month.
                $('#date-nav')
                    .click($.hitch(that, that.handleDateNavClick))
                    .find('.template').remove().end()
                    .find('.year:last').addClass('selected')
                        .find('.month:last').addClass('selected').end()
                    .end()

            });
        },

        /**
         * Handle clicks on the dates and bars of the activity graph.
         */
        handleDateNavClick: function(e) {
            var t_el = $(e.target);

            if (t_el.hasClass('year-label')) {

                // Handle click selection of a year. 
                $('#date-nav .year').removeClass('selected');
                $('#date-nav .month').removeClass('selected');
                t_el.parents('.year').addClass('selected')
                    .find('.month:last').addClass('selected');

            } else if (t_el.hasClass('month-label')) {

                // Handle click selection of a month.
                t_el.parents('.months').find('.month')
                    .removeClass('selected');
                t_el.parents('.month').addClass('selected');

            } else if (t_el.hasClass('day-meta')) {
                
                // Handle click selection of a day.
                var day   = t_el.find('.day-label').text(),
                    month = t_el.parents('.month').find('.month-label').text(),
                    year  = t_el.parents('.year').find('.year-label').text();
                    date  = year + '-' + month + '-' + day + 'T00:00:00Z';

                $('#feed-items').find('li:not(.template)').remove();
                
                // Stop the existing feeder and create a new one with the new
                // start time, cloning the config of the old one.
                this.config.main.feeder.stop();
                this.config.main.feeder = new LizardFeeder.Feeder($.extend(
                    this.config.main.feeder.config,
                    { start_time: $.parseISO8601(date) }
                )); 
                this.config.main.feeder.start();
            }
        },

        /**
         * Walk through the archive indexes and dig up stats for year, month,
         * and day.  Given to callback as a nested array of arrays.
         */
        fetchArchiveStats: function(cb) {
            (function(index_url, stats, curr_depth, max_depth, cb) {
                var base_url = index_url.split('/').slice(0, -1).join('/'),
                    index_cb = arguments.callee;

                $.getJSON(index_url+'?callback=?', function(index) {
                    var c_urls = $.keys(index[CHILDREN]).sort();
                    
                    // Build this level of stats arrays, keeping a map from 
                    // URL to array index
                    var stats_map = {};
                    for (var i=0, c_url; c_url=c_urls[i]; i++) {
                        var child = index[CHILDREN][c_url];
                        stats_map[c_url] = i;
                        stats[i] = [ c_url, child[START_TIME], child[STATS], [] ];
                    }
                    
                    // Recurse with async fetches into sub-indexes until the
                    // max depth has been reached, which corresponds to daily
                    // indexes.
                    if (curr_depth >= max_depth) {
                        if (cb) cb(stats);
                    } else {
                        (function() {
                            var c_cb = arguments.callee;
                            if (!c_urls.length) {
                                if (cb) cb(stats);
                            } else {
                                var c_url = c_urls.shift(),
                                    child = index[CHILDREN][c_url];
                                if (!child[IS_PARENT_INDEX]) {
                                    c_cb();
                                } else {
                                    index_cb( 
                                        base_url+'/'+c_url, 
                                        stats[stats_map[c_url]][3], 
                                        curr_depth+1, max_depth, c_cb
                                    );
                                }
                            }
                        })();
                    }
                });
            })(this.config.index_url, [], 0, 2, cb);
        },

        EOF:null
    };

})();
