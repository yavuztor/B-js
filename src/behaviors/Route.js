var B = require("../Binding.js");

/**
 * Watches for hashchange and parses the route, and sets the observable given in param.
 */
function Route(element, context, param) {
	this.route = param();
	observables.push(this.route);
	this.route(parseRoute(location.hash));
}

Route.prototype.dispose = function(){
	var self = this;
	observables = observables.filter(function(item){
		return (item != self.route);
	});
	this.route = null;
}

var observables = [];

function rootHandler() {
	var route = parseRoute(location.hash);
	observables.forEach(function(obs){
		obs(route);
	});
}

/**
 * route.paths is the path split by / and route.params is the querystring style parameters.
 */
function parseRoute(fullpath) {
	var paths = [], params = {};
	if (fullpath != null && fullpath.length > 1) {
		fullpath = fullpath.substring(1);
		var query = fullpath.split("?");
		paths = query[0].split("/");
		if (query.length > 1) {
			query[1].split("&").forEach(function(part){
				var p = part.split("=");
				params[p[0]] = p[1];
			});
		}
	}
	return {paths: paths, params: params};
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

module.exports = Route;
