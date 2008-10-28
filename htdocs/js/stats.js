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

                        // Turn the accumulated sets into Flot data.
                        var data = [];
                        for (label in plot_data) {
                            data.push({
                                label: label,
                                data:  plot_data[label]
                            });
                        }

                        var options = {
                            xaxis: { mode: 'time' }
                        };

                        var graph = $.plot($('#stats_graph'), data, options);

                    })
                );


            }));
        
            return this;
        },

        EOF: null
    };

})().init();
