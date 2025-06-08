interface ExtractBracketsResult {
    processedString: string;
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

    equal(rhs: Rule) {
        return (
            (this.predecessor === rhs.predecessor) &&
            (this.conditional === rhs.conditional) &&
            (this.successor === rhs.successor) &&
            (this.attributeArithmetic === rhs.attributeArithmetic)
        );
    }
}

export interface LSystemState {
    angle: number;
    axiom: string;
    rules: Rule[];
    stepCount: number;
}

export class LSystem {
    public results: string[];

    constructor(
        public axiom = "F",
        public rules = [new Rule("F", "F[+F]F[-F]F[/F]F[*F]")],
        public angle = 15,
    ) {
        this.results = [this.axiom];
        this.step();
        this.step();
        this.step();
    }

    get result(): string {
        return this.results.at(-1) || "";
    }

    get stepCount(): number {
        return this.results.length - 1;
    }

    setState(newState: LSystemState): void {
        let recomputeNeeded = false;

        recomputeNeeded = recomputeNeeded || (this.angle !== newState.angle);
        this.angle = newState.angle;

        recomputeNeeded = recomputeNeeded || (this.axiom !== newState.axiom);
        this.axiom = newState.axiom;

        if (!recomputeNeeded) {
            if (this.rules.length !== newState.rules.length) {
                recomputeNeeded = true;
            } else {
                for (let i = 0; i < this.rules.length; i++) {
                    const a = this.rules[i];
                    const b = newState.rules[i];

                    recomputeNeeded = recomputeNeeded || (!a.equal(b));

                    if (recomputeNeeded)
                        break;
                }
            }
        }
        this.rules = newState.rules;

        if (!recomputeNeeded && (this.stepCount !== newState.stepCount)) {
            const delta = newState.stepCount - this.stepCount;

            for (let i = 0; i < delta; i++) {
                this.step();
            }

            this.results.length = newState.stepCount + 1;
        }

        if (recomputeNeeded) {
            this.results.length = 0;

            this.results.push(this.axiom);

            for (let i = 0; i < newState.stepCount; i++) {
                this.step();
            }
        }
    }

    step(): void {
        var string = this.result;
        var newString = this.result;

        for (const rule of this.rules) {
            var last_pos = 0;
            var pos = string.slice(last_pos).search(rule.predecessor);

            while (pos !== -1) {
                var match_length = rule.predecessor.length;
                var match = rule.predecessor;
                var matched = true;
                var attribute = "";
                var successor = rule.successor;
                if (string.charAt(pos + match_length) == "(") {
                    var rbracket = string.slice(pos).search(/\)/);
                    var token = string.substr(pos, rbracket + 1);

                    var parts = extractBrackets(token);
                    match = parts.processedString;
                    attribute = parts.contents;
                    match_length = rbracket - pos + 1;

                    matched = matchAttributeConditional(attribute, rule.conditional);
                    successor = rule.successor + "(" + applyAttributeArithmetic(attribute, rule) + ")";
                }

                if (matched === true) {
                    var place_holder;
                    if (rule.predecessor.length > successor.length) {
                        place_holder = spaces(rule.predecessor.length);
                    }
                    else {
                        place_holder = spaces(successor.length);
                    }

                    if (rule.predecessor.length > successor.length) {
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

                if (pos != -1) {
                    pos += last_pos;
                }
            }
        };

        this.results.push(newString.trim().replace(" ", ""));
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
