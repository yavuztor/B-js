describe("with behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
		document.body.appendChild(node);
	});
	afterEach(function(){
		document.body.removeChild(node);
	});

	it("applies bindings to templated content when parameter is not null", function(){
		node.setAttribute(B.Binding.ATTR, "with: $data()");
		node.innerHTML = '<b data-binding="text: $data"></b>';
		var o = B.observable(null);
		B.bindData(o, node);

		expect(node.innerHTML).toBe("");

		o("not-null");
		expect(node.children[0].textContent).toBe("not-null");
	});

});
