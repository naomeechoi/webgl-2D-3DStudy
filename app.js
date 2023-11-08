window.onload = function () {
  console.log("This is working");
  var canvas = document.getElementById("game-surface");
  var maxWidthHeight = 500;
  canvas.width = maxWidthHeight;
  canvas.height = maxWidthHeight;

  var gl = canvas.getContext("webgl");

  if (!gl) {
    console.log("WebGL not supported, falling back on experimental-webgl");
    gl = canvas.getContext("experimental-webgl");
  }

  if (!gl) {
    alert("Your browser does not support WebGL");
  }

  // bring glsl text source, glsl 텍스트 소스 가져오기
  var vertexShaderSource = document.getElementById("vertex-shader-2d").text;
  var fragmentShaderSource = document.getElementById("fragment-shader-2d").text;

  // create and compile shaders and check vaildations, 쉐이더 생성과 컴파일 검증까지
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  // make program, 프로그램 만들기
  var program = createProgram(gl, vertexShader, fragmentShader);

  var positionLocation = gl.getAttribLocation(program, "a_position");
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  var translationLocation = gl.getUniformLocation(program, "u_translation");
  var rotationLocation = gl.getUniformLocation(program, "u_rotation");
  var scaleLocation = gl.getUniformLocation(program, "u_scale");
  var colorLocation = gl.getUniformLocation(program, "u_color");

  // create and bind buffer, and add buffer data, 버퍼 생성 바인드 및 데이터 구성
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl);

  var translation = [0, 0];
  var rotation = [0, 1];
  var scale = [1, 1];
  var color = [Math.random(), Math.random(), Math.random(), 1];

  // 위치 슬라이드바 설정
  function updatePosition(ele, index) {
    translation[index] = ele.target.value;
    ele.target.previousSibling.innerHTML =
      ele.target.previousSibling.getAttribute("name") + ele.target.value;
    drawScene();
  }

  makeSliderAndRedraw("translation X: ", "translationSlider", 0, 400, (ele) => {
    return updatePosition(ele, 0);
  });

  makeSliderAndRedraw("translation Y: ", "translationSlider", 0, 400, (ele) => {
    return updatePosition(ele, 1);
  });

  // 회전 슬라이드 x 바 설정
  function updateAngle(ele) {
    var angleInDegrees = 360 - ele.target.value;
    var angleInRadians = (angleInDegrees * Math.PI) / 180;
    rotation[0] = Math.sin(angleInRadians);
    rotation[1] = Math.cos(angleInRadians);

    ele.target.previousSibling.innerHTML =
      ele.target.previousSibling.getAttribute("name") + ele.target.value;
    drawScene();
  }

  makeSliderAndRedraw("rotation Angle: ", "rotationSlider", 0, 360, (ele) => {
    return updateAngle(ele);
  });

  // 스케일 슬라이드 x 바 설정
  function updateScale(ele, index) {
    scale[index] = ele.target.value;

    ele.target.previousSibling.innerHTML =
      ele.target.previousSibling.getAttribute("name") + ele.target.value;
    drawScene();
  }

  makeSliderAndRedraw("scale X: ", "scaleSlider", -5, 5, (ele) => {
    return updateScale(ele, 0);
  });

  makeSliderAndRedraw("scale Y: ", "scaleSlider", -5, 5, (ele) => {
    return updateScale(ele, 1);
  });

  function makeSliderAndRedraw(eleName, parentDivId, min, max, func) {
    var parentDiv = document.getElementById(parentDivId);

    var division = document.createElement("d");

    var tempSlider = document.createElement("input");
    tempSlider.className = "slider";
    tempSlider.type = "range";
    tempSlider.min = min;
    tempSlider.max = max;

    var text = document.createElement("p");
    text.setAttribute("name", eleName);
    text.innerHTML = eleName + tempSlider.value;

    division.appendChild(text);
    division.appendChild(tempSlider);
    parentDiv.appendChild(division);

    tempSlider.oninput = function (ele) {
      func(ele);
    };
  }

  drawScene();

  function drawScene() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2; // 2 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(
      positionLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    // set the translation
    gl.uniform2fv(translationLocation, translation);

    // set the rotation
    gl.uniform2fv(rotationLocation, rotation);

    // set the rotation
    gl.uniform2fv(scaleLocation, scale);

    // set the color
    gl.uniform4fv(colorLocation, color);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6 * 3;
    gl.drawArrays(primitiveType, offset, count);
  }
};

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("ERROR linking program", gl.getProgramInfoLog(program));
    return;
  }

  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error("ERROR validating program", gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);
  return program;
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function setRectangle(gl, x, y, width, height) {
  var x1 = parseInt(x);
  var x2 = x1 + parseInt(width);
  var y1 = parseInt(y);
  var y2 = y1 + parseInt(height);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
}

function setGeometry(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      // left column
      0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,

      // right column
      50, 0, 80, 0, 50, 150, 50, 150, 80, 0, 80, 150,

      // middle
      0, 0, 30, 0, 80, 150, 80, 150, 50, 150, 0, 0,
    ]),
    gl.STATIC_DRAW
  );
}
