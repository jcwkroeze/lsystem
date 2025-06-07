test("Rule constructor", function()
{
   var rule = new Rule("a", "B");
   ok(rule.predecessor === "a", "Predecessor not set correctly.");
   ok(rule.successor === "B", "Successor not set correctly.");
});

test("L-System constructor", function()
{
   var ls = new LSystem();
   ok(ls !== null, "New L-system is null.");
   ok(ls.rules.length === 0, "Rules isn't an empty array.");
   ok(ls.axiom === "", "Axiom isn't an empty string.");
   ok(ls.string === "", "String isn't empty.");
});

test("Get / set axiom", function()
{
   var ls = new LSystem();
   ls.setAxiom("a");
   ok(ls.axiom === "a", "Axiom not set.");
   ok(ls.string === "a", "String not set with axiom.");
});

test("Append / get rules", function()
{
   var ls = new LSystem();
   var rule = new Rule("a", "B");
   ls.addRule(rule);
   ok(ls.rules[0] === rule, "Rules not set correctly.");
});

test("extractBrackets", function()
{
   var string = "foofoo(bar)foo";
   var results = extractBrackets(string);

   deepEqual(results.string, "foofoofoo");
   deepEqual(results.contents, "bar");

   string = "F(i=0.1)";
   results = extractBrackets(string);

   deepEqual(results.string, "F");
   deepEqual(results.contents, "i=0.1");

   string = "F";
   results = extractBrackets(string);

   deepEqual(results.string, "F");
   deepEqual(results.contents, "");
});

test("spaces", function()
{
   var string = spaces(0);
   deepEqual(string, "");

   string = spaces(1);
   deepEqual(string, " ");

   string = spaces(2);
   deepEqual(string, "  ");
});

test("pad", function()
{
   var string = pad("test", 5);
   deepEqual(string, "test ");

   string = pad("tt", 2);
   deepEqual(string, "tt");

   string = pad("test", 1);
   deepEqual(string, "test");
});

test("Simple Generate", function()
{
   var ls = new LSystem();
   var rule = new Rule("a", "B");
   ls.addRule(rule);
   ls.setAxiom("a");
   ls.step();

   deepEqual(ls.string, "B");
   ls.step();

   deepEqual(ls.string, "B");
});

test("Multiple Application of One Rule", function()
{
   var ls = new LSystem();
   ls.setAxiom("aa")

   var rule = new Rule("a", "b");
   ls.addRule(rule);

   ls.step();

   deepEqual(ls.string, "bb");
});

test("Multi-char Generate", function()
{
   var ls = new LSystem();
   ls.setAxiom("ab");

   var rule = new Rule("ab", "C");
   ls.addRule(rule);

   ls.step();

   deepEqual(ls.string, "C");
});

test("Recursive Generate", function()
{
   var ls = new LSystem();
   ls.setAxiom("a");

   var rule = new Rule("a", "aB");
   ls.addRule(rule);

   ls.step();
   deepEqual(ls.string, "aB");

   ls.step();
   deepEqual(ls.string, "aBB");

   ls.step();
   deepEqual(ls.string, "aBBB");
});

test("Simultaneous Rules", function()
{
   var ls = new LSystem();
   ls.setAxiom("aB");

   var rule = new Rule("a", "aC");
   ls.addRule(rule);

   rule = new Rule("aC", "CC");
   ls.addRule(rule);

   ls.step();
   deepEqual(ls.string, "aCB");
});

/* http://www.cgjennings.ca/toybox/lsystems/ */
test("Internet Test 1", function()
{
   var ls = new LSystem();
   ls.setAxiom("Y");

   var rule = new Rule("Y", "XYX");
   ls.addRule(rule);

   ls.step();
   deepEqual(ls.string, "XYX");

   ls.step();
   deepEqual(ls.string, "XXYXX");

   ls.step();
   deepEqual(ls.string, "XXXYXXX");
});

test("Internet Test 2", function()
{
   var ls = new LSystem();
   ls.setAxiom("B");

   var rule = new Rule("A", "AB");
   ls.addRule(rule);

   rule = new Rule("B", "A");
   ls.addRule(rule);

   ls.step();
   deepEqual(ls.string, "A");

   ls.step();
   deepEqual(ls.string, "AB");

   ls.step();
   deepEqual(ls.string, "ABA");

   ls.step();
   deepEqual(ls.string, "ABAAB");

   ls.step();
   deepEqual(ls.string, "ABAABABA");
});

test("Attribute Rule", function()
{
   var rule = new Rule("F(i=0.1)", "F(i=0.2)");

   deepEqual(rule.predecessor, "F");
   deepEqual(rule.conditional, "i=0.1");
});

test("Attribute Arithmetic Rule", function()
{
   var rule = new Rule("F(i=0.1)", "F(i+0.2)");

   deepEqual(rule.predecessor, "F");
   deepEqual(rule.conditional, "i=0.1");

   deepEqual(rule.successor, "F");
   deepEqual(rule.attributeArithmetic, "i+0.2");
});

test("Attribute Test", function()
{
   var ls = new LSystem();
   ls.setAxiom("F(i=0.1)");

   var rule = new Rule("F(i=0.1)", "F(i=0.2)");
   ls.addRule(rule);

   ls.step();
   deepEqual(ls.string, "F(i=0.2)");

   ls.step();
   deepEqual(ls.string, "F(i=0.2)");
});

test("Attribute GT Test", function()
{
   var ls = new LSystem();
   ls.setAxiom("F(i=0.1)");

   var rule = new Rule("F(i>0)", "F(i=0.2)");
   ls.addRule(rule);

   ls.step();
   deepEqual(ls.string, "F(i=0.2)");
});

test("Conditional Add Test", function()
{
   var ls = new LSystem();
   ls.setAxiom("F(i=0.1)");

   var rule = new Rule("F(i>0)", "F(i+0.1)");
   ls.addRule(rule);

   ls.step();
   deepEqual(ls.string, "F(i=0.2)");
});

