"use strict";

var gl;

var theta = 0.0;
var thetaLoc;

var speed = 100;
var direction = true;

var side = 1;
var h = side * (Math.sqrt(3) / 2);

var index = 0;
var colors = [
	vec4(1.0, 0.0, 0.0, 1.0), // red
	vec4(0.0, 1.0, 0.0, 1.0), // green
	vec4(0.0, 0.0, 1.0, 1.0), // blue
	vec4(0.0, 0.0, 0.0, 1.0) // black
];
var cColor = vec4(colors[0]);
var cColorLoc;

init();

function init(){
	var canvas = document.getElementById("gl-canvas");

	gl = canvas.getContext("webgl2");
	if (!gl) alert("WebGL 2.0 isn't available");

	//
	//  Configure WebGL
	//
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	//  Load shaders and initialize attribute buffers

	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	var vertices = [
		vec2(-(side / 2), h / 3),
		vec2(side / 2, h / 3),
		vec2(0, -(h / 3 * 2))
	];

	// Load the data into the GPU

	var bufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

	// Associate out shader variables with our data buffer

	var positionLoc = gl.getAttribLocation(program, "aPosition");
	gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionLoc);

	thetaLoc = gl.getUniformLocation(program, "uTheta");
	cColorLoc = gl.getUniformLocation(program, "cColor");
	console.log(cColorLoc);

	// Initialize event handlers

	document.getElementById("slider").onchange = function(event){
		speed = 100 - event.target.value;
	};
	document.getElementById("Direction").onclick = function(event){
		direction = !direction;
	};

	document.getElementById("Controls").onclick = function(event){
		switch (event.target.index) {
			case 0:
				direction = !direction;
				break;

			case 1:
				speed /= 2.0;
				break;

			case 2:
				speed *= 2.0;
				break;
			case 3:
				cColor = colors[0];
				break;
			case 4:
				cColor = colors[1];
				break;
			case 5:
				cColor = colors[2];
				break;
			case 6:
				cColor = colors[3];
				break;
		}
	};

	window.onkeydown = function(event){
		var key = String.fromCharCode(event.keyCode);
		switch (key) {
			case "1":
				direction = !direction;
				break;

			case "2":
				speed /= 2.0;
				break;

			case "3":
				speed *= 2.0;
				break;
			case "4":
				cColor = colors[0];
				break;
			case "5":
				cColor = colors[1];
				break;
			case "6":
				cColor = colors[2];
				break;
			case "7":
				cColor = colors[3];
				break;
		}
	};

	render();
}

function render(){
	gl.clear(gl.COLOR_BUFFER_BIT);

	theta += direction ? 0.1 : -0.1;
	gl.uniform1f(thetaLoc, theta);
	gl.uniform4f(cColorLoc, ...flatten(cColor));

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

	setTimeout(function(){
		requestAnimationFrame(render);
	}, speed);
}
