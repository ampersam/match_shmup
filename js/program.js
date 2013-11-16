(function($) {
    function GameWindow (opt) {
        var self = this;
        var defaults = {
            display: {
                height: 800,
                width: 600
            }
        }
        self.options = $.extend({}, this.defaultOptions, opt)
        
    };

    $(document).ready(function() {
        var game = new GameEngine(options);
    })
})(jQuery);