describe("text behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
	});

	it("replaces textContent with literal value", function(){
		node.setAttribute(B.Binding.ATTR, "text: 'Hello World'");
		B.bindData({}, node);

		expect(node.textContent).toBe("Hello World");
	});

	it("replaces textContent with an observable value", function(){
		node.setAttribute(B.Binding.ATTR, "text: $data() + '>>'");
		var o = B.observable("val");
		B.bindData(o, node);

		expect(node.textContent).toBe("val>>");
	});

	it("updates textContent when the param value changes through dependencies", function(){
		node.setAttribute(B.Binding.ATTR, "text: $data() + '>>'");
		var o = B.observable("val");
		B.bindData(o, node);

		expect(node.textContent).toBe("val>>");
		o("TEST");
		expect(node.textContent).toBe("TEST>>");
		o("new");
		expect(node.textContent).toBe("new>>");
	});
})
