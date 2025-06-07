import QUnit from 'qunit';
import { LSystem, Rule, extractBrackets, spaces, pad } from '../lsystem.js';

QUnit.test("Rule constructor", function()
{
   var rule = new Rule("a", "B");
   QUnit.assert.ok(rule.predecessor === "a", "Predecessor not set correctly.");
   QUnit.assert.ok(rule.successor === "B", "Successor not set correctly.");
});

QUnit.test("L-System constructor", function()
{
   var ls = new LSystem();
   QUnit.assert.ok(ls !== null, "New L-system is null.");
   QUnit.assert.ok(ls.rules.length === 0, "Rules isn't an empty array.");
   QUnit.assert.ok(ls.axiom === "", "Axiom isn't an empty string.");
   QUnit.assert.ok(ls.string === "", "String isn't empty.");
});

QUnit.test("Get / set axiom", function()
{
   var ls = new LSystem();
   ls.setAxiom("a");
   QUnit.assert.ok(ls.axiom === "a", "Axiom not set.");
   QUnit.assert.ok(ls.string === "a", "String not set with axiom.");
});

QUnit.test("Append / get rules", function()
{
   var ls = new LSystem();
   var rule = new Rule("a", "B");
   ls.addRule(rule);
   QUnit.assert.ok(ls.rules[0] === rule, "Rules not set correctly.");
});

QUnit.test("extractBrackets", function()
{
   var string = "foofoo(bar)foo";
   var results = extractBrackets(string);

   QUnit.assert.deepEqual(results.processedString, "foofoofoo");
   QUnit.assert.deepEqual(results.contents, "bar");

   string = "F(i=0.1)";
   results = extractBrackets(string);

   QUnit.assert.deepEqual(results.processedString, "F");
   QUnit.assert.deepEqual(results.contents, "i=0.1");

   string = "F";
   results = extractBrackets(string);

   QUnit.assert.deepEqual(results.processedString, "F");
   QUnit.assert.deepEqual(results.contents, "");
});

QUnit.test("spaces", function()
{
   var string = spaces(0);
   QUnit.assert.deepEqual(string, "");

   string = spaces(1);
   QUnit.assert.deepEqual(string, " ");

   string = spaces(2);
   QUnit.assert.deepEqual(string, "  ");
});

QUnit.test("pad", function()
{
   var string = pad("test", 5);
   QUnit.assert.deepEqual(string, "test ");

   string = pad("tt", 2);
   QUnit.assert.deepEqual(string, "tt");

   string = pad("test", 1);
   QUnit.assert.deepEqual(string, "test");
});

QUnit.test("Simple Generate", function()
{
   var ls = new LSystem();
   var rule = new Rule("a", "B");
   ls.addRule(rule);
   ls.setAxiom("a");
   ls.step();

   QUnit.assert.deepEqual(ls.string, "B");
   ls.step();

   QUnit.assert.deepEqual(ls.string, "B");
});

QUnit.test("Multiple Application of One Rule", function()
{
   var ls = new LSystem();
   ls.setAxiom("aa")

   var rule = new Rule("a", "b");
   ls.addRule(rule);

   ls.step();

   QUnit.assert.deepEqual(ls.string, "bb");
});

QUnit.test("Multi-char Generate", function()
{
   var ls = new LSystem();
   ls.setAxiom("ab");

   var rule = new Rule("ab", "C");
   ls.addRule(rule);

   ls.step();

   QUnit.assert.deepEqual(ls.string, "C");
});

QUnit.test("Recursive Generate", function()
{
   var ls = new LSystem();
   ls.setAxiom("a");

   var rule = new Rule("a", "aB");
   ls.addRule(rule);

   ls.step();
   QUnit.assert.deepEqual(ls.string, "aB");

   ls.step();
   QUnit.assert.deepEqual(ls.string, "aBB");

   ls.step();
   QUnit.assert.deepEqual(ls.string, "aBBB");
});

QUnit.test("Simultaneous Rules", function()
{
   var ls = new LSystem();
   ls.setAxiom("aB");

   var rule = new Rule("a", "aC");
   ls.addRule(rule);

   rule = new Rule("aC", "CC");
   ls.addRule(rule);

   ls.step();
   QUnit.assert.deepEqual(ls.string, "aCB");
});

/* http://www.cgjennings.ca/toybox/lsystems/ */
QUnit.test("Internet Test 1", function()
{
   var ls = new LSystem();
   ls.setAxiom("Y");

   var rule = new Rule("Y", "XYX");
   ls.addRule(rule);

   ls.step();
   QUnit.assert.deepEqual(ls.string, "XYX");

   ls.step();
   QUnit.assert.deepEqual(ls.string, "XXYXX");

   ls.step();
   QUnit.assert.deepEqual(ls.string, "XXXYXXX");
});

QUnit.test("Internet Test 2", function()
{
   var ls = new LSystem();
   ls.setAxiom("B");

   var rule = new Rule("A", "AB");
   ls.addRule(rule);

   rule = new Rule("B", "A");
   ls.addRule(rule);

   ls.step();
   QUnit.assert.deepEqual(ls.string, "A");

   ls.step();
   QUnit.assert.deepEqual(ls.string, "AB");

   ls.step();
   QUnit.assert.deepEqual(ls.string, "ABA");

   ls.step();
   QUnit.assert.deepEqual(ls.string, "ABAAB");

   ls.step();
   QUnit.assert.deepEqual(ls.string, "ABAABABA");
});

QUnit.test("Attribute Rule", function()
{
   var rule = new Rule("F(i=0.1)", "F(i=0.2)");

   QUnit.assert.deepEqual(rule.predecessor, "F");
   QUnit.assert.deepEqual(rule.conditional, "i=0.1");
});

QUnit.test("Attribute Arithmetic Rule", function()
{
   var rule = new Rule("F(i=0.1)", "F(i+0.2)");

   QUnit.assert.deepEqual(rule.predecessor, "F");
   QUnit.assert.deepEqual(rule.conditional, "i=0.1");

   QUnit.assert.deepEqual(rule.successor, "F");
   QUnit.assert.deepEqual(rule.attributeArithmetic, "i+0.2");
});

QUnit.test("Attribute Test", function()
{
   var ls = new LSystem();
   ls.setAxiom("F(i=0.1)");

   var rule = new Rule("F(i=0.1)", "F(i=0.2)");
   ls.addRule(rule);

   ls.step();
   QUnit.assert.deepEqual(ls.string, "F(i=0.2)");

   ls.step();
   QUnit.assert.deepEqual(ls.string, "F(i=0.2)");
});

QUnit.test("Attribute GT Test", function()
{
   var ls = new LSystem();
   ls.setAxiom("F(i=0.1)");

   var rule = new Rule("F(i>0)", "F(i=0.2)");
   ls.addRule(rule);

   ls.step();
   QUnit.assert.deepEqual(ls.string, "F(i=0.2)");
});

QUnit.test("Conditional Add Test", function()
{
   var ls = new LSystem();
   ls.setAxiom("F(i=0.1)");

   var rule = new Rule("F(i>0)", "F(i+0.1)");
   ls.addRule(rule);

   ls.step();
   QUnit.assert.deepEqual(ls.string, "F(i=0.2)");
});

