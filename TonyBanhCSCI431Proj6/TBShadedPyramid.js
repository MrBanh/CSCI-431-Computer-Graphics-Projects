"use strict";

var shadedPyramid = function(){
	var canvas;
	var gl;

	var numPositions = 12;

	var positionsArray = [];
	var colorsArray = [];
	var normalsArray = [];

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

	var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
	var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
	var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
	var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

	var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
	var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
	var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
	var materialShininess = 100.0;

	var ctm;
	var ambientColor, diffuseColor, specularColor;
	var modelViewMatrix, projectionMatrix;
	var viewerPos;
	var program;

	var xAxis = 0;
	var yAxis = 1;
	var zAxis = 2;
	var axis = 0;
	var theta = vec3(0, 0, 0);

	var thetaLoc;

	var flag = false;

	init();

	function triple(a, b, c){
		var t1 = subtract(vertices[b], vertices[a]);
		var t2 = subtract(vertices[c], vertices[b]);
		var normal = cross(t1, t2);
		normal = vec3(normal);

		colorsArray.push(vertexColors[a]);
		colorsArray.push(vertexColors[b]);
		colorsArray.push(vertexColors[c]);

		normalsArray.push(normal);
		normalsArray.push(normal);
		normalsArray.push(normal);

		positionsArray.push(vertices[a]);
		positionsArray.push(vertices[b]);
		positionsArray.push(vertices[c]);
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
		gl.clearColor(1.0, 1.0, 1.0, 1.0);

		gl.enable(gl.DEPTH_TEST);

		//
		//  Load shaders and initialize attribute buffers
		//
		program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);

		colorPyramid();

		var cBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

		var colorLoc = gl.getAttribLocation(program, "aColor");
		gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(colorLoc);

		var nBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

		var normalLoc = gl.getAttribLocation(program, "aNormal");
		gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(normalLoc);

		var vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

		var positionLoc = gl.getAttribLocation(program, "aPosition");
		gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(positionLoc);

		thetaLoc = gl.getUniformLocation(program, "theta");

		viewerPos = vec3(0.0, 0.0, -20.0);

		projectionMatrix = ortho(-1, 1, -1, 1, -100, 100);

		var ambientProduct = mult(lightAmbient, materialAmbient);
		var diffuseProduct = mult(lightDiffuse, materialDiffuse);
		var specularProduct = mult(lightSpecular, materialSpecular);

		document.getElementById("ButtonX").onclick = function(){
			axis = xAxis;
		};
		document.getElementById("ButtonY").onclick = function(){
			axis = yAxis;
		};
		document.getElementById("ButtonZ").onclick = function(){
			axis = zAxis;
		};
		document.getElementById("ButtonT").onclick = function(){
			flag = !flag;
		};

		gl.uniform4fv(
			gl.getUniformLocation(program, "uAmbientProduct"),
			ambientProduct
		);
		gl.uniform4fv(
			gl.getUniformLocation(program, "uDiffuseProduct"),
			diffuseProduct
		);
		gl.uniform4fv(
			gl.getUniformLocation(program, "uSpecularProduct"),
			specularProduct
		);
		gl.uniform4fv(
			gl.getUniformLocation(program, "uLightPosition"),
			lightPosition
		);

		gl.uniform1f(
			gl.getUniformLocation(program, "uShininess"),
			materialShininess
		);

		gl.uniformMatrix4fv(
			gl.getUniformLocation(program, "uProjectionMatrix"),
			false,
			flatten(projectionMatrix)
		);
		render();
	}

	function render(){
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		if (flag) theta[axis] += 2.0;

		modelViewMatrix = mat4();
		modelViewMatrix = mult(
			modelViewMatrix,
			rotate(theta[xAxis], vec3(1, 0, 0))
		);
		modelViewMatrix = mult(
			modelViewMatrix,
			rotate(theta[yAxis], vec3(0, 1, 0))
		);
		modelViewMatrix = mult(
			modelViewMatrix,
			rotate(theta[zAxis], vec3(0, 0, 1))
		);

		//console.log(modelView);

		gl.uniformMatrix4fv(
			gl.getUniformLocation(program, "uModelViewMatrix"),
			false,
			flatten(modelViewMatrix)
		);

		gl.drawArrays(gl.TRIANGLES, 0, numPositions);

		requestAnimationFrame(render);
	}
};

shadedPyramid();
