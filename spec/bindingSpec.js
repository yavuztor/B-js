describe("binding test suite", function(){
    it("Should parse single binding with name correctly", function(){
        var result = B.Binding.parseString("test");
        expect(result[0][0]).toBe("test");
        expect(result[0][1]).toBe(null);
    });

    it("Should parse single binding with param correctly and return paramString trimmed.", function(){
        var result = B.Binding.parseString("test: 4 + 5");
        expect(result[0][0]).toBe("test");
        expect(result[0][1]).toBe("4 + 5");
    });

    it("Should parse two bindings without parameters correctly", function(){
        var result = B.Binding.parseString(" test1 , test2 ");
        expect(result[0][0]).toBe("test1");
        expect(result[1][0]).toBe("test2");
    });

    it("Should parse two bindings (first one with param, second without) correctly", function(){
        var result = B.Binding.parseString(" test1 : 1 + 2 , test2 ");
        expect(result[0][0]).toBe("test1");
        expect(result[0][1]).toBe("1 + 2");
        expect(result[1][0]).toBe("test2");
    });

    it("Should parse two bindings (first one with param, second without) correctly", function(){
        var result = B.Binding.parseString(" test1 , test2 : 1 + 2 ");
        expect(result[0][0]).toBe("test1");
        expect(result[1][0]).toBe("test2");
        expect(result[1][1]).toBe("1 + 2");
    });

    it("Should parse three bindings without parameters", function(){
        var result = B.Binding.parseString(" test1 , test2 , test3 ");
        expect(result[0][0]).toBe("test1");
        expect(result[1][0]).toBe("test2");
        expect(result[2][0]).toBe("test3");
    });

    it("parseParam should parse correctly for string with parentheses", function(){
        var testString ="(4)";
        var result = B.Binding.parseString("a:" + testString, 0);
        expect(result[0][1]).toBe(testString);

        testString = "() + () + [] + {[()]}";
        result = B.Binding.parseString("a:" + testString, 0);
        expect(result[0][1]).toBe(testString);

        testString = "() + () + [] + {['ali\\\'s ) stuff' + ()]}";
        result = B.Binding.parseString("a:" + testString, 0);
        expect(result[0][1]).toBe(testString);
    });

    it("parse returns a pair in array [binding class,  paramFunction]", function(){
        var element = {getAttribute: jasmine.createSpy('getAttribute').and.returnValue("test : $data")};
        var testBinder = function() { };
        B.Binding.register("test", testBinder);
        var result = B.Binding.parse(element);
        expect(element.getAttribute).toHaveBeenCalled();
        expect(result.length ).toBe(1);
        expect(result[0][0]).toBe(testBinder);
        expect(typeof result[0][1] ).toBe("function");
    });
});
