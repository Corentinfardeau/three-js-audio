/**********************************************************************

APP

**********************************************************************/

window.THREE = require('three');

require('../vendors/TrackballControls.js');
require('gsap');
const _ = require('underscore');
import Cube from "./cube";
import AudioHelper from "./audio-helper.js";

class App {

	constructor(){
		
		_.bindAll(this, 'animate', 'moveEqualizer', 'updateCircle', 'slow', 'start');
		
		let WIDTH = window.innerWidth;
		let	HEIGHT = window.innerHeight;
		let VIEW_ANGLE = 45;
		let ASPECT = WIDTH / HEIGHT;
		let NEAR = 0.1;
		let FAR = 10000;
		let container = document.getElementsByClassName('container')[0];
		let size = 1000;
		let step = 10;

		this.angle = 0;
		this.angleSpeed = 1;
		this.radius = 1000;
		this.clock = new THREE.Clock();
		this.renderer = new THREE.WebGLRenderer({ antialias: true});
		this.camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
		this.scene = new THREE.Scene();
		this.scene.add(this.camera);
		this.camera.position.y = 300;
		this.renderer.setSize(WIDTH, HEIGHT);
		this.cubeSize = 3;
		this.nbCubes = 300;
		this.slower = false;
		this.currentSpeed = 1;

		container.appendChild(this.renderer.domElement);

		this.renderer.render(this.scene, this.camera);
		this.renderer.setClearColor( 0x000000, 1); 
		this.renderer.shadowMap.enabled = true;

		this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
		this.controls.target.set(0, 0, 0);
		this.controls.rotateSpeed = 5.0;
		this.controls.zoomSpeed = 2.2;
		this.controls.panSpeed = 1;
		this.controls.dynamicDampingFactor = 0.3;
 		
		this.animateIn();

	}

	start(){

		//AUDIO
		let opts = {
			url : 'assets/audio/audio.mp3',
			autoplay : false,
			loop : true,
			isAnalyse : true
		}

		this.audioHelper = new AudioHelper(opts);
		this.audioHelper.ee.on("render", this.moveEqualizer);
		this.audioHelper.ee.on("render", this.updateCircle);

		//Circle in the center
		let radius = 10;
	    let segments = 64;
	    let material = new THREE.LineBasicMaterial({linewidth: 10, color: 0xffffff } );
	    let geometry = new THREE.CircleGeometry(radius, segments);
		geometry.vertices.shift();
		this.line = new THREE.Line( geometry, material );
		this.line.position.y = 150;
		this.scene.add(this.line);

		//TERRAIN
		let texture = new THREE.Texture(this.generateTexture()); 
		texture.needsUpdate = true;

		let planeGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
		var planeMaterial = new THREE.MeshLambertMaterial({ map : texture, side:THREE.DoubleSide, shading: THREE.SmoothShading } );
		this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
		this.plane.rotation.x = -0.5 * Math.PI;
		this.plane.receiveShadow = true;
		this.plane.castShadow = true;
		this.plane.alpha = 0;
		this.scene.add(this.plane);

		this.updateTerrain();
		this.addEqualizer();
		this.addLight();
		this.animate();

		document.addEventListener('mousedown', this.slow);
		document.addEventListener('mouseup', this.slow);
		document.querySelector('.start').addEventListener('click', function(){
			
			this.audioHelper.play();
			
			TweenMax.to(document.querySelector('.overlay'), 1, {
				opacity : 0
			});

			TweenMax.to(document.querySelector('.start'), 1, {
				autoAlpha : 0,
			});

		}.bind(this));


	}

	slow(){

		if(this.slower){
			this.slower = false;
		}else{
			this.slower = true;
		}
		
	}

	addLight(){

		var spotLight = new THREE.SpotLight( 0xffffff, 1);
		spotLight.position.set( 0, 1000, 500 );
	    spotLight.castShadow = true;
	    spotLight.shadow.mapSize.width = 1024;
	    spotLight.shadow.mapSize.height = 1024;


		var spotLight2 = new THREE.SpotLight( 0xff3f00, 0.4);
		spotLight2.position.set( 300, 1000, 0 );
		spotLight2.rotation.z = -0.2 * Math.PI;
	    spotLight2.castShadow = true;
	    spotLight2.shadow.mapSize.width = 1024;
	    spotLight2.shadow.mapSize.height = 1024;

		this.scene.add(spotLight);
		this.scene.add(spotLight2);

	}

	addEqualizer(){

		this.cubes = [];
		let rayon = 200;


	    for (var i = 0; i < this.nbCubes; i++) {

	    	let slice = 2 * Math.PI / this.nbCubes*2;
	    	let t = slice * i;
	    	let float = {
		    	x: rayon*Math.cos(t),
				y: rayon*Math.sin(t)
	    	}

	    	let cube = new Cube(this.cubeSize);			

			cube.position.x = float.x;
			cube.position.z = float.y;

			this.scene.add(cube);	
			this.cubes.push(cube);	
		}
	}

	updateCircle(frequencyData){

		let scale = frequencyData[0]*0.01;

		this.line.scale.x = scale;
		this.line.scale.y = scale;
		this.line.scale.z = scale;

		this.magnitude = scale*2.5;

	}

	moveEqualizer(frequencyData){
		console.log(frequencyData);
		for (var i = 0; i < this.cubes.length; i++) {
			var frequence = frequencyData[i];
			this.cubes[i].position.y = frequence + 40;
		}
	}

	updateTerrain(ts, magnitude){

		if(magnitude < 2){
			magnitude = 2
		}

		let center = new THREE.Vector2(0,0);
		for (let i = 0; i < this.plane.geometry.vertices.length; i++) {
			let v = this.plane.geometry.vertices[i];
			let dist = new THREE.Vector2(v.x, v.y).sub(center);
			let size = 2.0;
			v.z = Math.sin(dist.length()/-size + (ts/500)) * magnitude;
		}

		this.plane.geometry.computeFaceNormals();
		this.plane.geometry.computeVertexNormals();
		this.plane.geometry.verticesNeedUpdate = true;
	}

	animate(ts){
		
		this.updateTerrain(ts, this.magnitude);
		
		var delta = this.clock.getDelta();
		this.controls.update(delta);
		this.renderer.render(this.scene, this.camera);
		window.requestAnimationFrame(this.animate);

		if (this.slower){
			
			if(this.angleSpeed <= 0.3){
				this.angleSpeed = 0.3;
			} else {
				this.angleSpeed -= 0.1;
			}

			if(this.currentSpeed <= 0.5){
            	this.currentSpeed = 0.5;
        	}else{
        		this.currentSpeed -= 0.005;
        	}

			this.angle += this.angleSpeed*0.007;
        	this.rotateCamera(true);
			this.audioHelper.slow(this.currentSpeed);
		} else {

			this.angle += this.angleSpeed*0.007;
			this.angleSpeed += 0.1
        	if(this.angleSpeed >= 1){
            	this.angleSpeed = 1;
        	}

			this.currentSpeed += 0.008;
			if(this.currentSpeed >= 1){
            	this.currentSpeed = 1;
        	}

			this.rotateCamera();
			this.audioHelper.slow(this.currentSpeed);
		}
	}

	animateIn() {
		let animateEl = document.getElementsByClassName('animate');

		let tl = new TimelineMax({
			onComplete : this.start,
			onCompleteScope : this
		});

		tl.staggerFromTo(animateEl[0].querySelectorAll('span'), 1, {
			opacity: 0,
			y: 20
		},{
			opacity: 1,
			y: 0
		}, 0.1, 0);

		tl.fromTo(animateEl[1], 1, {
			opacity: 0,
			y: 20
		},{
			opacity: 1,
			y: 0
		}, 0.2);

		tl.fromTo(document.getElementsByClassName('start')[0], 1, {
			opacity: 0,
			y: 20
		},{
			opacity: 1,
			y: 0
		}, 0.4);
	}

	generateTexture() {

		let canvas = document.createElement( 'canvas' );
		canvas.width = 1024;
		canvas.height = 1024;

		let context = canvas.getContext( '2d' );

		context.rect( 0, 0, canvas.width, canvas.height );
		let gradient = context.createLinearGradient( 0, 0, canvas.width, canvas.height );
		gradient.addColorStop(0, '#fd746c');
		gradient.addColorStop(1, '#ff9068');
		context.fillStyle = gradient;
		context.fill();

		return canvas;
	}

	rotateCamera(slower){
	
		this.camera.position.x = this.radius * Math.cos( this.angle );  			
		this.camera.position.z = this.radius * Math.sin( this.angle );
	
	}

}

new App();