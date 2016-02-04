describe("Router", function() {
	var router, subrouter;
	beforeEach(function(){
		router = new B.Router([
			{path: "/", view: {param1:"initial"}, defaults: {param1:"val1", param2:"val2"}},
			{path: "/project/:id", view: {id:"initial"}}
		]);
		router.routes[1].view.router = subrouter = new B.Router([
			{path:"/dwg", view: {param11:"initial"}, defaults: {param11:"val11"}}
		], router);
	});

	function testWithPrefixes(testwith) {
		testwith("");
		testwith("#!");
		testwith("#");
		testwith("/");
		testwith("#/");
		testwith("#!/");

	}

	it("should parsePath to empty array when hash is /, #/, #, #! or #!/", function(){
		testWithPrefixes(function(prefix){
			var paths = B.Router.parsePath(prefix);
			expect(paths.length).toBe(0);
		});
	});

	it("should parsePath to a trimmed array so that there is no empty path element.", function(){
		testWithPrefixes(function(prefix){
			var paths = B.Router.parsePath(prefix +"test/");
			expect(paths.length).toBe(1);
			expect(paths[0]).toBe("test");
		});
	});

	it("should parsePath so separated by /, so that /var1/var2 returns ['var1', 'var2'] and so on", function() {
		testWithPrefixes(function(prefix) {
			var paths = B.Router.parsePath(prefix + "var1/var2");
			expect(paths.length).toBe(2);
			expect(paths[0]).toBe("var1");
			expect(paths[1]).toBe("var2");
		});
	});

	it("should parseRoute correctly on ?param1=val1", function(){
		testWithPrefixes(function (prefix) {
			var data = B.Router.parseRoute(prefix + "?param1=val1");
			expect(data.paths.length).toBe(0);
			expect(data.params.param1).toBe("val1");
		});
	});

	it("should parseRoute correctly on ?param1=val1&param2=val2", function(){
		testWithPrefixes(function(prefix) {
			var data = B.Router.parseRoute(prefix + "?param1=val1&param2=val2");
			expect(data.paths.length).toBe(0);
			expect(data.params.param1).toBe("val1");
			expect(data.params.param2).toBe("val2");
		});
	});

	it("should parseRoute correctly on path1/path2?param1=val1&param2=val2", function(){
		testWithPrefixes(function(prefix){
			var data = B.Router.parseRoute(prefix + "path1/path2?param1=val1&param2=val2");
			expect(data.paths.length).toBe(2);
			expect(data.paths[0]).toBe("path1");
			expect(data.paths[1]).toBe("path2");
			expect(data.params.param1).toBe("val1");
			expect(data.params.param2).toBe("val2");
		});
	});

	function testWithHash(done, hash, fn) {
		window.location.hash = hash;
		setTimeout(function(){
			fn();
			done();
		}, 600);
	}

	it("should pick defaultRoute when hash path is not found", function(done){
		testWithHash(done, "not-existing", function(){
			expect(router.view()).toBe(router.defaultRoute.view);
		});
	});

	it("should set default parameters on the view, only if the parameter is defined (!= undefined) already, when the route is picked", function(done){
		testWithHash(done, "/", function(){
			expect(router.view()).toBe(router.defaultRoute.view);
			expect(router.view().param1).toBe('val1');
			expect(router.view().param2).toBe(undefined);
		});
	});

	it("should run goto in the selected view's router, if view.router is a Router object", function(done){
		testWithHash(done, "/project/someid", function(){
			expect(router.view()).toBe(router.routes[1].view);
			expect(router.view().id).toBe("someid");

			expect(subrouter.view()).toBe(subrouter.defaultRoute.view);
			expect(subrouter.view().param11).toBe("val11");
		});
	});

	it("should call viewfn to obtain a view, if it is present, when a route is picked", function(done){
		router.routes.push({path: "/test/:viewid", viewfn: function(viewid) { return {name: viewid, self: this}; } });
		testWithHash(done, "/test/value1", function(){
			expect(router.route).toBe(router.routes[2]);
			expect(router.view().self).toBe(router.routes[2]);
			expect(router.view().name).toBe("value1");
		});
	})
});
