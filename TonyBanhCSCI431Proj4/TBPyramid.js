"use strict";

var canvas;
var gl;

var numPositions = 12;

var positions = [];
var colors = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];

var thetaLoc;

var side = 1;
var h = side * (Math.sqrt(3) / 2);

init();

function init(){
	canvas = document.getElementById("gl-canvas");

	gl = canvas.getContext("webgl2");
	if (!gl) alert("WebGL 2.0 isn't available");

	colorPyramid();

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	gl.enable(gl.DEPTH_TEST);

	//
	//  Load shaders and initialize attribute buffers
	//
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	var colorLoc = gl.getAttribLocation(program, "aColor");
	gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(colorLoc);

	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

	var positionLoc = gl.getAttribLocation(program, "aPosition");
	gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionLoc);

	thetaLoc = gl.getUniformLocation(program, "uTheta");

	//event listeners for buttons

	document.getElementById("xButton").onclick = function(){
		axis = xAxis;
	};
	document.getElementById("yButton").onclick = function(){
		axis = yAxis;
	};
	document.getElementById("zButton").onclick = function(){
		axis = zAxis;
	};

	render();
}

function colorPyramid(){
	triple(0, 1, 2);        // bottom triangle
	triple(2, 3, 1);        // right face triangle
	triple(1, 3, 0);        // left face triangle
	triple(3, 0, 2);        // front face triangle
}

function triple(a, b, c){
    // Using side/2 and h/2 to center the triangles at center of coordinate system
    // side = length of the sides
    // h = height of equilateral triangle
	var vertices = [
		vec4(-(side / 2), -(h / 2), -(h / 2), 1.0),
		vec4(0.0, -(h / 2), h / 2, 1.0),
		vec4(side / 2, -(h / 2), -(h / 2), 1.0),
		vec4(0.0, h / 2, 0.0, 1.0)
	];

	var vertexColors = [
		vec4(0.0, 0.0, 0.0, 1.0), // black
		vec4(1.0, 0.0, 0.0, 1.0), // red
		vec4(0.0, 1.0, 0.0, 1.0), // green
		vec4(0.0, 0.0, 1.0, 1.0) // blue
	];

	// We need to parition the quad into two triangles in order for
	// WebGL to be able to render it.  In this case, we create two
	// triangles from the quad indices

	//vertex color assigned by the index of the vertex

	var indices = [ a, b, c ];

	for (var i = 0; i < indices.length; ++i) {
		positions.push(vertices[indices[i]]);
		//colors.push( vertexColors[indices[i]] );

		// for solid colored faces use
		colors.push(vertexColors[a]);
	}
}

function render(){
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	theta[axis] += 2.0;
	gl.uniform3fv(thetaLoc, theta);

	gl.drawArrays(gl.TRIANGLES, 0, numPositions);
	requestAnimationFrame(render);
}
