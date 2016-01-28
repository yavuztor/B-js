describe("click behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
	});

	it("calls given callback with the $data and event parameters", function(){
		node.setAttribute(B.Binding.ATTR, "click: $data.handleClick");
		//var clickEvent = new MouseEvent("click", {view: window, bubbles: true, cancelable: true});
		var handlerCalled = false;
		var model = {
			handleClick: function(obj, event) {
				handlerCalled = true;
				expect(obj).toBe(model);
				expect(event instanceof MouseEvent).toBe(true);
			}
		};
		B.bindData(model, node);
		//node.dispatchEvent(clickEvent);
		node.click();

		expect(handlerCalled).toBe(true);
	})
})
