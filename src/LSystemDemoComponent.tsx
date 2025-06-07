import React from 'react';

import { LSystem, Rule } from './LSystem';
import { Renderer } from './Renderer';

import { LSystemControlComponent } from './LSystemControlComponent';

export interface LSystemDemoState {
    angle: number;
    axiom: string;
    rules: Rule[];
    stepCount: number;
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
            rules: this.lSystem.rules,
            stepCount: this.lSystem.stepCount,
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
            rules: this.state.rules,
        });

        if (this.renderer)
            this.renderer.updateGeometry();
    };

    submit () { }

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
                <div id="legend">
                    <h1>Legend</h1>
                    <div id="legend-entries" className="form">
                        <span className="symbol">+</span>
                        <span className="symbol-description">Turn around the Z-axis in the positive direction.</span>

                        <span className="symbol">-</span>
                        <span className="symbol-description">Turn around the Z-axis in the negative direction.</span>

                        <span className="symbol">*</span>
                        <span className="symbol-description">Turn around the X-axis in the positive direction.</span>

                        <span className="symbol">/</span>
                        <span className="symbol-description">Turn around the X-axis in the negative direction.</span>

                        <span className="symbol">F</span>
                        <span className="symbol-description">Create a line segment along the current direction.</span>

                        <span className="symbol">f</span>
                        <span className="symbol-description">Skip forward along the current direction.</span>
                    </div>
                </div>
            </div>
        </>
    }
}