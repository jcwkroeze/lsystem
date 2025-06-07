import { LSystem, Rule } from './lsystem';
import { vec3, vec4, mat4 } from 'gl-matrix';
import vertexShaderSource from './shaders/vertex.glsl';
import fragmentShaderSource from './shaders/fragment.glsl';

class LSystemDemo {
    private gl: WebGLRenderingContext | null = null;
    private buffer: WebGLBuffer | null = null;
    private program: WebGLProgram | null = null;
    private vertexCount: number = 0;
    private lsystem: LSystem | null = null;
    private readonly angle: number = 45 * (Math.PI / 180);
    private readonly distance: number = 0.05;
    private maxY: number = 0.01;
    private readonly rotationDelta: number = 1 * (Math.PI / 180);
    private rotation: number = 0;

    constructor() {
        this.gl = this.get_web_gl_context();
        if (!this.gl) {
            console.error("Failed to initialize WebGL. Application cannot start.");
            return;
        }

        this.init(); // Sets up event listeners and interval
        this.init_web_gl();
        this.init_shader_program();
        if (!this.program) {
            console.error("Shader program failed to initialize. Application cannot start.");
            return;
        }
        this.init_lsystem();
        this.init_geometry();
        this.reshape(); // Call reshape once to set initial projection and display
    }

    private display(): void {
        if (!this.gl || !this.program) {
            console.error("WebGL context or program not initialized for display.");
            return;
        }
        const yAxis = vec3.fromValues(0, 1, 0);
        const worldMatrix = mat4.create();
        mat4.rotate(worldMatrix, worldMatrix, this.rotation, yAxis);

        const eye = vec3.fromValues(0, this.maxY / 2.0, this.maxY / 0.5);
        const center = vec3.fromValues(0, this.maxY / 2.0, 0);
        const up = vec3.fromValues(0, 1, 0);

        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, eye, center, up);

        let loc = this.findUniform("world");
        if (loc) this.gl.uniformMatrix4fv(loc, false, worldMatrix);

        loc = this.findUniform("view");
        if (loc) this.gl.uniformMatrix4fv(loc, false, viewMatrix);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.drawArrays(this.gl.LINES, 0, this.vertexCount);
    }

    private findAttribute(name: string): number {
        if (!this.gl || !this.program) return -1;
        const loc = this.gl.getAttribLocation(this.program, name);
        if (loc === -1) {
            console.error("Could not find attribute '" + name + "'.");
        }
        return loc;
    }

    private findUniform(name: string): WebGLUniformLocation | null {
        if (!this.gl || !this.program) return null;
        const loc = this.gl.getUniformLocation(this.program, name);
        if (loc === null) {
            console.error("Could not find uniform '" + name + "'.");
        }
        return loc;
    }

    private get_web_gl_context(): WebGLRenderingContext | null {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
        if (!canvas) {
            alert("Could not find canvas element.");
            return null;
        }

        let context: WebGLRenderingContext | null = null;
        const names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
        for (let i = 0; i < names.length; i++) {
            try {
                context = canvas.getContext(names[i]) as WebGLRenderingContext | null;
            } catch (e) { /* ignore */ }

            if (context) {
                return context;
            }
        }
        if (!context) {
            alert("Unable to initialize WebGL. Your browser may not support it.");
        }
        return null;
    }

    private update(): void {
        this.display();
        this.rotation += this.rotationDelta;
    }

    private init(): void {
        window.onresize = this.reshape.bind(this);
        window.onkeyup = this.keyboard.bind(this);
        window.setInterval(this.update.bind(this), 16);
    }

    private keyboard(ev: KeyboardEvent): void {
        this.update();
    }

    private init_geometry(): void {
        if (!this.gl || !this.program || !this.lsystem) {
            console.error("WebGL context, program, or L-System not initialized for geometry generation.");
            return;
        }

        this.vertexCount = 0;
        const vertices: number[] = [];
        const positionStack: vec4[] = [];
        const directionStack: vec4[] = [];

        let position = vec4.fromValues(0, 0, 0, 1);
        let direction = vec4.fromValues(0, 1.0, 0, 0);
        vec4.normalize(direction, direction);
        vec4.scale(direction, direction, this.distance);

        const positiveZRotation = mat4.create();
        const negativeZRotation = mat4.create();
        mat4.rotateZ(positiveZRotation, positiveZRotation, this.angle);
        mat4.rotateZ(negativeZRotation, negativeZRotation, -this.angle);

        const positiveXRotation = mat4.create();
        const negativeXRotation = mat4.create();
        mat4.rotateX(positiveXRotation, positiveXRotation, this.angle);
        mat4.rotateX(negativeXRotation, negativeXRotation, -this.angle);

        console.log("Starting geometry generation...");
        const lsystemString = this.lsystem.string;
        for (let i = 0; i < lsystemString.length; i++) {
            const char = lsystemString.charAt(i);
            switch (char) {
                case "F": {
                    const nextPosition = vec4.create();
                    vec4.add(nextPosition, position, direction);

                    vertices.push(position[0]);
                    vertices.push(position[1]);
                    vertices.push(position[2]);

                    vertices.push(nextPosition[0]);
                    vertices.push(nextPosition[1]);
                    vertices.push(nextPosition[2]);

                    position = nextPosition;
                    this.vertexCount += 2;

                    if (position[1] > this.maxY) {
                        this.maxY = position[1];
                    }
                    break;
                }
                case "f": {
                    const nextPosition = vec4.create();
                    vec4.add(nextPosition, position, direction);
                    position = nextPosition;
                    break;
                }
                case "[": {
                    positionStack.push(vec4.clone(position));
                    directionStack.push(vec4.clone(direction));
                    break;
                }
                case "]": {
                    const p = positionStack.pop();
                    const d = directionStack.pop();
                    if (p) position = p;
                    if (d) direction = d;
                    break;
                }
                case "+": {
                    vec4.transformMat4(direction, direction, positiveZRotation);
                    break;
                }
                case "-": {
                    vec4.transformMat4(direction, direction, negativeZRotation);
                    break;
                }
                case "/": {
                    vec4.transformMat4(direction, direction, positiveXRotation);
                    break;
                }
                case "*": {
                    vec4.transformMat4(direction, direction, negativeXRotation);
                    break;
                }
            }
        }
        console.log("Done.");
        console.log("Max Y = " + this.maxY);

        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        const loc = this.findAttribute("position");
        if (loc !== -1) {
            this.gl.vertexAttribPointer(loc, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(loc);
        }
    }

    private init_shader(src: string, type: number): WebGLShader | null {
        if (!this.gl) {
            console.error("WebGL context not available for shader initialization.");
            return null;
        }
        const shader = this.gl.createShader(type);
        if (!shader) {
            console.error("Failed to create shader object.");
            return null;
        }
        this.gl.shaderSource(shader, src);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    private init_shader_program(): void {
        if (!this.gl) {
            console.error("WebGL context not available for shader program initialization.");
            return;
        }
        if (typeof vertexShaderSource !== 'string' || vertexShaderSource.trim() === "") {
            console.error("Vertex shader source is not a valid string or is empty.");
            return;
        }
        const vs = this.init_shader(vertexShaderSource, this.gl.VERTEX_SHADER);

        if (typeof fragmentShaderSource !== 'string' || fragmentShaderSource.trim() === "") {
            console.error("Fragment shader source is not a valid string or is empty.");
            return;
        }
        const fs = this.init_shader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);

        if (!vs || !fs) {
            console.error("Shader compilation failed. Cannot link program.");
            if (vs) this.gl.deleteShader(vs);
            if (fs) this.gl.deleteShader(fs);
            return;
        }

        this.program = this.gl.createProgram();
        if (!this.program) {
            console.error("Failed to create WebGL program.");
            this.gl.deleteShader(vs);
            this.gl.deleteShader(fs);
            return;
        }
        this.gl.attachShader(this.program, vs);
        this.gl.attachShader(this.program, fs);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error("Unable to initialize the shader program: " + this.gl.getProgramInfoLog(this.program));
            this.gl.deleteProgram(this.program);
            this.program = null;
            this.gl.deleteShader(vs);
            this.gl.deleteShader(fs);
            return;
        }
        this.gl.useProgram(this.program);
    }

    private init_web_gl(): void {
        if (!this.gl) return;
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
    }

    private reshape(): void {
        if (!this.gl) {
            console.error("WebGL context not available for reshape.");
            return;
        }
        const container = document.getElementById("canvas-container");
        if (!container) {
            console.error("Could not find canvas-container element.");
            return;
        }
        const containerRect = container.getBoundingClientRect();
        const newWidth = containerRect.width;
        const newHeight = containerRect.height;

        console.log("Reshaping, width = " + newWidth + ", height = " + newHeight + ".");

        const aspectRatio = newWidth / newHeight;
        console.log("Aspect ratio is " + aspectRatio + ".");

        const canvas = document.querySelector("canvas");
        if (!canvas) {
            console.error("Could not find canvas element.");
            return;
        }
        canvas.setAttribute("width", newWidth.toString());
        canvas.setAttribute("height", newHeight.toString());
        this.gl.viewport(0, 0, newWidth, newHeight);

        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, 45 * Math.PI / 180, aspectRatio, 0.1, 100.0);

        const loc = this.findUniform("projection");
        if (loc) this.gl.uniformMatrix4fv(loc, false, projectionMatrix);

        this.display();
    }

    private init_lsystem(): void {
        this.lsystem = new LSystem();
        this.lsystem.setAxiom("F");

        const rule = new Rule("F", "F[+F]F[-F]F[/F]F[*F]");
        this.lsystem.addRule(rule);

        console.log("Starting L-system construction...");
        this.lsystem.step();
        this.lsystem.step();
        this.lsystem.step();
        console.log("Done.");
    }
}

// Start the application
new LSystemDemo();