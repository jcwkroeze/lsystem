/*
lsystem.js --- Basic L-System parser in JavaScript.

Copyright (C) 2014 Jan CW Kroeze 

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

function LSystem()
{
   this.axiom = "";
   this.string = "";
   this.rules = [];
}

LSystem.prototype.setAxiom = function(axiom)
{
   this.axiom = axiom;
   this.string = axiom;
}

LSystem.prototype.addRule = function(rule)
{
   this.rules.push(rule);
}

LSystem.prototype.step = function()
{
   var string = this.string;
   var newString = this.string;

   $.each(this.rules, function(idx, rule)
   {
      var last_pos = 0;
      var pos = string.slice(last_pos).search(rule.predecessor);

      while (pos !== -1)
      {
         var match_length = rule.predecessor.length;
         var match = rule.predecessor;
         var matched = true;
         var attribute = "";
         var successor = rule.successor;
         if (string.charAt(pos + match_length) == "(")
         {
            var rbracket = string.slice(pos).search(/\)/);
            var token = string.substr(pos, rbracket + 1);

            var parts = extractBrackets(token);
            match = parts.string;
            attribute = parts.contents;
            match_length = rbracket - pos + 1;

            matched = matchAttributeConditional(attribute, rule.conditional);
            successor = rule.successor + "(" + applyAttributeArithmetic(attribute, rule) + ")";
         }

         if (matched === true)
         {
            var place_holder;
            if (rule.predecessor.length > successor.length)
            {
               place_holder = spaces(rule.predecessor.length);
            }
            else
            {
               place_holder = spaces(successor.length);
            }

            if (rule.predecessor.length > successor.length)
            {
               successor = pad(successor, rule.predecessor.length);
            }

            string = string.slice(0, pos) + 
               place_holder + 
               string.slice(pos + match_length, string.length);

            newString = newString.slice(0, pos) +
               successor + 
               newString.slice(pos + match_length, string.length);

            newString = newString.trim().replace(" ", "");
         }

         last_pos = pos + match_length;
         pos = string.slice(last_pos).search(rule.predecessor);

         if (pos != -1)
         {
            pos += last_pos;
         }
      }
   });

   this.string = newString.trim().replace(" ", "");
}

/**
 * A rule consists of several parts. Most important is the successor and the
 * predecessor. The former describes the sequence of characters that triggers
 * this rule, the latter describes the sequence of characters that it is 
 * replaced with.
 *
 * Next is the conditional, this is an optional attribute placed after the
 * predecessor to indicate a range of acceptable values for some attribute.
 * If an input matches both the predecessor and the conditional, the rule is
 * triggered.
 */
function Rule(predecessor, successor)
{
   var predecessorParts = extractBrackets(predecessor);

   this.predecessor = predecessorParts.string;
   this.conditional = predecessorParts.contents;

   var successorParts = extractBrackets(successor);

   this.successor = successorParts.string;
   this.attributeArithmetic = successorParts.contents;
}

function applyAttributeArithmetic(attribute, rule)
{
   var type = "=";
   var aaParts = rule.attributeArithmetic.split(type);
   if (aaParts.length < 2)
   {
      type = "+";
      aaParts = rule.attributeArithmetic.split(type);
   }

   var name = aaParts[0];
   var value = aaParts[1];

   var attributeValue = attribute.split("=")[1];

   if (type === "=")
   {  
      return name + "=" + value;
   }
   else if (type === "+")
   {
      var newValue = parseFloat(attributeValue) + parseFloat(value);
      return name + "=" + newValue;
   }
}

function matchAttributeConditional(attribute, conditional)
{
   var attributeParts = attribute.split("=");
   var attributeName = attributeParts[0];
   var attributeValue = attributeParts[1];

   var conditionalType = ">";
   var conditionalParts = conditional.split(conditionalType);
   if (conditionalParts.length < 2)
   {
      conditionalType = "=";
      conditionalParts = conditional.split(conditionalType);
   }

   var conditionalName = conditionalParts[0];
   var conditionalValue = conditionalParts[1];

   if (attributeName !== conditionalName)
   {
      return false;
   }
   else
   {
      attributeValue = parseFloat(attributeValue);
      conditionalValue = parseFloat(conditionalValue);
      if (conditionalType === ">")
      {
         return attributeValue > conditionalValue
      }
      else if (conditionalType === "=")
      {
         return attributeValue === conditionalValue;
      }
   }
}

/**
 * Removes brackets from a string and returns the altered string. Also returns
 * the contents of the brackets in a parameter.
 *
 * @param string A string.
 * @return An object with two attributes, 'string' and 'contents'. The former
 *    contains the altered string, the latter the contents of the brackets.
 */
function extractBrackets(string)
{
   function Result()
   {
      this.string = "";
      this.contents = "";
   }
   var result = new Result();

   var pos = string.search(/\(/);
   if (pos !== -1)
   {
      var rpos = string.search(/\)/);

      result.string = string.slice(0, pos) + string.slice(rpos + 1, string.length);
      result.contents = string.slice(pos + 1, rpos);
   }
   else
   {
      result.string = string;
      result.contents = "";
   }

   return result;
}

/**
 * Creates a string containing the specified amount of spaces.
 *
 * @param count A positive integer.
 */
function spaces(count)
{
   var r = "";
   for (var i = 0; i < count; i++)
   {
      r += " ";
   }
   return r;
}

/**
 * Pads a string with spaces so it has a certain length.
 *
 * @param str A string.
 * @param count A positive integer.
 */
function pad(str, count)
{
   var padding = count - str.length;
   var r = str;
   for (var i = 0; i < padding; i++)
   {
      r += " ";
   }
   return r;
}

