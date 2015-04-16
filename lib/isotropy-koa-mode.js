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

            if (self.options.routing.apis)
                self.isotropy.addRoutes(self.options.routing.apis.routes);

            if (self.options.routing.pages)
                self.isotropy.addRoutes(self.options.routing.pages.routes, self.options.routing.pages.layout);

            //Return a generator function that works with koa
            var routeFunc = function*(next) {
                yield* self.isotropy.router.doRouting(this, next);
            };

            app.use(routeFunc);

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
