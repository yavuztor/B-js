describe("component behavior suite", function(){
	function TestComp() {
		this.attachCalls = 0;
		this.detachCalls = 0;
		this.disposeCalls = 0;
		this.attach = function(element, context) {
			this.attachCalls += 1;
			this.element = element;
			this.data = context.$data;
		}
		this.detach = function() {
			this.detachCalls += 1;
			this.data = null;
			this.element = null;
		}
		this.dispose = function() {
			this.disposeCalls += 1;
		}
	}
	var node;
	beforeEach(function(){
		node = document.createElement("DIV");
	});

	it("creates and disposes component when the component constructor is given as parameter", function(){
		node.setAttribute(B.Binding.ATTR, "component: $data");
		B.bindData(TestComp, node);
		var comp = B.Binding.get(node).getbehavior("component").component;

		expect(comp.attachCalls).toBe(1);
		expect(comp.detachCalls).toBe(0);
		expect(comp.disposeCalls).toBe(0);

		B.Binding.get(node).dispose();
		expect(comp.attachCalls).toBe(1);
		expect(comp.detachCalls).toBe(1);
		expect(comp.disposeCalls).toBe(1);

	});

	it("does not create/dispose component when the component object is given as parameter", function(){
		node.setAttribute(B.Binding.ATTR, "component: $data");
		var comp = new TestComp();
		comp.customInstance = true;

		expect(comp.attachCalls).toBe(0);
		expect(comp.detachCalls).toBe(0);
		expect(comp.disposeCalls).toBe(0);

		B.bindData(comp, node);

		expect(comp.customInstance).toBe(true);
		expect(comp.attachCalls).toBe(1);
		expect(comp.detachCalls).toBe(0);
		expect(comp.disposeCalls).toBe(0);

		B.Binding.get(node).dispose();

		expect(comp.customInstance).toBe(true);
		expect(comp.attachCalls).toBe(1);
		expect(comp.detachCalls).toBe(1);
		expect(comp.disposeCalls).toBe(0);

	});

	it("updates accordingly when the component object is supplied with an observable and its value changes", function(){
		node.setAttribute(B.Binding.ATTR, "component: $data()");
		var comp1 = new TestComp();
		var comp2 = new TestComp();
		var o = B.observable(comp1);
		B.bindData(o, node);

		expect(comp1.attachCalls).toBe(1);
		expect(comp1.detachCalls).toBe(0);

		o(comp2);

		expect(comp1.attachCalls).toBe(1);
		expect(comp1.detachCalls).toBe(1);
		expect(comp2.attachCalls).toBe(1);
		expect(comp2.detachCalls).toBe(0);

		o(comp1);

		expect(comp1.attachCalls).toBe(2);
		expect(comp1.detachCalls).toBe(1);
		expect(comp2.attachCalls).toBe(1);
		expect(comp2.detachCalls).toBe(1);
	});

	it("sets component parameters using comprop behavior", function(){
		var comp1 = new TestComp();
		comp1.f1 = B.observable("f1");
		comp1.f2 = "f2";
		var data = {
			comp: comp1,
			o: B.observable("observable")
		};

		node.setAttribute(B.Binding.ATTR, "component: $data.comp, comprop: {f1: $data.o(), f2: $data.o() + '!'}")
		B.bindData(data, node);

		expect(comp1.f1()).toBe("observable");
		expect(comp1.f2).toBe("observable!");

		data.o("test");

		expect(comp1.f1()).toBe("test");
		expect(comp1.f2).toBe("test!");
	});
});
