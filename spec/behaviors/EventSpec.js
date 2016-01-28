describe("event behavior suite", function(){
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
	});

	it("registers events from parameter, where each key defines event type and value defines the handler that will be called with ($data, event)", function(){
		node.setAttribute(B.Binding.ATTR, "event: {click: $data.handleClick}");
		var handlerCalled= false;
		//var clickEvent = new MouseEvent("click", {view:window, bubbles:true, cancelable:true});
		var data = {
			handleClick: function(m, evt) {
				handlerCalled = true;
				expect(m).toBe(data);
				expect(evt instanceof MouseEvent).toBe(true);
			}
		};
		B.bindData(data, node);
		//node.dispatchEvent(clickEvent);
		node.click();

		expect(handlerCalled).toBe(true);
	});
});
