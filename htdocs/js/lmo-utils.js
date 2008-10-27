/**
 * A random grab-bag of utilities not found in jQuery
 * l.m.orchard@pobox.com 
 * http://decafbad.com/
 * Share and Enjoy
 */
(function($) {

    /**
     * Scope binding for functions as methods of an object
     * inspired by dojo.hitch()
     */
    $.hitch = function(){ 
        var args   = Array.prototype.slice.call(arguments), 
            object = args.shift(), 
            fn     = args.shift(); 
        return function(){ 
            return fn.apply(
                object, 
                args.concat(Array.prototype.slice.call(arguments))
            ); 
        }; 
    }; 

    /**
     * Delayed execution with scope binding.
     * inspired by MooTools' Function.prototype.delay
     */
    $.delay = function() {
        var args   = Array.prototype.slice.call(arguments), 
            object = args.shift(), 
            fn     = args.shift(),
            delay  = args.shift();
        return setTimeout(function() { 
            fn.apply(object, args) 
        }, delay);
    };

    /**
     * Periodical execution with scope binding.
     * inspired by MooTools' Function.prototype.periodical
     */
    $.periodical = function() {
        var args   = Array.prototype.slice.call(arguments), 
            object = args.shift(), 
            fn     = args.shift(),
            delay  = args.shift();
        return setInterval(function() { 
            fn.apply(object, args) 
        }, delay);
    };

    /**
     * Return the names of all self-owned properties of an object.
     */
    $.keys = function(obj) {
        var keys = [];
        for (k in obj) if (obj.hasOwnProperty(k))
            keys.push(k)
        return keys;
    };

    /**
     * Parse a date in ISO8601 format into a JS date.
     * see: http://delete.me.uk/2005/03/iso8601.html
     * TODO: Steal dojo's date/stamp.js?
     */
    $.parseISO8601 = function (string) {
        var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
            "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
            "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
        var d = string.match(new RegExp(regexp));

        var offset = 0;
        var date = new Date(d[1], 0, 1);

        if (d[3]) { date.setMonth(d[3] - 1); }
        if (d[5]) { date.setDate(d[5]); }
        if (d[7]) { date.setHours(d[7]); }
        if (d[8]) { date.setMinutes(d[8]); }
        if (d[10]) { date.setSeconds(d[10]); }
        if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
        if (d[14]) {
            offset = (Number(d[16]) * 60) + Number(d[17]);
            offset *= ((d[15] == '-') ? 1 : -1);
        }

        offset -= date.getTimezoneOffset();
        time = (Number(date) + (offset * 60 * 1000));
        date.setTime(Number(time));
        return date;
    }

    /**
     * Format a JS date as ISO8601
     * see: http://delete.me.uk/2005/03/iso8601.html
     * TODO: Steal dojo's date/stamp.js?
     */
    $.dateToISO8601 = function(date, format, offset) {
        /* accepted values for the format [1-6]:
           1 Year:
           YYYY (eg 1997)
           2 Year and month:
           YYYY-MM (eg 1997-07)
           3 Complete date:
           YYYY-MM-DD (eg 1997-07-16)
           4 Complete date plus hours and minutes:
           YYYY-MM-DDThh:mmTZD (eg 1997-07-16T19:20+01:00)
           5 Complete date plus hours, minutes and seconds:
           YYYY-MM-DDThh:mm:ssTZD (eg 1997-07-16T19:20:30+01:00)
           6 Complete date plus hours, minutes, seconds and a decimal
           fraction of a second
           YYYY-MM-DDThh:mm:ss.sTZD (eg 1997-07-16T19:20:30.45+01:00)
           */
        if (!format) { var format = 6; }
        if (!offset) {
            var offset = 'Z';
        } else {
            var d = offset.match(/([-+])([0-9]{2}):([0-9]{2})/);
            var offsetnum = (Number(d[2]) * 60) + Number(d[3]);
            offsetnum *= ((d[1] == '-') ? -1 : 1);
            var date = new Date(Number(Number(date) + (offsetnum * 60000)));
        }

        var zeropad = function (num) { return ((num < 10) ? '0' : '') + num; }

        var str = "";
        str += date.getUTCFullYear();
        if (format > 1) { str += "-" + zeropad(date.getUTCMonth() + 1); }
        if (format > 2) { str += "-" + zeropad(date.getUTCDate()); }
        if (format > 3) {
            str += "T" + zeropad(date.getUTCHours()) +
                ":" + zeropad(date.getUTCMinutes());
        }
        if (format > 5) {
            var secs = Number(date.getUTCSeconds() + "." +
                    ((date.getUTCMilliseconds() < 100) ? '0' : '') +
                    zeropad(date.getUTCMilliseconds()));
            str += ":" + zeropad(secs);
        } else if (format > 4) { str += ":" + zeropad(date.getUTCSeconds()); }

        if (format > 3) { str += offset; }
        return str;
    }

})(jQuery);
