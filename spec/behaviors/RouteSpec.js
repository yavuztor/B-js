describe("Route behavior suite", function(){
	var node, o;
	beforeEach(function(done){
		location.hash = "";
		node = document.createElement("DIV");
		node.setAttribute(B.Binding.ATTR, "route: $data");
		o = B.observable();
		setTimeout(function(){ done(); }, 500)
	});

	it("sets the current route on the given observable", function(done){
		var callCount = 0;
		o.subscribe(function(newroute, oldroute){
			callCount++;
		});

		B.bindData(o, node);

		expect(callCount).toBe(1);

		location.hash = "project";
		setTimeout(function(){
			expect(callCount).toBe(2);
			expect(o().paths[0]).toBe("project");
			done();
		}, 1000)
	});

	it("sets route params when the hash includes ? and query params.", function(done){
		B.bindData(o, node);

		location.hash = "project?id=test&name=something";
		setTimeout(function(){
			expect(o().params.id).toBe("test");
			expect(o().params.name).toBe("something");
			expect(o().paths[0]).toBe("project");
			done();
		}, 1000)
	})
});
