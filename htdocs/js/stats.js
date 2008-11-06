/**
 *
 */
window.Lizardfeeder_Stats = (function(){

    return {

        init: function() {
            $(document).ready($.hitch(this, function() {
                $.getJSON(
                    'stats.json', 
                    $.hitch(this, function(stats) {
                        this.stats = stats;
                        this.plot_data = this.convertStatsIntoPlotData(stats);
                        this.buildLegendFilters();
                        this.renderGraph();
                    })
                );
            }));
            return this;
        },

        buildLegendFilters: function() {
            
            for (label in this.plot_data) {
                $('#legend .legend_label:last')
                .clone()
                .attr('class', 'legend_label')
                .find('input[type=checkbox]')
                    .attr('name', label)
                .end()
                .find('label')
                    .attr('for', label)
                    .text(label)
                .end()
                .appendTo('#legend')
            }

            $('#legend').change($.hitch(this, function(e) {
                this.renderGraph();
            }));

        },

        renderGraph: function() {
            var filters = {};
            $('#legend .legend_label input[type=checkbox]').each(function() {
                if (this.checked) filters[this.getAttribute('name')] = true;
            });
            var data = [];
            for (label in this.plot_data) {
                if (!filters[label]) continue;
                data.push({
                    label: label,
                    data:  this.plot_data[label]
                });
            }
            var options = {
                xaxis: { mode: 'time' }
            };
            var graph = $.plot($('#stats_graph'), data, options);
        },

        convertStatsIntoPlotData: function(stats) {
            var plot_data = { },
                min_time  = false,
                max_time  = false;

            // Build a list of times from object keys and sort.
            var times = [];
            for (var time in stats) times.push(time);
            times.sort();

            // Invert the labelled counts indexed by time into
            // labelled sets of counts by time
            for (var i=0, time; time=times[i]; i++) {
                
                var time_sec = $.parseISO8601(time).getTime();

                if (min_time === false || time_sec < min_time)
                    min_time = time_sec;
                
                if (max_time === false || time_sec < max_time)
                    max_time = time_sec;

                for(var count_name in stats[time]) {
                    if (!plot_data[count_name])
                        plot_data[count_name] = [];
                    plot_data[count_name].push([
                        time_sec, 
                        stats[time][count_name]
                    ]);
                }

            }
            
            return plot_data;
        },

        EOF: null
    };

})().init();
