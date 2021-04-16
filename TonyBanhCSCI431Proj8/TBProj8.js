"use strict";

// Util functions
function repeat(n, pattern) {
    return [...Array(n)].reduce(sum => sum.concat(pattern), []);
}

function radToDeg(r) {
return r * 180 / Math.PI;
}

function degToRad(d) {
return d * Math.PI / 180;
}

// Data for buffer
const positions = [
    // Front
    0.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    -.5, 0.5, 0.5,
    -.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    -.5, -.5, 0.5,

    // Left
    -.5, 0.5, 0.5,
    -.5, -.5, 0.5,
    -.5, 0.5, -.5,
    -.5, 0.5, -.5,
    -.5, -.5, 0.5,
    -.5, -.5, -.5,

    // Back
    -.5, 0.5, -.5,
    -.5, -.5, -.5,
    0.5, 0.5, -.5,
    0.5, 0.5, -.5,
    -.5, -.5, -.5,
    0.5, -.5, -.5,

    // Right
    0.5, 0.5, -.5,
    0.5, -.5, -.5,
    0.5, .5, 0.5,
    0.5, .5, 0.5,
    0.5, -.5, 0.5,
    0.5, -.5, -.5,

    // Top
    0.5, 0.5, 0.5,
    0.5, 0.5, -.5,
    -.5, 0.5, 0.5,
    -.5, 0.5, 0.5,
    0.5, 0.5, -.5,
    -.5, 0.5, -.5,

    // Bottom
    0.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, 0.5,
    -.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, -.5,
];

const textureCoordinates = repeat(6, [
    1, 1,
    1, 0,
    0, 1,

    0, 1,
    1, 0,
    0, 0
])

const normals = [
    ...repeat(6, [0, 0, 1]),
    ...repeat(6, [-1, 0, 0]),
    ...repeat(6, [0, 0, -1]),
    ...repeat(6, [1, 0, 0]),
    ...repeat(6, [0, 1, 0]),
    ...repeat(6, [0, -1, 0])
]

// For modifying matrices
const normMatrix = glMatrix.mat4.create();
const modelMatrix = glMatrix.mat4.create();
const viewMatrix = glMatrix.mat4.create();
const projectionMatrix = glMatrix.mat4.create();
const mvMatrix = glMatrix.mat4.create();
const mvpMatrix = glMatrix.mat4.create();
let fieldOfView = degToRad(120);
let aspectRatio = canvas.width / canvas.height;
let near = 1e-4;
let far = 1e4;
glMatrix.mat4.perspective(projectionMatrix, fieldOfView, aspectRatio, near, far);
glMatrix.mat4.translate(viewMatrix, viewMatrix, [0, 0.1, 2]);
glMatrix.mat4.invert(viewMatrix, viewMatrix);

// For modifying Axis of rotation
const xAxis = 0;
const yAxis = 1;
const zAxis = 2;
const rotateAround = [vec3(1, 0, 0), vec3(0, 1, 0), vec3(0, 0, 1)];
let axis = 0;
let isRotating = false;

// Helper functions

/**
 * Handles cross origin requests for image links, and sets the image attribute to anonymous (no exchange of user credentials)
 *
 * @param { HTMLInputElement } image
 * @param { String } url - image link
 */
function requestCORSIfNotSameOrigin(image, url){
	if (new URL(url, window.location.href).origin !== window.location.origin) {
		image.crossOrigin = "";
	}
}

/**
 * Loads resources, such as an image
 *
 * @param { WebGLRenderingContext } gl
 * @param { string } url - image link
 */
function loadTexture(gl, url) {
    const texture = gl.createTexture();
    const image = new Image();
    requestCORSIfNotSameOrigin(image, url);
    image.src = url;

    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
}

function setGeometry(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}

function setTextureCoord(gl) {
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW)

    return textureCoordBuffer;
}

function setNormal(gl) {
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    return normalBuffer;
}

function createBuffers(gl) {
    return {
        positionBuffer: setGeometry(gl),
        textureCoordBuffer: setTextureCoord(gl),
        normalBuffer: setNormal(gl)
    }
}

function initEventListeners() {
    document.getElementById("rotateX").addEventListener("click", function() { axis = xAxis})
    document.getElementById("rotateY").addEventListener("click", function() { axis = yAxis})
    document.getElementById("rotateZ").addEventListener("click", function() { axis = zAxis})
    document.getElementById("toggleRotate").addEventListener("click", function() {
        isRotating = !isRotating;
    })
}

function main () {
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) { alert("WebGL 2.0 is not available for your browser"); }

    // Convert clip space to pixels
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Depth Testing
    gl.enable(gl.DEPTH_TEST);

    // Load Shaders, attach to program, and link program
    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Program data, including attribute and uniform locations
    const programInfo = {
        program,
        attribLocations: {
            position: gl.getAttribLocation(program, "position"),
            textureCoord: gl.getAttribLocation(program, "textureCoord"),
            normal: gl.getAttribLocation(program, "normal"),
        },
        uniformLocations: {
            matrix: gl.getUniformLocation(program, "matrix"),
            normalMatrix: gl.getUniformLocation(program, "normalMatrix"),
            textureID: gl.getUniformLocation(program, "textureID"),
        }
    }

    // Set up buffers
    const buffers = createBuffers(gl);

    // Enable vertex attributes
    const { position, textureCoord, normal } = programInfo.attribLocations;
    const { positionBuffer, textureCoordBuffer, normalBuffer } = buffers;

    gl.enableVertexAttribArray(position);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(textureCoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.vertexAttribPointer(textureCoord, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(normal);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);

    // Load in texture
    const texture = loadTexture(gl, "/default_brick.png");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Use texture set at texture unit 0
    gl.uniform1i(programInfo.uniformLocations.textureID, 0);

    // Initialize event listeners
    initEventListeners();

    function render() {
        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (isRotating) {
            glMatrix.mat4.rotate(modelMatrix, modelMatrix, Math.PI / 60, rotateAround[axis]);
        };

        glMatrix.mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
        glMatrix.mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);

        glMatrix.mat4.invert(normMatrix, mvMatrix);
        glMatrix.mat4.transpose(normMatrix, normMatrix);

        gl.uniformMatrix4fv(programInfo.uniformLocations.matrix, false, mvpMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normMatrix);
        gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
1
        requestAnimationFrame(render);
    }

    render();
}

main();