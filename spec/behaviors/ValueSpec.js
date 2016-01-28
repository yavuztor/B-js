describe("value behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("INPUT");
		document.body.appendChild(node);
	});
	afterEach(function(){
		document.body.removeChild(node);
	})

	it("sets element value from a non-observable parameter", function(){
		node.setAttribute(B.Binding.ATTR, "value: 'test'");
		B.bindData("", node);

		expect(node.value).toBe("test");
	});

	it("sets and updates element value from observable parameter", function(){
		node.setAttribute(B.Binding.ATTR, "value: $data");
		var o = B.observable("test");
		B.bindData(o, node);

		expect(node.value).toBe("test");

		o("another");
		expect(node.value).toBe("another");
	});

	it("feeds back the value change from element to the parameter, when it is observable", function(){
		node.setAttribute(B.Binding.ATTR, "value: $data");
		var o = B.observable("test");
		B.bindData(o, node);
		node.value = "another";
		var changeEvent = document.createEvent("HTMLEvents");
		changeEvent.initEvent("change", false, false);
		node.dispatchEvent(changeEvent);

		expect(o()).toBe("another");
	})
});
