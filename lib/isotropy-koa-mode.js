(function() {
    "use strict";

    var co = require("co"),
        koa = require("koa"),
        koaSend = require("koa-send"),
        Isotropy = require("isotropy");


    var KoaMode = function(options) {
        this.options = options;
        this.isotropy = new Isotropy(this);
    };


    KoaMode.prototype.init = function() {
        var self = this;
        return co(function*() {
            var app = koa();

            self.addStaticDirectories(self.options.staticDirectories,self.options.config.destination);
            self.isotropy.addPageRoutes(self.options.routes.pages, self.options.layout);
            app.use(self.isotropy.router.koaRoute());

            var host = process.argv[2] || self.options.config.host || "127.0.0.1";
            var port = process.argv[3] || self.options.config.port || 8080;

            app.listen(port);

            var result = {
                host: host,
                port: port
            };

            return result;
        });
    };


    KoaMode.prototype.addStaticDirectories = function(staticDirectories, root) {
        var self = this;
        this.isotropy.router.when(
            function() {
                var path = this.path.split("/");
                return path.length >= 2 && staticDirectories.indexOf(path[1]) > -1;
            },
            function*() {
                var path = this.path.split("/");
                yield koaSend(this, this.path, { root: root });
                return false;
            }
        );
    };

    module.exports = KoaMode;

})();