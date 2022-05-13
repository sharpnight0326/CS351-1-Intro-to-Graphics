// MultiJointModel.js (c) 2012 matsuda and itami
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Normal;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  vec3 lightDirection = normalize(vec3(0.0, 0.5, 0.7));\n' + // Light direction
    '  vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
    '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';
var gl
var floatsPerVertex = 7;
var g_angle01 = 0;
var g_angle01Rate = 10;
var axisAngle = 0;
var wingAngle = 0;
var wingAngleRate = 2;
var wingAngle2 = 0;
var wingAngle2Rate = -2;
var canvas
var eyex = 0
var eyey = -90
var eyez = 30
var eyey2 = -90
var eyez2 = 10
var isDrag=false;   // mouse-drag: true when user holds down mouse button
var xMclik=0.0;     // last mouse button-down position (in CVV coords)
var yMclik=0.0;
var xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;
var g_angle02 = 0;
var g_angle02Rate = 10;
var g_move1 = 0.0
var g_move1Rate = 2;
function main() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.7

    // Get the rendering context for WebGL
    gl  = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Set the vertex information
    var n = initVertexBuffers();
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Set the clear color and enable the depth test
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Get the storage locations of uniform variables
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    // var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if (!u_MvpMatrix) {
        console.log('Failed to get the storage location');
        return;
    }

    // Calculate the view projection matrix
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(45.0, canvas.width / canvas.height, 1.0, 100.0);
    var viewProjMatrix2 = new Matrix4();
    viewProjMatrix2.setPerspective(45.0, canvas.width / canvas.height, 1.0, 100.0);

    gl.uniformMatrix4fv(u_MvpMatrix, false, viewProjMatrix.elements);
    gl.uniformMatrix4fv(u_MvpMatrix, false, viewProjMatrix2.elements);

    canvas.onmousemove =  function(ev){myMouseMove( ev, gl, canvas) };
    // when the mouse moves, call mouseMove() function
    canvas.onmouseup =    function(ev){myMouseUp(   ev, gl, canvas)};

    canvas.onmousedown =    function(ev){myMouseDown(   ev, gl, canvas)};

    // pushMatrix(viewProjMatrix)
    // viewProjMatrix.lookAt(0.0, -30.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    // viewProjMatrix = popMatrix()


    // document.onkeydown= function(ev){
    //     keydown(ev, gl, viewProjMatrix, u_MvpMatrix);
    // }
    var tick = function() {
        animate();   // Update the rotation angle
        // viewProjMatrix.lookAt(0.0, -10.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

        pushMatrix(viewProjMatrix)
        viewProjMatrix.lookAt(eyex, eyey, eyez, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        pushMatrix(viewProjMatrix2)
        viewProjMatrix2.lookAt(eyex, eyey2, eyez2, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

        drawPorts(gl, n, viewProjMatrix, u_MvpMatrix, viewProjMatrix2);
        viewProjMatrix = popMatrix()
        viewProjMatrix2 = popMatrix()

        document.onkeydown = function(ev){ keydown(ev); };

        requestAnimationFrame(tick, canvas);

    };
    tick();
    // console.log(color)
    // drawPorts(gl, n, viewProjMatrix, u_MvpMatrix);
}

function keydown(ev) {
    if (ev.keyCode == 39){
        axisAngle += 10;
    }
    if (ev.keyCode == 87){
        eyey += 5
        eyey2 += 10
    }
    if (ev.keyCode == 83){
        eyey -= 5
        eyey2 -= 10
    }
    if (ev.keyCode == 68){
        eyez += 5
        eyez2 += 10
    }
    if (ev.keyCode == 65){
        eyez -= 5
        eyez2 -= 10
    }
    if (ev.keyCode == 90){
        wingAngle += 5
    }
    // draw(gl, n, viewProjMatrix, u_MvpMatrix);
}
var g_last = Date.now()
function animate() {
    var now = Date.now();
    var elapsed = now - g_last;     // elapsed time in milliseconds
    g_last = now;


    g_angle01 = g_angle01 + (g_angle01Rate * elapsed) / 500.0; // rate in degrees/sec
    // if (wingAngle >= 0){
    //     wingAngle = wingAngle + (wingAngleRate * elapsed)/100;
    // }
    if (wingAngle > 20){
        wingAngleRate *= -1;
    }
    else if (wingAngle < -20){
        wingAngleRate *= -1;
    }
    wingAngle = wingAngle + (wingAngleRate * elapsed)/100;

    if (wingAngle2 > 20){
        wingAngle2Rate *= -1;
    }
    else if (wingAngle2 < -20){
        wingAngle2Rate *= -1;
    }
    wingAngle2 = wingAngle2 + (wingAngle2Rate * elapsed)/100;

    if (g_angle02 > 20){
        g_angle02Rate *= -1;
    }
    else if (g_angle02 < -20){
        g_angle02Rate *= -1;
    }
    g_angle02 = g_angle02 + (g_angle02Rate * elapsed) / 500.0; // rate in degrees/sec

    if (g_move1 >= 20){
        g_move1Rate *= -1;
    }
    else if (g_move1 <= -20){
        g_move1Rate *= -1;
    }
    g_move1 = g_move1 + (g_move1Rate * elapsed)/1000;


}

function initVertexBuffers() {

    var cS = new Float32Array(5000)
    var colorShapes = new Float32Array([
        0.5, 0.5, 0.5, 1,    1,1,1,           //0
        0.5, -0.5, 0.5,1,    0.04,0.31,0.33,  //1
        -0.5,-0.5, 0.5,1,    1,1,1,           //2
        -0.5,-0.5, 0.5,1,    1,1,1,           //2
        -0.5, 0.5, 0.5,1,    0.04,0.31,0.33,  //3
        0.5, 0.5, 0.5, 1,    1,1,1,           //0
        0.5, 0.5, 0.5, 1,    1,1,1,           //0
        0.5, -0.5, 0.5,1,    0.04,0.31,0.33,  //1
        0.5, -0.5,-0.5,1,    1,1,1,           //4
        0.5, -0.5,-0.5,1,    1,1,1,           //4
        0.5, 0.5, -0.5,1,    0.04,0.31,0.33,  //5
        0.5, 0.5, 0.5, 1,    1,1,1,           //0
        -0.5, 0.5, 0.5,1,    0.04,0.31,0.33,  //3
        0.5, 0.5, 0.5, 1,    1,1,1,           //0
        0.5, 0.5, -0.5,1,    0.04,0.31,0.33,  //5
        0.5, 0.5, -0.5,1,    0.04,0.31,0.33,  //5
        -0.5,0.5, -0.5,1,    1,1,1,           //6
        -0.5, 0.5, 0.5,1,    0.04,0.31,0.33,  //3
        -0.5,-0.5,-0.5,1,    0.04,0.31,0.33,  //7
        -0.5,0.5, -0.5,1,    1,1,1,           //6
        0.5, 0.5, -0.5,1,    0.04,0.31,0.33,  //5
        0.5, 0.5, -0.5,1,    0.04,0.31,0.33,  //5
        0.5, -0.5,-0.5,1,    1,1,1,           //4
        -0.5,-0.5,-0.5,1,    0.04,0.31,0.33,  //7
        -0.5,0.5, -0.5,1,    1,1,1,           //6
        -0.5,-0.5,-0.5,1,    0.04,0.31,0.33,  //7
        -0.5,-0.5, 0.5,1,    1,1,1,           //2
        -0.5,-0.5, 0.5,1,    1,1,1,           //2
        -0.5, 0.5, 0.5,1,    0.04,0.31,0.33,  //3
        -0.5,0.5, -0.5,1,    1,1,1,           //6
        0.5, -0.5, 0.5,1,    0.04,0.31,0.33,  //1
        -0.5,-0.5, 0.5,1,    1,1,1,           //2
        -0.5,-0.5,-0.5,1,    0.04,0.31,0.33,  //7
        -0.5,-0.5,-0.5,1,    0.04,0.31,0.33,  //7
        0.5, -0.5,-0.5,1,    1,1,1,           //4
        0.5, -0.5, 0.5,1,    0.04,0.31,0.33,  //1

        0.207, 0.5, 0.5, 1,  1,1,1,            //0
        0.207, -0.5,0.5, 1,  0.11,0.66,0.96,            //1
        -0.207,-0.5,0.5, 1,  1,0.91,0.26,      //2
        -0.207,-0.5,0.5, 1,  1,0.91,0.26,      //2
        -0.207, 0.5,0.5, 1,  1,0.91,0.26,      //3
        0.207, 0.5, 0.5, 1,  0.11,0.96,0.69,            //0
        0.207, 0.5, 0.5, 1,  0.57,0.29,0.96,            //0
        0.207, -0.5,0.5, 1,  1,1,1,            //1
        0.5, -0.5,   0,  1,  0.95,0.47,0.27,   //4
        0.5, -0.5,   0,  1,  0.57,0.29,0.96,   //4
        0.5,  0.5,   0,  1,  0.95,0.47,0.27,   //5
        0.207, 0.5, 0.5, 1,  1,1,1,            //0
        0.5, -0.5,   0,  1,  0.95,0.47,0.27,   //4
        0.5,  0.5,   0,  1,  0.57,0.29,0.96,   //5
        0.207, 0.5,-0.5, 1,  0.11,0.96,0.69,            //6
        0.207, 0.5,-0.5, 1,  1,1,1,            //6
        0.207, -0.5,-0.5,1,  0.11,0.96,0.4,            //7
        0.5, -0.5,   0,  1,  0.95,0.47,0.27,   //4
        0.207, -0.5,-0.5,1,  0.77,0.95,0.31,            //7
        0.207, 0.5,-0.5, 1,  1,1,1,            //6
        -0.207,0.5,-0.5, 1,  0.77,0.95,0.31,   //8
        -0.207,0.5,-0.5, 1,  0.45,0.93,0.52,   //8
        -0.207,-0.5,-0.5,1,  0.57,0.29,0.96,   //9
        0.207, -0.5,-0.5,1,  0.77,0.95,0.31,            //7
        -0.207,0.5,-0.5, 1,  0.89,0.29,0.96,   //8
        -0.207,-0.5,-0.5,1,  0.45,0.93,0.52,   //9
        -0.5,-0.5, 0,    1,  1,1,1,            //11
        -0.5,-0.5, 0,    1,  0.89,0.29,0.96,            //11
        -0.5, 0.5, 0,    1,  1,1,1,            //10
        -0.207,0.5,-0.5, 1,  0.45,0.93,0.52,   //8
        -0.5, 0.5, 0,    1,  1,1,1,            //10
        -0.5,-0.5, 0,    1,  0.89,0.29,0.96,            //11
        -0.207,-0.5,0.5, 1, 0.29,0.58,0.96,      //2
        -0.207,-0.5,0.5, 1,  1,0.91,0.26,      //2
        -0.207, 0.5,0.5, 1,  1,0.91,0.26,      //3
        -0.5, 0.5, 0,    1,  0.29,0.58,0.96,            //10
        0.207, 0.5, 0.5, 1,  1,1,1,            //0
        0.5,  0.5,   0,  1,  0.95,0.47,0.27,   //5
        0.207, 0.5,-0.5, 1,  1,1,1,            //6
        0.207, 0.5,-0.5, 1,  0.29,0.58,0.96,            //6
        -0.207,0.5,-0.5, 1,  0.45,0.93,0.52,   //8
        -0.5, 0.5, 0,    1,  1,1,1,            //10
        -0.5, 0.5, 0,    1,  1,1,1,            //10
        -0.207, 0.5,0.5, 1,  1,0.96,0.8,      //3
        0.207, 0.5, 0.5, 1,  1,1,1,            //0
        0.207, 0.5,-0.5, 1,  1,0.96,0.8,            //6
        -0.5, 0.5, 0,    1,  1,1,1,            //10
        0.207, 0.5, 0.5, 1,  1,1,1,            //0
        0.207, -0.5,0.5, 1,  1,1,1,            //1
        -0.207,-0.5,0.5, 1,  1,0.91,0.26,      //2
        -0.5,-0.5, 0,    1,  1,1,1,            //11
        -0.5,-0.5, 0,    1,  1,1,1,            //11
        -0.207,-0.5,-0.5,1,  0.45,0.93,0.52,   //9
        0.207, -0.5,-0.5,1,  1,1,1,            //7
        0.207, -0.5,-0.5,1,  1,1,1,            //7
        0.5, -0.5,   0,  1,  0.95,0.47,0.27,   //4
        0.207, -0.5,0.5, 1,  1,1,1,            //1
        0.207, -0.5,0.5, 1,  1,1,1,            //1
        -0.207,-0.5,-0.5,1,  0.45,0.93,0.52,   //9
        0.207, -0.5,-0.5,1,  1,1,1,            //7

        0.5, 0.5, 0.2, 1,    0.04,0.31,0.33,  //0
        1,  -0.5, 0.5, 1,    1,1,1,           //1
        -1, -0.5, 0.5, 1,    1,1,1,           //2
        -1, -0.5, 0.5, 1,    1,1,1,           //2
        -0.5,0.5, 0.2, 1,    0.04,0.31,0.33,  //3
        0.5, 0.5, 0.2, 1,    0.04,0.31,0.33,  //0
        0.5, 0.5, 0.2, 1,    0.04,0.31,0.33,  //0
        -0.5,0.5, 0.2, 1,    0.04,0.31,0.33,  //3
        -0.5,0.5, -0.2,1,    0.04,0.31,0.33,  //4
        -0.5,0.5, -0.2,1,    0.04,0.31,0.33,  //4
        0.5, 0.5, -0.2,1,    0.04,0.31,0.33,  //5
        0.5, 0.5, 0.2, 1,    0.04,0.31,0.33,  //0
        0.5, 0.5, -0.2,1,    0.04,0.31,0.33,  //5
        1,  -0.5, -0.5,1,    1,1,1,           //6
        1,  -0.5, 0.5, 1,    1,1,1,           //1
        1,  -0.5, 0.5, 1,    1,1,1,           //1
        0.5, 0.5, 0.2, 1,    0.04,0.31,0.33,  //0
        0.5, 0.5, -0.2,1,    0.04,0.31,0.33,  //5
        1,  -0.5, -0.5,1,    1,1,1,           //6
        0.5, 0.5, -0.2,1,    0.04,0.31,0.33,  //5
        -0.5,0.5, -0.2,1,    0.04,0.31,0.33,  //4
        -0.5,0.5, -0.2,1,    0.04,0.31,0.33,  //4
        -1, -0.5, -0.5,1,    1,1,1,           //7
        1,  -0.5, -0.5,1,    1,1,1,           //6
        -0.5,0.5, 0.2, 1,    0.04,0.31,0.33,  //3
        -0.5,0.5, -0.2,1,    0.04,0.31,0.33,  //4
        -1, -0.5, -0.5,1,    1,1,1,           //7
        -1, -0.5, -0.5,1,    1,1,1,           //7
        -1, -0.5, 0.5, 1,    1,1,1,           //2
        -0.5,0.5, 0.2, 1,    0.04,0.31,0.33,  //3
        0.5, 0.2, 0.2, 1,    0.1,0.17,0.41,   //8
        -0.5,0.2, 0.2, 1,    0.1,0.17,0.41,   //9
        -0.5,0.2,-0.2, 1,    0.1,0.17,0.41,   //11
        -0.5,0.2,-0.2, 1,    0.1,0.17,0.41,   //11
        0.5, 0.2,-0.2, 1,    0.1,0.17,0.41,   //10
        0.5, 0.2, 0.2, 1,    0.1,0.17,0.41,   //8
        1,  -0.5, 0.5, 1,    1,1,1,           //1
        0.5, 0.2, 0.2, 1,    0.1,0.17,0.41,   //8
        0.5, 0.2,-0.2, 1,    0.1,0.17,0.41,   //10
        0.5, 0.2,-0.2, 1,    0.1,0.17,0.41,   //10
        1,  -0.5, -0.5,1,    1,1,1,           //6
        1,  -0.5, 0.5, 1,    1,1,1,           //1
        1,  -0.5, 0.5, 1,    1,1,1,           //1
        0.5, 0.2, 0.2, 1,    0.1,0.17,0.41,   //8
        -0.5,0.2, 0.2, 1,    0.1,0.17,0.41,   //9
        -0.5,0.2, 0.2, 1,    0.1,0.17,0.41,   //9
        -1, -0.5, 0.5, 1,    1,1,1,           //2
        1,  -0.5, 0.5, 1,    1,1,1,           //1
        -1, -0.5, -0.5,1,    1,1,1,           //7
        -0.5,0.2,-0.2, 1,    0.1,0.17,0.41,   //11
        -0.5,0.2, 0.2, 1,    0.1,0.17,0.41,   //9
        -0.5,0.2, 0.2, 1,    0.1,0.17,0.41,   //9
        -1, -0.5, 0.5, 1,    1,1,1,           //2
        -1, -0.5, -0.5,1,    1,1,1,           //7
        -1, -0.5, -0.5,1,    1,1,1,           //7
        -0.5,0.2,-0.2, 1,    0.1,0.17,0.41,   //11
        0.5, 0.2,-0.2, 1,    0.1,0.17,0.41,   //10
        0.5, 0.2,-0.2, 1,    0.1,0.17,0.41,   //10
        1,  -0.5, -0.5,1,    1,1,1,           //6
        -1, -0.5, -0.5,1,    1,1,1,           //7

        0,0,0,1,           0,1,0,
        0,0,1,1,           0,1,0,
        0,0,0,1,           1,0,0,
        0,-1,0,1,          1,0,0,
        0,0,0,1,           0,0,1,
        -1,0,0,1,          0,0,1,

        0.5, 0.5, 0.5, 1,    1,1,1,           //0
        0.5, -0.5, 0.5,1,    0.15,1,0.04,  //1
        -0.5,-0.5, 0.5,1,    1,1,1,           //2
        -0.5,-0.5, 0.5,1,    0.15,1,0.04,           //2
        -0.5, 0.5, 0.5,1,    0.04,0.31,0.33,  //3
        0.5, 0.5, 0.5, 1,    1,0.49,0.04,           //0
        0.5, 0.5, 0.5, 1,    0.94,0.04,1,           //0
        0.5, -0.5, 0.5,1,    0.41,0.04,1,  //1
        0.5, -0.5,-0.5,1,    1,1,1,           //4
        0.5, -0.5,-0.5,1,    0.94,0.04,1,           //4
        0.5, 0.5, -0.5,1,    0.41,0.04,1,  //5
        0.5, 0.5, 0.5, 1,    1,1,1,           //0
        -0.5, 0.5, 0.5,1,    0.04,0.95,1,  //3
        0.5, 0.5, 0.5, 1,    0.41,0.04,1,           //0
        0.5, 0.5, -0.5,1,    0.04,0.31,0.33,  //5
        0.5, 0.5, -0.5,1,    0.04,0.31,0.33,  //5
        -0.5,0.5, -0.5,1,    1,1,1,           //6
        -0.5, 0.5, 0.5,1,    0.04,0.31,0.33,  //3
        -0.5,-0.5,-0.5,1,    0.41,0.04,1,  //7
        -0.5,0.5, -0.5,1,    0.94,0.04,1,           //6
        0.5, 0.5, -0.5,1,    0.04,0.95,1,  //5
        0.5, 0.5, -0.5,1,    0.04,0.31,0.33,  //5
        0.5, -0.5,-0.5,1,    1,1,1,           //4
        -0.5,-0.5,-0.5,1,    0.04,0.31,0.33,  //7
        -0.5,0.5, -0.5,1,    1,1,1,           //6
        -0.5,-0.5,-0.5,1,    0.41,0.04,1,  //7
        -0.5,-0.5, 0.5,1,    1,1,1,           //2
        -0.5,-0.5, 0.5,1,    0.04,0.95,1,           //2
        -0.5, 0.5, 0.5,1,    0.94,0.04,1,  //3
        -0.5,0.5, -0.5,1,    1,1,1,           //6
        0.5, -0.5, 0.5,1,    0.04,0.31,0.33,  //1
        -0.5,-0.5, 0.5,1,    1,1,1,           //2
        -0.5,-0.5,-0.5,1,    0.41,0.04,1,  //7
        -0.5,-0.5,-0.5,1,    0.04,0.31,0.33,  //7
        0.5, -0.5,-0.5,1,    1,1,1,           //4
        0.5, -0.5, 0.5,1,    0.04,0.95,1,  //1


    ]);
    g_vertsMax = 5000;		// 12 tetrahedron vertices.
    for (var k = 0; k < colorShapes.length; k++){
        cS[k] = colorShapes[k];
    }
    // we can also draw any subset of these we wish,
    // such as the last 3 vertices.(onscreen at upper right)

    makeGroundGrid()
    var i = 1386;
    for(j=0; j< gndVerts.length; i++, j++) {
        cS[i] = gndVerts[j];
    }
    // colorShapes[672] = 2
    console.log(cS)
    // Create a buffer object
    var shapeBufferHandle = gl.createBuffer();
    if (!shapeBufferHandle) {
        console.log('Failed to create the shape buffer object');
        return false;
    }


    // Bind the the buffer object to target:
    gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
    // Transfer data from Javascript array colorShapes to Graphics system VBO
    // (Use sparingly--may be slow if you transfer large shapes stored in files)
    gl.bufferData(gl.ARRAY_BUFFER, cS, gl.STATIC_DRAW);

    var FSIZE = cS.BYTES_PER_ELEMENT; // how many bytes per stored value?

    //Get graphics system's handle for our Vertex Shader's position-input variable:
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    // Use handle to specify how to retrieve position data from our VBO:
    gl.vertexAttribPointer(
        a_Position, 	// choose Vertex Shader attribute to fill with data
        4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
        gl.FLOAT, 		// data type for each value: usually gl.FLOAT
        false, 				// did we supply fixed-point data AND it needs normalizing?
        FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
        // (x,y,z,w, r,g,b) * bytes/value
        0);						// Offset -- now many bytes from START of buffer to the
    // value we will actually use?
    gl.enableVertexAttribArray(a_Position);
    // Enable assignment of vertex buffer object's position data

    // Get graphics system's handle for our Vertex Shader's color-input variable;
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if(a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    // Use handle to specify how to retrieve color data from our VBO:
    gl.vertexAttribPointer(
        a_Color, 				// choose Vertex Shader attribute to fill with data
        3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
        gl.FLOAT, 			// data type for each value: usually gl.FLOAT
        false, 					// did we supply fixed-point data AND it needs normalizing?
        FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
        // (x,y,z,w, r,g,b) * bytes/value
        FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
    // value we will actually use?  Need to skip over x,y,z,w

    gl.enableVertexAttribArray(a_Color);
    // Enable assignment of vertex buffer object's position data

    //--------------------------------DONE!
    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    /* REMOVED -- global 'g_vertsMax' means we don't need it anymore
      return nn;
    */
}
function initArrayBuffer(gl){

}


// Coordinate transformation matrix
var g_modelMatrix = new Matrix4(), g_mvpMatrix = new Matrix4();
var g_modelMatrix2 = new Matrix4(), g_mvpMatrix2 = new Matrix4();

function drawPorts(gl, n, viewProjMatrix, u_MvpMatrix, viewProjMatrix2){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0,	canvas.width/2,canvas.height);
    // pushMatrix(viewProjMatrix)
    // viewProjMatrix.lookAt(0.0, -50.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    draw(gl, n, viewProjMatrix, u_MvpMatrix)
    //viewProjMatrix = popMatrix()


    // // pushMatrix(viewProjMatrix)
    gl.viewport(canvas.width/2, 0, canvas.width/2,canvas.height);
    // // viewProjMatrix.lookAt(0.0, -50.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    draw(gl, n, viewProjMatrix2, u_MvpMatrix)
    // // viewProjMatrix = popMatrix()
}
var quatMatrix = new Matrix4()
var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1); // 'current' orientation (made from qNew)
function draw(gl, n, viewProjMatrix, u_MvpMatrix) {
    // Clear color and depth buffer
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //axis
    pushMatrix(viewProjMatrix)
    pushMatrix(viewProjMatrix)
    pushMatrix(viewProjMatrix)
    pushMatrix(viewProjMatrix)
    viewProjMatrix = popMatrix()
    var axisHeight = 15.0;
    g_modelMatrix.setTranslate(0.0, 0.0, 0.0);
    g_modelMatrix.translate(g_move1, 0.0, 0.0);
    g_modelMatrix.rotate(g_angle01, 0.0, 1.0, 0.0);    // Rotate around the y-axis
    g_modelMatrix.rotate(axisAngle, 1.0, 0.0, 0.0);    // Rotate around the y-axis
    // pushMatrix(viewProjMatrix)
    // viewProjMatrix.lookAt(0.0, -50.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    drawBox(gl, n, 0, 36,1, axisHeight, 1, viewProjMatrix, u_MvpMatrix);
    // viewProjMatrix = popMatrix()


    //body hexagon1
    var bodyHeight1 = 5
    g_modelMatrix.translate(0.0, 8.0, 0.0);
    // g_modelMatrix.rotate(g_bodyAngle, 0.0, 1.0, 0.0);    // Rotate around the y-axis

    drawBox(gl, n, 36, 60,5, bodyHeight1, 5, viewProjMatrix, u_MvpMatrix);

    //hexagon2
    var bodyHeight2 = 12
    g_modelMatrix.translate(0.0, -9.0, 0.0);
    // g_modelMatrix.rotate(g_bodyAngle, 0.0, 1.0, 0.0);    // Rotate around the y-axis
    drawBox(gl, n, 36, 60,5, bodyHeight2, 5, viewProjMatrix, u_MvpMatrix);

    //wings
    var wingHeight = 0.5
    // g_modelMatrix.setTranslate(0.0, 0.0, 0.0)
    // g_modelMatrix.translate(0.0, 0.0, 4.5);
    g_modelMatrix.rotate(wingAngle, 0.0, 1.0, 0.0);    // Rotate around the y-axis
    drawBox(gl, n, 0, 36,wingHeight, 5, 5, viewProjMatrix, u_MvpMatrix);
    g_modelMatrix.translate(0.0, 0.0, 5.0);
    // g_modelMatrix.rotate(g_bodyAngle, 0.0, 1.0, 0.0);    // Rotate around the y-axis
    drawBox(gl, n, 0, 36,wingHeight, 5, 5, viewProjMatrix, u_MvpMatrix);
    g_modelMatrix.translate(0.0, 0.0, 5.0);
    // g_modelMatrix.rotate(g_bodyAngle, 0.0, 1.0, 0.0);    // Rotate around the y-axis
    drawBox(gl, n, 0, 36,wingHeight, 5, 5, viewProjMatrix, u_MvpMatrix);

    viewProjMatrix = popMatrix()
    g_modelMatrix.setTranslate(0.0, -1.0, 0.0)
    g_modelMatrix.translate(g_move1, 0.0, 0.0);
    g_modelMatrix.rotate(g_angle01, 0.0, 1.0, 0.0);    // Rotate around the y-axis
    g_modelMatrix.rotate(wingAngle2, 0.0, 1.0, 0.0);    // Rotate around the y-axis
    drawBox(gl, n, 0, 36,wingHeight, 5, 5, viewProjMatrix, u_MvpMatrix);
    g_modelMatrix.translate(0.0, 0.0, -5.0);
    // g_modelMatrix.rotate(-2*wingAngle, 0.0, 1.0, 0.0);    // Rotate around the y-axis
    drawBox(gl, n, 0, 36,wingHeight, 5, 5, viewProjMatrix, u_MvpMatrix);
    g_modelMatrix.translate(0.0, 0.0, -5.0);
    // g_modelMatrix.rotate(g_bodyAngle, 0.0, 1.0, 0.0);    // Rotate around the y-axis
    drawBox(gl, n, 0, 36,wingHeight, 5, 5, viewProjMatrix, u_MvpMatrix);


    // g_modelMatrix.setTranslate(0.0, 0.0, 9.0);
    // g_modelMatrix.translate(g_move1, 0.0, 0.0);
    // drawBox(gl, n, 0, 36,2.5, 6, 2.6, viewProjMatrix, u_MvpMatrix);
    //
    g_modelMatrix.setTranslate(0.0, -9.0, 0.0);
    g_modelMatrix.translate(g_move1, 0.0, 0.0);
    g_modelMatrix.rotate(g_angle02, 0.0, 0.0, 1.0);    // Rotate around the y-axis
    // g_modelMatrix.rotate(g_angle02, 0.0, 1.0, 1.0);
    drawBox(gl, n, 96, 60,2.5, 6, 6, viewProjMatrix, u_MvpMatrix);




    // drawBox2(gl, n, 120, 2, 30,3,3 , viewProjMatrix, u_MvpMatrix)
    drawBox2(gl, n, 198, 1500, 3,3,3 , viewProjMatrix, u_MvpMatrix)
    // viewProjMatrix = popMatrix()
    drawBox2(gl, n, 156, 2, 10,10,10, viewProjMatrix, u_MvpMatrix)
    drawBox2(gl, n, 158, 2, 15,15,15, viewProjMatrix, u_MvpMatrix)
    drawBox2(gl, n, 160, 2, 15,15,15, viewProjMatrix, u_MvpMatrix)
    // viewProjMatrix = popMatrix()

    viewProjMatrix = popMatrix()
    quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w); // Quaternion-->Matrix
    viewProjMatrix.concat(quatMatrix);
    g_modelMatrix.setTranslate(15.0, -17.0, 3.0)
    gl.uniformMatrix4fv(u_MvpMatrix, false, viewProjMatrix.elements)
    drawBox(gl, n, 0, 36,10, 5, 5, viewProjMatrix, u_MvpMatrix);

    viewProjMatrix = popMatrix()
    g_modelMatrix.setTranslate(-30,-20,3)
    g_modelMatrix.rotate(g_angle01, 0,0,1)
    drawBox(gl, n, 162, 36,6, 6, 6, viewProjMatrix, u_MvpMatrix);
    drawLine(gl, n, 156,2, 15,15,15,viewProjMatrix, u_MvpMatrix)
    drawLine(gl, n, 158, 2, 15,15,15,viewProjMatrix, u_MvpMatrix)
    drawLine(gl, n, 160, 2,15,15,15,viewProjMatrix, u_MvpMatrix)


    g_modelMatrix.setTranslate(-30,-30,0)
    g_modelMatrix.rotate(90, 0,0,1)
    g_modelMatrix.rotate(g_angle01, 0,1,0)
    drawBox(gl, n, 36, 60,5, bodyHeight1, 5, viewProjMatrix, u_MvpMatrix);
    g_modelMatrix.translate(0,20,0)
    drawBox(gl, n, 36, 60,5, bodyHeight1, 5, viewProjMatrix, u_MvpMatrix);
    g_modelMatrix.translate(0,-10,0)
    drawBox(gl, n, 0, 36,1, 20, 1, viewProjMatrix, u_MvpMatrix);

    g_modelMatrix.setTranslate(30, -30, 2.5)
    g_modelMatrix.rotate(g_angle01,1,0,0)
    drawBox(gl, n, 96, 60,5, bodyHeight1, 5, viewProjMatrix, u_MvpMatrix);
    g_modelMatrix.translate(0, -5, 0)
    g_modelMatrix.rotate(-180,1,0,0)
    drawBox(gl, n, 96, 60,5, bodyHeight1, 5, viewProjMatrix, u_MvpMatrix);
    g_modelMatrix.translate(0, 3, 0)
    g_modelMatrix.rotate(-180,1,0,0)
    g_modelMatrix.rotate(g_angle01,0,1,0)
    drawBox(gl, n, 96, 60,2, 2, 2, viewProjMatrix, u_MvpMatrix);

    g_modelMatrix.setTranslate(0, -45, 12)
    g_modelMatrix.rotate(90, 1,0,0)
    drawBox(gl, n, 36, 60,5, 3, 5, viewProjMatrix, u_MvpMatrix);
    g_modelMatrix.translate(0, -6, 0)
    drawBox(gl, n, 0, 36,1, 12, 1, viewProjMatrix, u_MvpMatrix);
    g_modelMatrix.translate(1,1,0)
    g_modelMatrix.rotate(30,0,0,1)
    g_modelMatrix.rotate(g_angle01,0,1,0)
    drawBox(gl, n, 0, 36,1, 12, 1, viewProjMatrix, u_MvpMatrix);




}


// var g_matrixStack = []; // Array for storing a matrix
// function pushMatrix(m) { // Store the specified matrix to the array
//     var m2 = new Matrix4(m);
//     g_matrixStack.push(m2);
// }
// var g_matrixStack2 = []; // Array for storing a matrix
// function pushMatrix2(m) { // Store the specified matrix to the array
//     var m2 = new Matrix4(m);
//     g_matrixStack2.push(m2);
// }
//
// function popMatrix() { // Retrieve the matrix from the array
//     return g_matrixStack.pop();
// }
// function popMatrix2() { // Retrieve the matrix from the array
//     return g_matrixStack2.pop();
// }

var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

// Draw rectangular solid
function drawBox(gl, n, startp, endp, width, height, depth, viewProjMatrix, u_MvpMatrix) {
    // viewProjMatrix.lookAt(0.0, -50.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    pushMatrix(g_modelMatrix);   // Save the model matrix

    // Scale a cube and draw
    g_modelMatrix.scale(width, height, depth);
    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    // gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
    // Draw
    // gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    gl.drawArrays(gl.TRIANGLES, startp, endp)
    g_modelMatrix = popMatrix();   // Retrieve the model matrix
}
function drawLine(gl, n, startp, endp, width, height, depth, viewProjMatrix, u_MvpMatrix) {
    // viewProjMatrix.lookAt(0.0, -50.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    pushMatrix(g_modelMatrix);   // Save the model matrix

    // Scale a cube and draw
    g_modelMatrix.scale(width, height, depth);
    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    // gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
    // Draw
    // gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    gl.drawArrays(gl.LINES, startp, endp)
    g_modelMatrix = popMatrix();   // Retrieve the model matrix
}
function drawBox2(gl, n, startp, endp, width, height, depth, viewProjMatrix, u_MvpMatrix) {
    pushMatrix(g_modelMatrix2);   // Save the model matrix
    // Scale a cube and draw
    g_modelMatrix2.scale(width, height, depth);
    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix2);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(g_modelMatrix2);
    g_normalMatrix.transpose();
    // gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
    // Draw
    gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
        startp,	// start at this vertex number, and
        endp);	// draw this many vertices.
    g_modelMatrix2 = popMatrix();   // Retrieve the model matrix
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

    var xcount = 100;			// # of lines to draw in x,y to make the grid.
    var ycount = 100;
    var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
    var xColr = new Float32Array([1,0.95,0.04]);	// bright yellow
    var yColr = new Float32Array([1,0.92,0.06]);	// bright green.

    // Create an (global) array to hold this ground-plane's vertices:
    gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
    // draw a grid made of xcount+ycount lines; 2 vertices per line.

    var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
    var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))

    // First, step thru x values as we make vertical lines of constant-x:
    for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
        if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
            gndVerts[j  ] = -xymax + (v  )*xgap;	// x
            gndVerts[j+1] = -xymax;								// y
            gndVerts[j+2] = 0.0;									// z
            gndVerts[j+3] = 1.0;									// w.
        }
        else {				// put odd-numbered vertices at (xnow, +xymax, 0).
            gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
            gndVerts[j+1] = xymax;								// y
            gndVerts[j+2] = 0.0;									// z
            gndVerts[j+3] = 1.0;									// w.
        }
        gndVerts[j+4] = xColr[0];			// red
        gndVerts[j+5] = xColr[1];			// grn
        gndVerts[j+6] = xColr[2];			// blu
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
        if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
            gndVerts[j  ] = -xymax;								// x
            gndVerts[j+1] = -xymax + (v  )*ygap;	// y
            gndVerts[j+2] = 0.0;									// z
            gndVerts[j+3] = 1.0;									// w.
        }
        else {					// put odd-numbered vertices at (+xymax, ynow, 0).
            gndVerts[j  ] = xymax;								// x
            gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
            gndVerts[j+2] = 0.0;									// z
            gndVerts[j+3] = 1.0;									// w.
        }
        gndVerts[j+4] = yColr[0];			// red
        gndVerts[j+5] = yColr[1];			// grn
        gndVerts[j+6] = yColr[2];			// blu
    }
}

function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
        (canvas.width/2);      // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
        (canvas.height/2);
    isDrag = true;                      // set our mouse-dragging flag
    xMclik = x;                         // record where mouse-dragging began
    yMclik = y;
};

function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
    if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
        (canvas.width/2);      // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
        (canvas.height/2);
    xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
    yMdragTot += (y - yMclik);
    dragQuat(x - xMclik, y - yMclik);
    xMclik = x;                         // Make next drag-measurement from here.
    yMclik = y;
};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
        (canvas.width/2);      // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
        (canvas.height/2);

    isDrag = false;                     // CLEAR our mouse-dragging flag, and
    // accumulate any final bit of mouse-dragging we did:
    xMdragTot += (x - xMclik);
    yMdragTot += (y - yMclik);
    dragQuat(x - xMclik, y - yMclik);
};

function dragQuat(xdrag, ydrag) {
//==============================================================================
// Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
    var res = 5;
    var qTmp = new Quaternion(0,0,0,1);

    var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
    // console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
    qNew.setFromAxisAngle( -2*ydrag + 0.0001, 2*xdrag + 0.0001, 0.0, dist*150.0);
    qTmp.multiply(qNew,qTot);     // apply new rotation to current rotation.
    qTot.copy(qTmp);
};

// -Math.sin(g_the)