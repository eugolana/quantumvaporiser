// Set up Audio stuff
// TODO UI stuff ie. pause, stop, etc

var audioContext = new (window.AudioContext || window.webkitAudioContext);

var masterGain = audioContext.createGain();

var analyser = audioContext.createAnalyser();
masterGain.connect(analyser);
analyser.connect(audioContext.destination);


window.addEventListener('load', function() {
    var dropzone = document.querySelector('#myCanvas');
    dropzone.addEventListener('drop', handleDrop, false);
    dropzone.addEventListener('dragover', handleDragOver, false);
})

var handleDragOver = function(e) {
    e.preventDefault();
    e.stopPropagation();
}

var handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();

    var files = e.dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        reader.addEventListener('load', function(e) {
            var data = e.target.result;
            audioContext.decodeAudioData(data, function(buffer) {
                playSound(buffer);
            })
        })
        reader.readAsArrayBuffer(file);
    }
}

var playSound = function(buffer) {
    var source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);
    source.start(0);
}

const spectrum = new Uint8Array(analyser.frequencyBinCount);


// Canvas setup stuff


var width = window.innerWidth;
var height = window.innerHeight;

var renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('myCanvas') });
renderer.setSize(width, height);
 
var scene = new THREE.Scene;

var clock = new THREE.Clock();


// ADD OBJECTS

// Add sphere
// Sphere
var sphereGeometry = new THREE.SphereGeometry(100, 100, 100);

var uniforms = {
	time: {type: "f", value: 0},
	resolution: {type: "v2", value: new THREE.Vector2 },
	a1: {type: "f", value: 0.0},
	a2: {type: "f", value: 0.0},
	a3: {type: "f", value: 0.0},
	a4: {type: "f", value: 0.0}
}

var waveShader = new THREE.ShaderMaterial({
	uniforms: uniforms,
	vertexShader: document.getElementById('simpleVertexShader').innerHTML,
	fragmentShader: document.getElementById('waveShader').innerHTML,
	transparent: true,
	side: THREE.DoubleSide
});

sphereCamera = new THREE.CubeCamera( 1, 1000, 256);
sphereCamera.renderTarget.texture.minFilter = THREE.LinearFilter ;

scene.add( sphereCamera );

sphereCamera.position.x = 100;
sphereCamera.position.y = 100;
sphereCamera.position.z = 100;


var sphereMaterial = new THREE.MeshPhongMaterial({ 
	color: 0xccccff, 
	side: THREE.FrontSide, 
	transparent: true, 
	opacity: 0.3, 
	shininess: 140.,
	reflectivity: .6,
});


// Reflect material
var sphereCameraMaterial = new THREE.MeshBasicMaterial({
	envMap: sphereCamera.renderTarget.texture,
	transparent: true,
	opacity: 0.4
})

var sphereMaterials = [sphereCameraMaterial, sphereMaterial, waveShader];

var sphere = THREE.SceneUtils.createMultiMaterialObject( sphereGeometry, sphereMaterials );


sphere.rotation.y = Math.PI * 45 / 180;

// scene.add(cube2);
scene.add(sphere);

// ADD Main Camera

var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);

camera.position.y = 160;
camera.position.z = 940;
camera.lookAt(sphere.position);

scene.add(camera);

// Add Skysphere 
var skySphereGeometry = new THREE.SphereGeometry(900, 50, 50);


var skyUniforms = {
	time: {type: "f", value: 0},
	resolution: {type: "v2", value: new THREE.Vector2 },
	skyColor: {type: "v3", value: new THREE.Vector3(0.7, 0.7, 0.9)},
	cloudCover: {type: "f", value: 0}
}

var skySphereMaterial = new THREE.ShaderMaterial({
	uniforms: skyUniforms,
	vertexShader: document.getElementById('simpleVertexShader').innerHTML,
	fragmentShader: document.getElementById('cloudShader').innerHTML,
	side: THREE.BackSide,
});


var skySphere = new THREE.Mesh(skySphereGeometry, skySphereMaterial);

scene.add(skySphere);

skySphere.rotation.y = Math.PI * 200 /180;


// Add Floor
var floorGeometry = new THREE.BoxGeometry(700,5,700)

var checkedMaterial = new THREE.ShaderMaterial({
	uniforms: skyUniforms,
	vertexShader: document.getElementById('simpleVertexShader').innerHTML,
	fragmentShader: document.getElementById('checkedShader').innerHTML,
})

var simpleMaterial = new THREE.MeshBasicMaterial({color: 0x444444});

var floorMaterials = [
	simpleMaterial,
	simpleMaterial,
	checkedMaterial,
	simpleMaterial,
	simpleMaterial,
	simpleMaterial,
]

var floorbox = new THREE.Mesh(floorGeometry, floorMaterials);
floorbox.position.y -= 150;
scene.add(floorbox)

// Add Light
var pointLight = new THREE.PointLight(0xddddff,);
pointLight.position.set(20, 600, 600);
 
scene.add(pointLight);

var bass; var mids; var treble;

var rotation_delta = 0;

function render() {

	bass = sumSpectrum(spectrum.subarray(0,64))/255;
	mids = sumSpectrum(spectrum.subarray(64, 512))/255;
	treble = sumSpectrum(spectrum.subarray(512, 1024))/255

	sphereCamera.update( renderer, scene );

 	analyser.getByteFrequencyData(spectrum)
	var delta = clock.getDelta();
	uniforms.a1.value = Math.pow(bass, 2) / 4;
	uniforms.a2.value = Math.pow(mids, 2) / 2;
	uniforms.a3.value = Math.pow(treble, 2) * 4;

	uniforms.a4.value = mids;
	sphere.rotation.y -= treble/10;
	rotation_delta = rotation_delta * 0.9 + ( 0.1 * mids/120)
	floorbox.rotation.y += rotation_delta;
	skyUniforms.time.value += (delta / 4.) * ( 1 + bass * 4 ) ;
	skyUniforms.cloudCover.value = (skyUniforms.cloudCover.value + (0.05 * mids  )) / 1.05;

	delta *= bass/ 100000;
	uniforms.time.value += delta;

	renderer.render(scene, camera);

	requestAnimationFrame(render);
}

render();


function sumSpectrum(spec){

	return spec.reduce(add, 0) / spec.length;
}

function add(a, b){
	return a + b;
}