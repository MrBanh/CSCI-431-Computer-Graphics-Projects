var perspectiveExample2 = function(){
	"use strict";

	var canvas;
	var gl;

	var numPositions = 12;

	var positionsArray = [];
	var colorsArray = [];

	// For shaping the pyramid
	var side = 1;
	var h = side * (Math.sqrt(3) / 2);
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

	var near = 0.3;
	var far = 3.0;
	var radius = 4.0;
	var theta = 0.0;
	var phi = 0.0;
	var dr = 50.0 * Math.PI / 180.0;

	var fovy = 45.0; // Field-of-view in Y direction angle (in degrees)
	var aspect = 1.0; // Viewport aspect ratio

	var modelViewMatrix, projectionMatrix;
	var modelViewMatrixLoc, projectionMatrixLoc;
	var eye;
	const at = vec3(0.0, 0.0, 0.0);
	const up = vec3(0.0, 1.0, 0.0);

	// For x, y, z rotations
	var xAxis = 0;
	var yAxis = 1;
	var zAxis = 2;
	var axis = 0;
	var rotateTheta = 0.0;
	var selectedAxis = [ 1, 0, 0 ];
	var rotationSpeed = 0.0;

	init();

	function triple(a, b, c){
		// Pass in the vertices to create the triangle on side of pyramid
		positionsArray.push(vertices[a]);
		positionsArray.push(vertices[b]);
		positionsArray.push(vertices[c]);

		//  Set colors at each vertex. Since same color, it interpolates to a solid color
		colorsArray.push(vertexColors[a]);
		colorsArray.push(vertexColors[a]);
		colorsArray.push(vertexColors[a]);
	}

	function colorPyramid(){
		triple(0, 1, 2); // bottom triangle
		triple(2, 3, 1); // right face triangle
		triple(1, 3, 0); // left face triangle
		triple(3, 0, 2); // front face triangle
	}

	function init(){
		canvas = document.getElementById("gl-canvas");

		gl = canvas.getContext("webgl2");
		if (!gl) alert("WebGL 2.0 isn't available");

		gl.viewport(0, 0, canvas.width, canvas.height);

		aspect = canvas.width / canvas.height;

		gl.clearColor(1.0, 1.0, 1.0, 1.0);

		gl.enable(gl.DEPTH_TEST);

		//
		//  Load shaders and initialize attribute buffers
		//
		var program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);

		colorPyramid();

		var cBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

		var colorLoc = gl.getAttribLocation(program, "aColor");
		gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(colorLoc);

		var vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

		var positionLoc = gl.getAttribLocation(program, "aPosition");
		gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(positionLoc);

		modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
		projectionMatrixLoc = gl.getUniformLocation(
			program,
			"uProjectionMatrix"
		);

		// sliders for viewing parameters

		document.getElementById("zFarSlider").onchange = function(event){
			far = event.target.value;
		};
		document.getElementById("zNearSlider").onchange = function(event){
			near = event.target.value;
		};
		document.getElementById("radiusSlider").onchange = function(event){
			radius = event.target.value;
		};
		document.getElementById("thetaSlider").onchange = function(event){
			theta = event.target.value * Math.PI / 180.0;
		};
		document.getElementById("phiSlider").onchange = function(event){
			phi = event.target.value * Math.PI / 180.0;
		};
		document.getElementById("aspectSlider").onchange = function(event){
			aspect = event.target.value;
		};
		document.getElementById("fovSlider").onchange = function(event){
			fovy = event.target.value;
		};

		//event listeners for buttons
		document.getElementById("xButton").onclick = function(){
			axis = xAxis;
			selectedAxis = [ 1, 0, 0 ];
		};
		document.getElementById("yButton").onclick = function(){
			axis = yAxis;
			selectedAxis = [ 0, 1, 0 ];
		};
		document.getElementById("zButton").onclick = function(){
			axis = zAxis;
			selectedAxis = [ 0, 0, 1 ];
		};
		document.getElementById("toggle").onclick = function(){
			rotationSpeed = rotationSpeed === 0.0 ? dr : 0.0;
		};

		render();
	}

	function render(){
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		eye = vec3(
			radius * Math.sin(theta) * Math.cos(phi),
			radius * Math.sin(theta) * Math.sin(phi),
			radius * Math.cos(theta)
		);
		modelViewMatrix = lookAt(eye, at, up);
		projectionMatrix = perspective(fovy, aspect, near, far);

		rotateTheta += rotationSpeed;

		modelViewMatrix = mult(
			modelViewMatrix,
			rotate(rotateTheta, selectedAxis)
		);

		gl.uniformMatrix4fv(
			modelViewMatrixLoc,
			false,
			flatten(modelViewMatrix)
		);
		gl.uniformMatrix4fv(
			projectionMatrixLoc,
			false,
			flatten(projectionMatrix)
		);

		gl.drawArrays(gl.TRIANGLES, 0, numPositions);
		requestAnimationFrame(render);
	}
};
perspectiveExample2();
