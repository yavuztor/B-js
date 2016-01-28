describe("foreach behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
	});

	it("repeats the innerHTML for each item in the parameter that evaluates to array", function(){
		node.setAttribute(B.Binding.ATTR, "foreach: $data()");
		node.innerHTML = '<b data-binding="text: $data"></b>';
		var o = B.observable(["a", "b", "c"]);
		B.bindData(o, node);

		var bs = node.getElementsByTagName("B");
		expect(bs.length).toBe(3);
		expect(bs.item(0).textContent).toBe("a");
		expect(bs.item(1).textContent).toBe("b");
		expect(bs.item(2).textContent).toBe("c");

		o(["d"]);
		expect(bs.length).toBe(1);
		expect(bs.item(0).textContent).toBe("d");
	});

	it("sets innerHTML to empty when parameter is null or empty array", function(){
		node.setAttribute(B.Binding.ATTR, "foreach: $data()");
		node.innerHTML = '<b data-binding="text: $data"></b>';
		var o = B.observable(null);
		B.bindData(o, node);

		expect(node.innerHTML).toBe("");

		o([]);
		expect(node.innerHTML).toBe("");
	});

	it("resets the innerHTML to its original after disposed", function(){
		node.setAttribute(B.Binding.ATTR, "foreach: $data()");
		var content = '<b data-binding="text: $data"></b>';
		node.innerHTML = content;
		var o = B.observable(null);
		B.bindData(o, node);
		B.Binding.get(node).dispose();

		expect(node.innerHTML).toBe(content);
	});
});
