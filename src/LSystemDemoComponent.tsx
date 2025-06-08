import React from 'react';

import { LSystem, Rule } from './LSystem';
import { Renderer } from './Renderer';

import { LSystemControlComponent } from './LSystemControlComponent';

export interface LSystemDemoState {
    angle: number;
    axiom: string;
    rules: string;
    stepCount: number;
    result: string;
}

export class LSystemDemoComponent
extends React.Component<
    {},
    LSystemDemoState
> {
    private renderer: Renderer | null = null;
    private lSystem: LSystem;

    constructor(props: {}) {
        super(props);
        this.lSystem = new LSystem();
        this.state = {
            angle: this.lSystem.angle,
            axiom: this.lSystem.axiom,
            rules: this.rulesToString(this.lSystem.rules),
            stepCount: this.lSystem.stepCount,
            result: this.lSystem.result,
        }
    }

    componentDidMount(): void {
        this.renderer = new Renderer(this.lSystem);
    }

    updateLSystem = () => {
        this.lSystem.setState({
            axiom: this.state.axiom,
            angle: this.state.angle,
            stepCount: this.state.stepCount,
            rules: this.stringToRules(this.state.rules),
        });
        // TODO(jan): Move to thread.
        this.setState({result: this.lSystem.result});

        if (this.renderer)
            this.renderer.updateGeometry();
    };

    submit () { }

    demoZPositive() {
        this.setState({
            axiom: "F",
            angle: 30,
            stepCount: 3,
            rules: this.rulesToString([
                new Rule("F", "F[+F]F")
            ])
        }, () => {
            this.updateLSystem();
        });
    }

    demoZNegative() {
        this.setState({
            axiom: "F",
            angle: 30,
            stepCount: 3,
            rules: this.rulesToString([
                new Rule("F", "F[-F]F")
            ])
        }, () => {
            this.updateLSystem();
        });
    }

    demoXPositive() {
        this.setState({
            axiom: "F",
            angle: 30,
            stepCount: 3,
            rules: this.rulesToString([
                new Rule("F", "F[*F]F")
            ])
        }, () => {
            this.updateLSystem();
        });
    }

    demoXNegative() {
        this.setState({
            axiom: "F",
            angle: 30,
            stepCount: 3,
            rules: this.rulesToString([
                new Rule("F", "F[/F]F")
            ])
        }, () => {
            this.updateLSystem();
        });
    }

    demoSkip() {
        this.setState({
            axiom: "F",
            angle: 30,
            stepCount: 3,
            rules: this.rulesToString([
                new Rule("F", "F[+fF][-fF]F")
            ])
        }, () => {
            this.updateLSystem();
        });
    }

    exampleAlgea() {
        this.setState({
            axiom: "FA",
            angle: 30,
            stepCount: 4,
            rules: this.rulesToString([
                new Rule("A", "F[+A]F[-B]"),
                new Rule("B", "FA")
            ])
        }, () => {
            this.updateLSystem();
        });
    }

    exampleFractalBinary() {
        this.setState({
            axiom: "A",
            angle: 45,
            stepCount: 7,
            rules: this.rulesToString([
                new Rule("B", "BB"),
                new Rule("A", "B[+A][-A]")
            ])
        }, () => {
            this.updateLSystem();
        });
    }

    render() {
        return <>
            <div id="left-panel">
                <canvas id="canvas">
                    Your browser does not support HTML5.
                </canvas>
            </div>

            <div id="right-panel">
                <div id="description">
                    <h1>L-System Demo</h1>
                    <p>
                        This demo allows you to configure and visualize a <a href="https://en.wikipedia.org/wiki/L-system">Lindenmayer system (L-System)</a>.
                        You can modify the axiom, rules, angle, and step count to see how the generated
                        fractal changes.
                    </p>
                    <p>
                        Use the controls below to set your parameters and click <span className="button-color">Apply Configuration</span> to update the visualization.
                    </p>
                </div>

                <LSystemControlComponent
                    axiom={this.state.axiom}
                    rules={this.state.rules}
                    angle={this.state.angle}
                    stepCount={this.state.stepCount}
                    onAxiomChange={(axiom) => this.setState({ axiom })}
                    onRulesChange={(rules) => this.setState({ rules })}
                    onAngleChange={(angle) => this.setState({ angle })}
                    onStepCountChange={(stepCount) => this.setState({ stepCount })}
                    onSubmit={() => this.updateLSystem()}
                />

                <div id="result">
                    <h1>Result</h1>
                    <pre title={this.state.result}>{this.state.result}</pre>
                </div>
                
                <div id="legend">
                    <h1>Legend</h1>
                    <div id="legend-entries">
                        <div className="no-demo">
                            <span className="symbol">A-I</span>
                            <span className="symbol-description">Create a line segment along the current direction.</span>
                        </div>

                        <div className="no-demo">
                            <span className="symbol">[</span>
                            <span className="symbol-description">Push the current state onto the stack.</span>
                        </div>

                        <div className="no-demo">
                            <span className="symbol">]</span>
                            <span className="symbol-description">Pop the last state from the stack.</span>
                        </div>

                        <div onClick={() => this.demoZPositive()}>
                            <span className="symbol">+</span>
                            <span className="symbol-description">Turn around the Z-axis in the positive direction.</span>
                        </div>
        
                        <div onClick={() => this.demoZNegative()}>
                            <span className="symbol">-</span>
                            <span className="symbol-description">Turn around the Z-axis in the negative direction.</span>
                        </div>

                        <div onClick={() => this.demoXPositive()}>
                            <span className="symbol">*</span>
                            <span className="symbol-description">Turn around the X-axis in the positive direction.</span>
                        </div>

                        <div onClick={() => this.demoXNegative()}>
                            <span className="symbol">/</span>
                            <span className="symbol-description">Turn around the X-axis in the negative direction.</span>
                        </div>

                        <div onClick={() => this.demoSkip()}>
                            <span className="symbol">f</span>
                            <span className="symbol-description">Skip forward along the current direction.</span>
                        </div>
                    </div>

                    <div id="examples">
                        <h1>Examples</h1>
                        <ul>
                            <li onClick={() => this.exampleAlgea()}>Lindenmayer's original algea example.</li>
                            <li onClick={() => this.exampleFractalBinary()}>Fractal binary tree.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    }

    private stringToRules(rules: string): Rule[] {
        return rules.split("\n")
            .filter(line => line.trim() !== "")
            .map(line => {
                const [predecessor, successor] = line.split("=>").map(part => part.trim());
                return new Rule(predecessor, successor);
            });
    }

    private rulesToString(rules: Rule[]): string {
        return rules.map(rule => `${rule.predecessor} => ${rule.successor}`).join("\n");
    }
}