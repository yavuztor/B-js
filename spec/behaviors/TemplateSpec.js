describe("template behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
		document.body.appendChild(node);
	});
	afterEach(function(){
		document.body.removeChild(node);
	});
	it("applies given data parameter to the template obtained from name parameter, when name is template string", function(){
		node.setAttribute(B.Binding.ATTR, "template: {name: '<b data-binding=\"text: $data\"></b>', data: $data()}");
		var o = B.observable("test");
		B.bindData(o, node);

		expect(node.children.length).toBe(1);
		expect(node.firstChild.textContent).toBe("test");

		o("another");
		expect(node.firstChild.textContent).toBe("another");

		o(null);
		expect(node.children.length).toBe(0);
	});

	it("applies template when name is a reference to a script or template element", function(){
		node.innerHTML='<script id="tpl1" type="text/template"><b data-binding="text: $data"></b></script>\
						<div data-binding="template: {name: \'#tpl1\', data: $data()}"></div>';
		var o = B.observable("test");
		B.bindData(o, node);

		expect(node.lastChild.children.length).toBe(1);
		expect(node.lastChild.firstChild.textContent).toBe("test");

		o("another");
		expect(node.lastChild.firstChild.textContent).toBe("another");

		o(null);
		expect(node.lastChild.children.length).toBe(0);
	});

});
