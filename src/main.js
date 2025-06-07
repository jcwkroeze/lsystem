var gl;
var program;
var vertexCount;
var lsystem;
var angle = 45 * (3.14 / 360);
var distance = 0.05;
var maxY = 0.01;
var rotationDelta = 1 * (3.14 / 360);
var rotation = 0;

var vertexShader;
var fragmentShader;

function load(path) {
    var src;

    $.ajax({
        async: false,
        url: path,
        success: function (result) {
            src = result;
        }
    });

    return src;
}

function display() {
    var yAxis = vec3.fromValues(0, 1, 0);
    var worldMatrix = mat4.create();
    mat4.rotate(worldMatrix, worldMatrix, rotation, yAxis);

    var eye = vec3.fromValues(0, maxY / 2.0, maxY / 0.5);
    var center = vec3.fromValues(0, maxY / 2.0, 0);
    var up = vec3.fromValues(0, 1, 0);

    var viewMatrix = mat4.create();
    viewMatrix = mat4.lookAt(viewMatrix, eye, center, up);

    var loc = findUniform("world", program);
    gl.uniformMatrix4fv(loc, false, worldMatrix);

    loc = findUniform("view", program);
    gl.uniformMatrix4fv(loc, false, viewMatrix);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.LINES, 0, vertexCount);
}

function findAttribute(name) {
    var loc = gl.getAttribLocation(program, name);

    if (loc == -1) {
        console.error("Could not find attribute '" + name + "'.");
    }

    return loc;
}

function findUniform(name) {
    var loc = gl.getUniformLocation(program, name);

    if (loc == null) {
        console.error("Could not find uniform '" + name + "'.");
    }

    return loc;
}

function get_web_gl_context() {
    var canvas = document.getElementById("canvas");
    if (canvas == null) {
        alert("Could not find canvas.");
        return;
    }

    var gl = null;
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    for (var i = 0; i < names.length; i++) {
        gl = canvas.getContext(names[i]);

        if (gl) {
            return gl;
        }
    }

    return null;
}

function update() {
    display();

    rotation += rotationDelta;
}

function init() {
    $(window).resize(reshape);
    $(window).keypress(keyboard);

    window.setInterval(update, 16);
}

function keyboard(ev) {
    update();
}

function init_geometry() {
    vertexCount = 0;
    var vertices = [];
    var positionStack = [];
    var directionStack = [];

    var position = vec4.fromValues(0, 0, 0, 1);
    var direction = vec4.fromValues(0, 1.0, 0, 0);
    vec4.normalize(direction, direction);
    vec4.scale(direction, direction, distance);

    var positiveZRotation = mat4.create();
    var negativeZRotation = mat4.create();
    mat4.rotateZ(positiveZRotation, positiveZRotation, angle);
    mat4.rotateZ(negativeZRotation, negativeZRotation, -angle);

    var positiveXRotation = mat4.create();
    var negativeXRotation = mat4.create();
    mat4.rotateX(positiveXRotation, positiveXRotation, angle);
    mat4.rotateX(negativeXRotation, negativeXRotation, -angle);

    console.log("Starting geometry generation...");
    for (var i = 0; i < lsystem.string.length; i++) {
        if (lsystem.string.charAt(i) == "F") {
            vertices = vertices.concat([position[0], position[1], position[2], position[3]]);
            vec4.add(position, position, direction);
            vertices = vertices.concat([position[0], position[1], position[2], position[3]]);
            if (position[1] > maxY) maxY = position[1];
            vertexCount += 2;
        } else if (lsystem.string.charAt(i) == "+") {
            vec4.transformMat4(direction, direction, positiveZRotation);
            vec4.normalize(direction, direction);
            vec4.scale(direction, direction, distance);
        } else if (lsystem.string.charAt(i) == "-") {
            vec4.transformMat4(direction, direction, negativeZRotation);
            vec4.normalize(direction, direction);
            vec4.scale(direction, direction, distance);
        } else if (lsystem.string.charAt(i) == "*") {
            vec4.transformMat4(direction, direction, positiveXRotation);
            vec4.normalize(direction, direction);
            vec4.scale(direction, direction, distance);
        } else if (lsystem.string.charAt(i) == "/") {
            vec4.transformMat4(direction, direction, negativeXRotation);
            vec4.normalize(direction, direction);
            vec4.scale(direction, direction, distance);
        } else if (lsystem.string.charAt(i) == "[") {
            positionStack.push(vec4.clone(position));
            directionStack.push(vec4.clone(direction));
        } else if (lsystem.string.charAt(i) == "]") {
            position = positionStack.pop();
            direction = directionStack.pop();
        }
    }
    console.log("Done.");

    var loc = findAttribute("position");

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, gl.FALSE, 0, 0);
    gl.enableVertexAttribArray(loc);

    reshape();
}

/* Taken from http://learningwebgl.com/blog/?p=28 */
function init_shader(src, type) {
    var shader;
    shader = gl.createShader(type);

    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function init_shader_program() {
    var vertexShader = load("src/vertex.glsl");
    var vs = init_shader(vertexShader, gl.VERTEX_SHADER);
    var fragmentShader = load("src/fragment.glsl");
    var fs = init_shader(fragmentShader, gl.FRAGMENT_SHADER);

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getProgramInfoLog(program));
    }

    gl.useProgram(program);
}

function init_web_gl() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

function reshape() {
    const container = document.getElementById("canvas-container");
    const containerRect = container.getBoundingClientRect();
    var newWidth = containerRect.width;
    var newHeight = containerRect.height;

    console.log("Reshaping, width = " + newWidth + ", height = " + newHeight + ".");

    var aspectRatio = newWidth / newHeight;
    console.log("Aspect ratio is " + aspectRatio + ".");
    var worldHeight = maxY;
    var worldWidth = worldHeight * aspectRatio;
    var minX = -worldWidth / 2.0;
    var maxX = +worldWidth / 2.0;
    console.log("minX = " + minX + ", maxX = " + maxX);

    /* This, however, sets the values for the actual HTML element to be
     the same as the CSS. */
    var canvas = $("canvas");
    canvas.attr("width", newWidth);
    canvas.attr("height", newHeight);
    gl.viewport(0, 0, newWidth, newHeight);

    var projectionMatrix = mat4.create();
    projectionMatrix = mat4.perspective(projectionMatrix, 90 * (3.14 / 360), newWidth / newHeight, 0.0, 1.0);

    var loc = findUniform("projection");
    gl.uniformMatrix4fv(loc, false, projectionMatrix);

    display();
}

function init_lsystem() {
    lsystem = new LSystem();
    lsystem.setAxiom("F");

    var rule = new Rule("F", "F[+F]F[-F]F[/F]F[*F]");
    lsystem.addRule(rule);

    console.log("Starting L-system construction...");
    lsystem.step();
    lsystem.step();
    lsystem.step();
    console.log("Done.");
}

function main() {
    gl = get_web_gl_context();

    init();
    init_web_gl();
    init_shader_program();
    init_lsystem();
    init_geometry();
    reshape();
}

$(document).ready(function () {
    main();
});

