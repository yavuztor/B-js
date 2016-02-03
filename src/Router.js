var B = require("./observable.js");

/**
 * Router objects watch haschange on window and activates the corresponding route. Possible routes
 * should be supplied to the Router when constructing.
 * @param routes should be an array of route definition objects: {path:String, view:Object = Component instance, defaults:Object = Dictionary of properties to set on view}
 * @param parent should be the parent router, if there is any. If not given, or supplied null, this Router will be considered root,
 * 		and therefore will watch hash changes on the window. Root router always activates the router defined in the view object when it is picked.
 */
function Router(routes, parent) {
	var self = this;
	this.parent == parent;
	this.view = B.observable();
	this.routes = routes;
	this.routes.forEach(function(routedef) {
		routedef.paths = Router.parsePath(routedef.path);
	});
	this.defaultRoute = routes[0];
	if (parent == null) {
		Router.rootRouters.push(this);
	}
}

Router.prototype.goto = function Router_goto(routeData) {
	var route = this.defaultRoute;

	//find the first longest match
	this.routes.forEach(function(routedef) {
		for (var i = 0; i < routedef.paths.length; i++) {
			if (routedef.paths[i].charAt(0) != ":" && routeData.paths[i] != routedef.paths[i]) return;
		}
		if (routedef.paths.length > route.paths.length) route = routedef;
	});

	var comp = route.view;
	this.routeData = routeData;
	this.route = route;
	this.initComponent(route, routeData);
	if (comp.router) {
		comp.router.goto({paths: routeData.paths.slice(route.paths.length), params: routeData.params});
	}
	this.view(comp);
}

/**
 * Sets default values, path variables, and querystring parameters in order on the view object.
 * @param route the route definition that is activated. Only properties defined on the route.view object are set.
 * @param routeData the parsed route data that has the values.
 */
Router.prototype.initComponent = function Router_initComponent(route, routeData) {
	var self = this, comp = route.view;

	// set route defaults.
	for (var f in route.defaults) {
		setCompValue(f, route.defaults[f]);
	}
	// set path variables
	routeData.paths.forEach(function(val, i){
		if (i < route.paths.length && route.paths[i].charAt(0) == ":") {
			var name = route.paths[i].substring(1);
			setCompValue(name, val);
		}
	});

	// set params
	for (var f in routeData.params) {
		setCompValue(f, routeData.params[f]);
	}

	function setCompValue(f, val) {
		if(typeof comp[f] === "function") comp[f](val);
		else if (comp.hasOwnProperty(f)) comp[f] = val;
	}

}

Router.rootRouters = [];

/**
 * route.paths is the path split by / and route.params is the querystring style parameters.
 */
Router.parseRoute = function parseRoute(fullpath) {
	var paths = [], params = {};
	if (fullpath != null && fullpath.length > 0) {
		var query = fullpath.split("?");
		paths = Router.parsePath(query[0]);
		if (query.length > 1) {
			query[1].split("&").forEach(function(part){
				var p = part.split("=");
				params[p[0]] = p[1];
			});
		}
	}
	return {paths: paths, params: params};
}

Router.parsePath = function parsePath(path) {
	//remove leading characters # and !
	var re = /#!?/g;
	if (re.exec(path)) path = path.substring(re.lastIndex);

	var paths = path.split("/");

	//trim the path so no empty path is left.
	while (paths.length > 0 && paths[0] == "") paths.shift();
	while (paths.length> 0 && paths[paths.length - 1] == "") paths.pop();

	return paths;
}

function rootHandler() {
	var route = Router.parseRoute(location.hash);
	Router.rootRouters.forEach(function(h){
		h.goto(route);
	});
}

(function watchHashchange(handler) {
	if (window.onhashchange) {
		window.onhashchange = handler;
		return;
	}
	var oldHash = location.hash;
	setInterval(function(){
		var newHash = location.hash;
		if (newHash != oldHash) {
			handler();
			oldHash = newHash;
		}
	}, 200);
})(rootHandler);

module.exports = Router;
