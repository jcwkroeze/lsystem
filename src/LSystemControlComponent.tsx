import React from 'react';

import { Rule } from './LSystem';

export interface LSystemControlsProps {
    axiom: string;
    rules: Rule[];
    angle: number;
    stepCount: number;
    onAxiomChange: (axiom: string) => void;
    onRulesChange: (rules: Rule[]) => void;
    onAngleChange: (angle: number) => void;
    onStepCountChange: (stepCount: number) => void;
    onSubmit: () => void;
}

export class LSystemControlComponent extends React.Component<LSystemControlsProps> {
    render() {
        const {
            axiom,
            rules,
            angle,
            stepCount,
            onAxiomChange,
            onRulesChange,
            onAngleChange,
            onStepCountChange,
            onSubmit
        } = this.props;

        return (
            <div id="controls">
                <h1>L-System Configuration</h1>
                <div className="form">
                    <label htmlFor="axiom">Axiom</label>
                    <input
                        type="text"
                        id="axiom"
                        value={axiom}
                        onChange={(e) => onAxiomChange(e.target.value)}
                    />

                    <label htmlFor="rules">Rules</label>
                    <textarea
                        id="rules"
                        value={this.rulesToString(rules)}
                        placeholder="Enter rules in the format: predecessor => successor, one per line"
                        onChange={(e) => onRulesChange(
                            this.stringToRules(e.target.value)
                        )}
                        rows={3}
                    />

                    <label htmlFor="angle">Angle</label>
                    <input
                        type="number"
                        id="angle"
                        value={angle}
                        onChange={(e) => onAngleChange(Number(e.target.value))}
                    />

                    <label htmlFor="stepCount">Iterations</label>
                    <input
                        type="number"
                        id="stepCount"
                        value={stepCount}
                        min="0"
                        max="10" // Sensible max to prevent browser freezing
                        onChange={(e) => onStepCountChange(Number(e.target.value))}
                    />
                </div>
                <button onClick={onSubmit}>Apply Configuration</button>
            </div>
        );
    }

    private rulesToString(rules: Rule[]): string {
        return rules.map(rule => `${rule.predecessor} => ${rule.successor}`).join("\n");
    }

    private stringToRules(rulesString: string): Rule[] {
        return rulesString.split("\n").map(r => {
            const components = r.split("=>");
            return new Rule(components[0].trim(), components[1].trim());
        });
    }
}
