import { createRoot } from 'react-dom/client';
import React from 'react';

import { LSystemControlComponent } from './Controls';
import { Renderer } from './Renderer';
import { LSystem, Rule } from './LSystem';

interface LSystemDemoState {
    angle: number;
    axiom: string;
    rules: Rule[];
    stepCount: number;
}

class LSystemDemoComponent
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

addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const el = document.getElementById("app-root");
    const root = createRoot(el || body);
    root.render(<LSystemDemoComponent/>);
});
