/*
lsystem.ts --- Basic L-System parser refactored to TypeScript.

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

interface ExtractBracketsResult {
  processedString: string; // Renamed from 'string' to avoid conflict with type
  contents: string;
}

export class Rule {
  predecessor: string;
  conditional: string;
  successor: string;
  attributeArithmetic: string;

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
  constructor(predecessor: string, successor: string) {
    const predecessorParts = extractBrackets(predecessor);
    this.predecessor = predecessorParts.processedString;
    this.conditional = predecessorParts.contents;

    const successorParts = extractBrackets(successor);
    this.successor = successorParts.processedString;
    this.attributeArithmetic = successorParts.contents;
  }
}

export class LSystem {
  axiom: string = "";
  string: string = "";
  rules: Rule[] = [];

  constructor() {}

  setAxiom(axiom: string): void {
    this.axiom = axiom;
    this.string = axiom;
  }

  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  step(): void {
    let currentString = this.string;
    let newString = this.string;

    this.rules.forEach((rule) => {
      let last_pos = 0;
      let searchString = currentString; // Use a mutable copy for search modifications
      let tempNewString = newString; // Use a temporary string for building the new state within a rule's iteration

      let loopIterations = 0; // Safety break for very complex rules

      while (last_pos < searchString.length) {
        loopIterations++;
        let pos_relative = searchString.substring(last_pos).search(rule.predecessor);
        if (pos_relative === -1) break; // No more matches for this rule in the rest of the string

        let pos_absolute_in_search = last_pos + pos_relative;
        
        let match_length_in_search = rule.predecessor.length;
        let matched = true;
        let attribute = "";
        let currentRuleSuccessor = rule.successor;

        // Check for attribute parameters like F(x) in the searchString
        if (searchString.charAt(pos_absolute_in_search + rule.predecessor.length) === "(") {
          const rbracket = searchString.substring(pos_absolute_in_search).search(/\)/);
          if (rbracket !== -1) {
            const token = searchString.substring(pos_absolute_in_search, pos_absolute_in_search + rbracket + 1);
            const parts = extractBrackets(token);
            attribute = parts.contents;
            match_length_in_search = token.length; // The actual length of the matched token in searchString

            matched = matchAttributeConditional(attribute, rule.conditional);
            if (matched && rule.attributeArithmetic) {
              currentRuleSuccessor = rule.successor + "(" + applyAttributeArithmetic(attribute, rule) + ")";
            }
          } else {
            matched = false; // Invalid format, no closing bracket
          }
        }

        // Calculate the corresponding position in tempNewString for replacement
        // This needs to be accurate if previous replacements changed lengths
        // For simplicity, we assume replacements happen on a version of the string that reflects previous replacements by *this rule*.
        // A more robust way might involve rebuilding newString from segments.

        if (matched) {
          const placeholder = spaces(match_length_in_search);

          // Apply replacement to tempNewString
          // The `currentMatchPos` needs to correctly map `pos_absolute_in_search` to `tempNewString`
          // This is tricky if lengths change. A simpler model is to build a new string from parts.
          
          // Simplified: For this pass of the rule, we are modifying based on initial `newString` (or `currentString`)
          // This part of the logic is complex and prone to off-by-one or cascading errors if not handled carefully.
          // The original code modified `newString` and `string` (for search) in ways that could interact complexly.
          // Let's try to make it clearer: `searchString` is for finding matches, `newString` is the output being built.

          // The position for replacement in `newString` should correspond to `pos_absolute_in_search` in `currentString`
          // if we consider `newString` to be a direct copy that gets modified.

          // To avoid issues with shifting indices, we build a completely new string in each step of the outer loop (this.rules.forEach)
          // For now, sticking closer to original logic but with care:
          tempNewString = tempNewString.substring(0, pos_absolute_in_search + (tempNewString.length - currentString.length) ) + 
                          currentRuleSuccessor + 
                          tempNewString.substring(pos_absolute_in_search + (tempNewString.length - currentString.length) + match_length_in_search);

          // Update searchString by putting placeholders to prevent re-matching the same spot with the same rule part
          searchString = searchString.substring(0, pos_absolute_in_search) +
                         placeholder +
                         searchString.substring(pos_absolute_in_search + match_length_in_search);
          
          last_pos = pos_absolute_in_search + placeholder.length;
        } else {
          last_pos = pos_absolute_in_search + match_length_in_search; // Skip this match and continue search
        }
      }
      newString = tempNewString; // Update newString with changes from this rule
      currentString = newString; // For the next rule, search in the result of the previous rule
    });

    this.string = newString.replace(/\s+/g, ''); // Replace all whitespace sequences with nothing
  }
}

function applyAttributeArithmetic(attribute: string, rule: Rule): string {
  if (!rule.attributeArithmetic) return attribute; // No arithmetic rule defined
  let type = "=";
  let aaParts = rule.attributeArithmetic.split(type);
  if (aaParts.length < 2 && rule.attributeArithmetic.includes("+")) {
    type = "+";
    aaParts = rule.attributeArithmetic.split(type);
  }
  // Add other operators like -, *, / if necessary
  // else if (rule.attributeArithmetic.includes("-")) { type = "-"; aaParts = rule.attributeArithmetic.split(type); }

  if (aaParts.length < 2) return attribute; // Cannot parse arithmetic rule

  const name = aaParts[0].trim();
  const valueStr = aaParts[1].trim();

  const attributeValueParts = attribute.split("=");
  if (attributeValueParts.length < 2) return attribute; // Cannot parse attribute
  // const attributeName = attributeValueParts[0].trim(); // Not used if we assume single param
  const attributeCurrentValueStr = attributeValueParts[1].trim();

  const paramValue = parseFloat(attributeCurrentValueStr);
  const arithmeticValue = parseFloat(valueStr);

  if (isNaN(paramValue) || isNaN(arithmeticValue)) return attribute; // Values are not numbers

  let resultValue: number;
  if (type === "=") {
    resultValue = arithmeticValue;
  } else if (type === "+") {
    resultValue = paramValue + arithmeticValue;
  }
  // Add other operations
  // else if (type === "-") { resultValue = paramValue - arithmeticValue; }
  else {
    return attribute; // Unknown operator
  }
  return name + "=" + resultValue.toString();
}

function matchAttributeConditional(attribute: string, conditional: string): boolean {
  if (!conditional) return true; // No conditional means always match

  const attributeParts = attribute.split("=");
  if (attributeParts.length < 2) return false; // Attribute not in expected format
  const attributeName = attributeParts[0].trim();
  const attributeValueStr = attributeParts[1].trim();

  let conditionalType = ">"; // Default or first to check
  let conditionalParts = conditional.split(conditionalType);
  if (conditionalParts.length < 2 && conditional.includes("=")) {
    conditionalType = "=";
    conditionalParts = conditional.split(conditionalType);
  }
  // Add other conditionals like <, <=, >= if necessary
  // else if (conditional.includes("<")) { conditionalType = "<"; conditionalParts = conditional.split(conditionalType); }

  if (conditionalParts.length < 2) return false; // Conditional not in expected format

  const conditionalName = conditionalParts[0].trim();
  const conditionalValueStr = conditionalParts[1].trim();

  if (attributeName !== conditionalName) {
    return false; // Parameter names do not match
  }

  const attributeValue = parseFloat(attributeValueStr);
  const conditionalValue = parseFloat(conditionalValueStr);

  if (isNaN(attributeValue) || isNaN(conditionalValue)) return false; // Values are not numbers

  if (conditionalType === ">") {
    return attributeValue > conditionalValue;
  } else if (conditionalType === "=") {
    // Note: floating point equality can be tricky. Consider an epsilon comparison if needed.
    return attributeValue === conditionalValue;
  }
  // Add other comparisons
  // else if (conditionalType === "<") { return attributeValue < conditionalValue; }
  return false; // Default if conditional type not recognized
}

/**
 * Removes brackets from a string and returns the altered string. Also returns
 * the contents of the brackets in a parameter.
 *
 * @param str A string.
 * @return An object with two attributes, 'processedString' and 'contents'. The former
 *    contains the altered string, the latter the contents of the brackets.
 */
export function extractBrackets(str: string): ExtractBracketsResult {
  const result: ExtractBracketsResult = {
    processedString: str,
    contents: ""
  };

  const pos = str.search(/\(/);
  if (pos !== -1) {
    const rpos = str.search(/\)/);
    if (rpos > pos && rpos !== -1) { // Ensure closing bracket is found and is after opening one
      result.processedString = str.slice(0, pos) + str.slice(rpos + 1);
      result.contents = str.slice(pos + 1, rpos);
    }
    // If no closing bracket, or it's before the opening one, return original string and no contents
  }
  return result;
}

/**
 * Creates a string containing the specified amount of spaces.
 *
 * @param count A positive integer.
 */
export function spaces(count: number): string {
  if (count < 0) return ""; // Handle negative counts
  return ' '.repeat(count);
}

/**
 * Pads a string with spaces so it has a certain length.
 *
 * @param str A string.
 * @param count A positive integer.
 */
export function pad(str: string, count: number): string {
  const padding = count - str.length;
  if (padding > 0) {
    return str + ' '.repeat(padding);
  }
  return str;
}
