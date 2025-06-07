import { LSystem, Rule } from './lsystem'; // Import from .ts (implicitly)
import { vec3, vec4, mat4 } from 'gl-matrix';

let gl: WebGLRenderingContext | null = null;
let buffer: WebGLBuffer | null = null;
let program: WebGLProgram | null = null;
let vertexCount: number = 0;
let lsystem: LSystem | null = null;
const angle: number = 45 * (Math.PI / 180);
const distance: number = 0.05;
let maxY: number = 0.01;
const rotationDelta: number = 1 * (Math.PI / 180);
let rotation: number = 0;

const load = async (url: string): Promise<string | undefined> => {
    let src: string | undefined;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to load ${url}: ${response.statusText}`);
            return undefined;
        }
        src = await response.text();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return undefined;
    }
    return src;
};

function display(): void {
    if (!gl || !program) {
        console.error("WebGL context or program not initialized for display.");
        return;
    }
    const yAxis = vec3.fromValues(0, 1, 0);
    const worldMatrix = mat4.create();
    mat4.rotate(worldMatrix, worldMatrix, rotation, yAxis);

    const eye = vec3.fromValues(0, maxY / 2.0, maxY / 0.5);
    const center = vec3.fromValues(0, maxY / 2.0, 0);
    const up = vec3.fromValues(0, 1, 0);

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, eye, center, up);

    let loc = findUniform("world");
    if (loc) gl.uniformMatrix4fv(loc, false, worldMatrix);

    loc = findUniform("view");
    if (loc) gl.uniformMatrix4fv(loc, false, viewMatrix);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.LINES, 0, vertexCount);
}

function findAttribute(name: string): number {
    if (!gl || !program) return -1;
    const loc = gl.getAttribLocation(program, name);
    if (loc === -1) {
        console.error("Could not find attribute '" + name + "'.");
    }
    return loc;
}

function findUniform(name: string): WebGLUniformLocation | null {
    if (!gl || !program) return null;
    const loc = gl.getUniformLocation(program, name);
    if (loc === null) {
        console.error("Could not find uniform '" + name + "'.");
    }
    return loc;
}

function get_web_gl_context(): WebGLRenderingContext | null {
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

function update(): void {
    display();
    rotation += rotationDelta;
}

function init(): void {
    window.onresize = reshape;
    window.onkeyup = keyboard;
    window.setInterval(update, 16);
}

function keyboard(ev: KeyboardEvent): void {
    update();
}

function init_geometry(): void {
    if (!gl || !program || !lsystem) {
        console.error("WebGL context, program, or L-System not initialized for geometry generation.");
        return;
    }

    vertexCount = 0;
    const vertices: number[] = [];
    const positionStack: vec4[] = [];
    const directionStack: vec4[] = [];

    let position = vec4.fromValues(0, 0, 0, 1);
    let direction = vec4.fromValues(0, 1.0, 0, 0);
    vec4.normalize(direction, direction);
    vec4.scale(direction, direction, distance);

    const positiveZRotation = mat4.create();
    const negativeZRotation = mat4.create();
    mat4.rotateZ(positiveZRotation, positiveZRotation, angle);
    mat4.rotateZ(negativeZRotation, negativeZRotation, -angle);

    const positiveXRotation = mat4.create();
    const negativeXRotation = mat4.create();
    mat4.rotateX(positiveXRotation, positiveXRotation, angle);
    mat4.rotateX(negativeXRotation, negativeXRotation, -angle);

    console.log("Starting geometry generation...");
    const lsystemString = lsystem.string;
    for (let i = 0; i < lsystemString.length; i++) {
        const char = lsystemString.charAt(i);
        if (char === "F") {
            vertices.push(position[0], position[1], position[2], position[3]);
            vec4.add(position, position, direction);
            vertices.push(position[0], position[1], position[2], position[3]);
            if (position[1] > maxY) maxY = position[1];
            vertexCount += 2;
        } else if (char === "+") {
            vec4.transformMat4(direction, direction, positiveZRotation);
            vec4.normalize(direction, direction);
            vec4.scale(direction, direction, distance);
        } else if (char === "-") {
            vec4.transformMat4(direction, direction, negativeZRotation);
            vec4.normalize(direction, direction);
            vec4.scale(direction, direction, distance);
        } else if (char === "*") {
            vec4.transformMat4(direction, direction, positiveXRotation);
            vec4.normalize(direction, direction);
            vec4.scale(direction, direction, distance);
        } else if (char === "/") {
            vec4.transformMat4(direction, direction, negativeXRotation);
            vec4.normalize(direction, direction);
            vec4.scale(direction, direction, distance);
        } else if (char === "[") {
            positionStack.push(vec4.clone(position));
            directionStack.push(vec4.clone(direction));
        } else if (char === "]") {
            const poppedPosition = positionStack.pop();
            if (poppedPosition) {
                position = poppedPosition;
            } else {
                console.error("Position stack underflow during L-system parsing.");
            }
            const poppedDirection = directionStack.pop();
            if (poppedDirection) {
                direction = poppedDirection;
            } else {
                console.error("Direction stack underflow during L-system parsing.");
            }
        }
    }
    console.log("Done.");

    const loc = findAttribute("position");
    if (loc === -1) return;

    buffer = gl.createBuffer();
    if (!buffer) {
        console.error("Failed to create WebGL buffer.");
        return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);

    reshape();
}

function init_shader(src: string, type: number): WebGLShader | null {
    if (!gl) {
        console.error("WebGL context not available for shader initialization.");
        return null;
    }
    let shader: WebGLShader | null = gl.createShader(type);
    if (!shader) {
        console.error(`Failed to create shader object (type: ${type})`);
        return null;
    }

    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const init_shader_program = async (): Promise<void> => {
    if (!gl) {
        console.error("WebGL context not available for shader program initialization.");
        return;
    }
    const vertexShaderSource = await load("src/vertex.glsl");
    if (!vertexShaderSource) {
        console.error("Failed to load vertex shader source.");
        return;
    }
    const vs = init_shader(vertexShaderSource, gl.VERTEX_SHADER);

    const fragmentShaderSource = await load("src/fragment.glsl");
    if (!fragmentShaderSource) {
        console.error("Failed to load fragment shader source.");
        return;
    }
    const fs = init_shader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    if (!vs || !fs) {
        console.error("Shader compilation failed. Cannot link program.");
        if (vs) gl.deleteShader(vs);
        if (fs) gl.deleteShader(fs);
        return;
    }

    program = gl.createProgram();
    if (!program) {
        console.error("Failed to create WebGL program.");
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        program = null;
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        return;
    }
    gl.useProgram(program);
};

function init_web_gl(): void {
    if (!gl) return;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
}

function reshape(): void {
    if (!gl) {
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
    // const worldHeight = maxY;
    // const worldWidth = worldHeight * aspectRatio;
    // const minX = -worldWidth / 2.0; // Unused
    // const maxX = +worldWidth / 2.0; // Unused
    // console.log("minX = " + minX + ", maxX = " + maxX);

    const canvas = document.querySelector("canvas");
    if (!canvas) {
        console.error("Could not find canvas element.");
        return;
    }
    canvas.setAttribute("width", newWidth.toString());
    canvas.setAttribute("height", newHeight.toString());
    gl.viewport(0, 0, newWidth, newHeight);

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, aspectRatio, 0.1, 100.0);

    const loc = findUniform("projection");
    if (loc) gl.uniformMatrix4fv(loc, false, projectionMatrix);

    display();
}

function init_lsystem(): void {
    lsystem = new LSystem();
    lsystem.setAxiom("F");

    const rule = new Rule("F", "F[+F]F[-F]F[/F]F[*F]");
    lsystem.addRule(rule);

    console.log("Starting L-system construction...");
    lsystem.step();
    lsystem.step();
    lsystem.step();
    console.log("Done.");
}

const main = async (): Promise<void> => {
    gl = get_web_gl_context();
    if (!gl) {
        console.error("Failed to initialize WebGL. Application cannot start.");
        return;
    }

    init();
    init_web_gl();
    await init_shader_program();
    if (!program) { 
         console.error("Shader program failed to initialize. Application cannot start.");
         return;
    }
    init_lsystem();
    init_geometry();
    // reshape(); // reshape is called at the end of init_geometry
};

main(); // Start the application
