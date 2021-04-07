"use strict";

var canvas;
var gl;

var numPositions = 12;

var texSize = 256;
var numChecks = 8;

var program;

var texture, texture1, texture2;
var t1, t2;

var c;

var flag = true;

var image1 = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++) {
	for (var j = 0; j < texSize; j++) {
		var patchx = Math.floor(i / (texSize / numChecks));
		var patchy = Math.floor(j / (texSize / numChecks));
		if ((patchx % 2) ^ (patchy % 2)) c = 255;
		else c = 0;
		//c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
		image1[4 * i * texSize + 4 * j] = c;
		image1[4 * i * texSize + 4 * j + 1] = c;
		image1[4 * i * texSize + 4 * j + 2] = c;
		image1[4 * i * texSize + 4 * j + 3] = 255;
	}
}

var image2 = new Uint8Array(4 * texSize * texSize);

// Create a checkerboard pattern
for (var i = 0; i < texSize; i++) {
	for (var j = 0; j < texSize; j++) {
		image2[4 * i * texSize + 4 * j] = 127 + 127 * Math.sin(0.1 * i * j);
		image2[4 * i * texSize + 4 * j + 1] = 127 + 127 * Math.sin(0.1 * i * j);
		image2[4 * i * texSize + 4 * j + 2] = 127 + 127 * Math.sin(0.1 * i * j);
		image2[4 * i * texSize + 4 * j + 3] = 255;
	}
}

var positionsArray = [];
var colorsArray = [];
var texCoordsArray = [];

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
	vec4(1.0, 1.0, 1.0, 1.0), // red
	vec4(1.0, 1.0, 1.0, 1.0), // yellow
	vec4(1.0, 1.0, 1.0, 1.0), // green
	vec4(1.0, 1.0, 1.0, 1.0) // blue
];

var texCoord = [ vec2(0, 0), vec2(0.5, 1), vec2(1, 0) ];
// var texCoord = [ vec2(0, 0), vec2(0, 1), vec2(1, 1), vec2(1, 0) ];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = vec3(45.0, 45.0, 45.0);

var thetaLoc;

init();

function configureTexture(image){
	texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(
		gl.TEXTURE_2D,
		gl.TEXTURE_MIN_FILTER,
		gl.NEAREST_MIPMAP_LINEAR
	);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	// texture1 = gl.createTexture();
	// gl.bindTexture(gl.TEXTURE_2D, texture1);
	// gl.texImage2D(
	// 	gl.TEXTURE_2D,
	// 	0,
	// 	gl.RGBA,
	// 	texSize,
	// 	texSize,
	// 	0,
	// 	gl.RGBA,
	// 	gl.UNSIGNED_BYTE,
	// 	image1
	// );
	// gl.generateMipmap(gl.TEXTURE_2D);
	// gl.texParameteri(
	// 	gl.TEXTURE_2D,
	// 	gl.TEXTURE_MIN_FILTER,
	// 	gl.NEAREST_MIPMAP_LINEAR
	// );
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	// texture2 = gl.createTexture();
	// gl.bindTexture(gl.TEXTURE_2D, texture2);
	// gl.texImage2D(
	// 	gl.TEXTURE_2D,
	// 	0,
	// 	gl.RGBA,
	// 	texSize,
	// 	texSize,
	// 	0,
	// 	gl.RGBA,
	// 	gl.UNSIGNED_BYTE,
	// 	image2
	// );
	// gl.generateMipmap(gl.TEXTURE_2D);
	// gl.texParameteri(
	// 	gl.TEXTURE_2D,
	// 	gl.TEXTURE_MIN_FILTER,
	// 	gl.NEAREST_MIPMAP_LINEAR
	// );
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function triple(a, b, c){
	// Pass in the vertices to create the triangle on side of pyramid
	positionsArray.push(vertices[a]);
	positionsArray.push(vertices[b]);
	positionsArray.push(vertices[c]);

	//  Set colors at each vertex. Since same color, it interpolates to a solid color
	colorsArray.push(vertexColors[a]);
	colorsArray.push(vertexColors[a]);
	colorsArray.push(vertexColors[a]);

	texCoordsArray.push(texCoord[0]);
	texCoordsArray.push(texCoord[1]);
	texCoordsArray.push(texCoord[2]);
	// texCoordsArray.push(texCoord[0]);
	// texCoordsArray.push(texCoord[2]);
	// texCoordsArray.push(texCoord[3]);
}

function colorPyramid(){
	triple(0, 1, 2); // bottom triangle
	triple(2, 3, 1); // right face triangle
	triple(1, 3, 0); // left face triangle
	triple(3, 0, 2); // front face triangle
}

function requestCORSIfNotSameOrigin(image, url){
	if (new URL(url, window.location.href).origin !== window.location.origin) {
		image.crossOrigin = "";
	}
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

	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

	var positionLoc = gl.getAttribLocation(program, "aPosition");
	gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionLoc);

	var tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

	var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
	gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(texCoordLoc);

	// configureTexture();

	// var image = document.getElementById("texImage");
	var imageUrl =
		"https://live.staticflickr.com/4021/4684430254_6d14f6b257_m.jpg";
	var image = new Image();
	image.onload = function(){
		configureTexture(image);
	};

	requestCORSIfNotSameOrigin(image, imageUrl);
	image.src = imageUrl;

	configureTexture(image);

	// gl.activeTexture(gl.TEXTURE0);
	// gl.bindTexture(gl.TEXTURE_2D, texture1);
	// gl.uniform1i(gl.getUniformLocation(program, "uTex0"), 0);

	// gl.activeTexture(gl.TEXTURE1);
	// gl.bindTexture(gl.TEXTURE_2D, texture2);
	// gl.uniform1i(gl.getUniformLocation(program, "uTex1"), 1);

	thetaLoc = gl.getUniformLocation(program, "uTheta");

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

	render();
}

function render(){
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	if (flag) theta[axis] += 2.0;
	gl.uniform3fv(thetaLoc, theta);
	gl.drawArrays(gl.TRIANGLES, 0, numPositions);
	requestAnimationFrame(render);
}
