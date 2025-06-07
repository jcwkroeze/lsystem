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
            <div id="canvas-container">
                <canvas id="canvas">
                    Your browser does not support HTML5.
                </canvas>
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
        </>
    }
}