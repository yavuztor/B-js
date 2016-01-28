describe("log behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
	});

	it("logs when behavior is initialized and when updated", function(){
		node.setAttribute(B.Binding.ATTR, "log: $data()");
		spyOn(console, "log");
		var o = B.observable('hello');
		B.bindData(o, node);

		expect(console.log).toHaveBeenCalled();
		console.log.calls.reset();

		o("test");
		expect(console.log).toHaveBeenCalled();
	});
});
