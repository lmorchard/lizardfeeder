/**
 *
 */
if (jQuery) (function($) {

    var test = {
        'input[name=groupname]' : {
            attr: {
                'name': ''
            }
        }
        name: { 
            text: '.entry-title',
            attr: [ 
        }
    };

    /**
     *
     */
    $.fn.selectorTemplate = function(spec, ns) {
        var that = ($this);
        for (name in spec) if (obj.hasOwnProperty(name)) {
            var targets = that.find(spec[name]);
            var value   = ns[name];
            switch (typeof value) {
                case 'undefined': continue;
                default:
                    targets.text(value);
            }
        }
    }

})(jQuery);
