describe("css behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
	});

	it("adds keys of the parameter object to element's className, if their values eval to true. Removes otherwise", function(){
		var o = B.observable(false);
		node.setAttribute(B.Binding.ATTR, "css: {cl1: true, cl2: $data()}");
		B.bindData(o, node);

		expect(node.className).toContain("cl1");
		expect(node.className).not.toContain("cl2");

		o(true);
		expect(node.className).toContain("cl2");
	})
})
