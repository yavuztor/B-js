describe("prop behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
	});

	it("sets element properties from given parameter object", function(){
		node.setAttribute(B.Binding.ATTR, "prop: {title: $data()}");
		var o = B.observable("test");
		B.bindData(o, node);

		expect(node.title).toBe("test");

		o("another");
		expect(node.title).toBe("another");
	});
});
