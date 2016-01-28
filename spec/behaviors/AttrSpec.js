describe("attr behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
	});

	it("sets attribute with given value", function(){
		node.setAttribute(B.Binding.ATTR, "attr: {title: 'Hello'}");
		B.bindData({}, node);

		expect(node.getAttribute("title")).toBe('Hello');
	});

	it("updates attribute when the parameter value changes.", function(){
		node.setAttribute(B.Binding.ATTR, "attr: {title: $data()}");
		var o = B.observable("TEST");
		B.bindData(o, node);

		expect(node.getAttribute("title")).toBe("TEST");
		o("NEW VALUE");
		expect(node.getAttribute("title")).toBe("NEW VALUE");

	});
})
