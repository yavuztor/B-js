describe("ghost behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
		node.innerHTML = '<b id="firstelem">test</b><div data-binding="text: $data(), ghost"></div>';
	});

	it("inserts contents of bound element to the parent, right before the bound element", function(){
		var o = B.observable("test");
		B.bindData(o, node);

		expect(node.childNodes.length).toBe(3);
		expect(node.childNodes.item(1).textContent).toBe("test");
		expect(node.childNodes.item(1).nodeType).toBe(3);
	});

	it("removes inserted nodes from parent when disposed", function(){
		var o = B.observable("test");
		B.bindData(o, node);

		expect(node.childNodes.length).toBe(3);
		B.Binding.get(node.lastChild).dispose();

		expect(node.childNodes.length).toBe(2);
		expect(node.lastChild.previousSibling.id).toBe("firstelem");
	})
});
