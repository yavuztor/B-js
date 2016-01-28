describe("style behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
	});

	it("sets style properties from the given parameter object", function(){
		node.setAttribute(B.Binding.ATTR, "style: {backgroundColor: $data()}");
		var o = B.observable("white");
		B.bindData(o, node);

		expect(node.style.backgroundColor).toBe("white");

		o("yellow");
		expect(node.style.backgroundColor).toBe("yellow");
	})
});
