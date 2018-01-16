// Set up Audio stuff
// TODO UI stuff ie. pause, stop, etc

var audioContext = new (window.AudioContext || window.webkitAudioContext);

var masterGain = audioContext.createGain();

var player;

var analyser = audioContext.createAnalyser();
masterGain.connect(analyser);
analyser.connect(audioContext.destination);

var lon = 15, lat = 15;
var phi = 0, theta = 0;		


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
    document.getElementById('instructions').innerHTML = "<p>Loading Audio...</p>";
    var files = e.dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        reader.addEventListener('load', function(e) {
            var data = e.target.result;
            audioContext.decodeAudioData(data, function(buffer) {
            	document.getElementById('instructions').remove();
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
    player = source;
}

var stop

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
	opacity: 0.7,
	side: THREE.DoubleSide,
});

sphereCamera = new THREE.CubeCamera( 1, 1000, 256);
sphereCamera.renderTarget.texture.minFilter = THREE.LinearFilter ;

scene.add( sphereCamera );

// sphereCamera.position.x = 100;
// sphereCamera.position.y = 100;
// sphereCamera.position.z = 100;


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
	opacity: 0.7
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

var backgroundGeometry = new THREE.BoxGeometry(10000,10000,10000);
var backgroundMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});

var background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);

scene.add(background);

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
	transparent: true,
	opacity: 0.2
});

var skyLightMaterial = new THREE.MeshPhongMaterial({ 
	side: THREE.BackSide, 
	shininess: 0,
	emisive: 0xccccff,
	emissiveIntensity: 2.6,
	transparent: true,
	blending: THREE.MultiplyBlending,
});


var skySphere = new THREE.SceneUtils.createMultiMaterialObject(skySphereGeometry, [skySphereMaterial, skyLightMaterial]);

scene.add(skySphere);

skySphere.rotation.y = Math.PI * 200 /180;


// Add Floor
var floorGeometry = new THREE.BoxGeometry(700,5,700)

var floorUniforms = {
	time: {type: "f", value: 0}
}

var floorLightMaterial = new THREE.MeshPhongMaterial({ 
	// color: THREE.NoColors, 
	side: THREE.FrontSide, 
	shininess: 300,
	transparent: true,
	blending: THREE.MultiplyBlending,
});

var checkedMaterial = new THREE.ShaderMaterial({
	uniforms: floorUniforms,
	vertexShader: document.getElementById('simpleVertexShader').innerHTML,
	fragmentShader: document.getElementById('checkedShader').innerHTML,
})

// var lightMaterial = new THREE.ShaderMaterial({
// 	uniforms: lightUniforms,
// 	vertexShader: document.getElementById('simpleVertexShader').innerHTML,
// 	fragmentShader: document.getElementById('lightShader').innerHTML,
// 	// lights: true
// })



// var simpleMaterial = new THREE.MeshBasicMaterial({color: 0x444444});

// var floorMaterials = [
// 	simpleMaterial,
// 	simpleMaterial,
// 	checkedMaterial,
// 	simpleMaterial,
// 	simpleMaterial,
// 	simpleMaterial,
// ]

var lambert

var floorbox = THREE.SceneUtils.createMultiMaterialObject( floorGeometry, [checkedMaterial, floorLightMaterial] )

// var floorbox = new THREE.Mesh(floorGeometry, floorMaterials);
floorbox.position.y -= 150;
scene.add(floorbox)

// Add Light
var pointLight = new THREE.PointLight(0xffffcc, 2, 3000, 0.2);
pointLight.position.set(20, 600, 600);

scene.add(pointLight);

var bass; var mids; var treble;

var rotation_delta = 0;
var lightDelta = 0;
var cloudDelta = 0;

function render() {

	bass = sumSpectrum(spectrum.subarray(0,32))/255;
	mids = sumSpectrum(spectrum.subarray(32, 256))/255;
	treble = sumSpectrum(spectrum.subarray(256, 1024))/255

	sphere.visible = false;
	sphereCamera.update( renderer, scene );
	sphere.visible = true;

 	analyser.getByteFrequencyData(spectrum)
	var delta = clock.getDelta();
	uniforms.a1.value = Math.pow(bass, 2) / 4;
	uniforms.a2.value = Math.pow(mids, 2) / 2;
	uniforms.a3.value = Math.pow(treble, 2) * 2;

	uniforms.a4.value = mids;
	sphere.rotation.y -= treble/10;
	rotation_delta = rotation_delta * 0.9 + ( 0.1 * mids/120)
	floorbox.rotation.y += rotation_delta;
	skyUniforms.time.value += (delta / 4.) * ( 1 + bass * 4 ) ;

	cloudDelta = ((bass - 0.2) - skyUniforms.cloudCover.value) / 5;

	skyUniforms.cloudCover.value += cloudDelta;

	delta *= bass/ 100000;
	uniforms.time.value += delta;

	lat = Math.max( - 85, Math.min( 85, lat ) );
	phi = THREE.Math.degToRad( 90 - lat );
	theta = THREE.Math.degToRad( lon );
	camera.position.x = 900 * Math.sin( phi ) * Math.cos( theta );
	camera.position.y = 900 * Math.cos( phi );
	camera.position.z = 900 * Math.sin( phi ) * Math.sin( theta );

	lightDelta = (lightDelta * 0.99) + (0.01 * (mids - 0.1)) ;
	pointLight.intensity  = Math.min(Math.max(pointLight.intensity +  lightDelta, 0.8), 4);

	camera.lookAt( sphere.position )



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


// Mouse controls Borrowed frm https://threejs.org/examples/webgl_materials_cubemap_dynamic2.html
function onWindowResized( event ) {

	renderer.setSize( window.innerWidth, window.innerHeight );

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

}

function onDocumentMouseDown( event ) {

	event.preventDefault();

	onPointerDownPointerX = event.clientX;
	onPointerDownPointerY = event.clientY;

	onPointerDownLon = lon;
	onPointerDownLat = lat;

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );

}

function onDocumentMouseMove( event ) {

	lon = ( event.clientX - onPointerDownPointerX ) * 0.1 + onPointerDownLon;
	lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;

}

function onDocumentMouseUp( event ) {

	document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
	document.removeEventListener( 'mouseup', onDocumentMouseUp, false );

}

function onDocumentMouseWheel( event ) {

	var fov = camera.fov + event.deltaY * 0.05;

	camera.fov = THREE.Math.clamp( fov, 10, 75 );

	camera.updateProjectionMatrix();

}

document.addEventListener( 'mousedown', onDocumentMouseDown, false );
document.addEventListener( 'wheel', onDocumentMouseWheel, false );
window.addEventListener( 'resize', onWindowResized, false );