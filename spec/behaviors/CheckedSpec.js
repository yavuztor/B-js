describe("checked behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("INPUT");
		node.setAttribute("type", "checkbox");
		document.body.appendChild(node);
	});

	afterEach(function(){
		document.body.removeChild(node);
	})

	it("sets checked value of a checkbox with given non-observable value", function(){
		node.setAttribute(B.Binding.ATTR, "checked: true");
		B.bindData({}, node);

		expect(node.checked).toBe(true);
	});

	it("updates the checked value when the given observable changes", function(){
		node.setAttribute(B.Binding.ATTR, "checked: $data");
		var o = B.observable(true);
		B.bindData(o, node);

		expect(node.checked).toBe(true);
		o(false);
		expect(node.checked).toBe(false);
		o(true);
		expect(node.checked).toBe(true);
	});

	it("feeds back the checked status to the observable parameter", function(){
		node.setAttribute(B.Binding.ATTR, "checked: $data");
		var o = B.observable(true);
		B.bindData(o, node);

		expect(o()).toBe(true);
		//node.dispatchEvent(new MouseEvent("click", {view: window, bubbles: true, cancelable: true}));
		node.click();
		expect(node.checked).toBe(false);
		expect(o()).toBe(false);
	})
})
