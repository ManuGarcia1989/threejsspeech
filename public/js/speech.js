import * as THREE from './build/three.module.js';

import Stats from './libs/stats.module.js';
import { GUI } from './libs/dat.gui.module.js';

import { GLTFLoader } from './loaders/GLTFLoader.js';

let container, stats, clock, gui, mixer, actions, activeAction, previousAction;
let camera, scene, renderer, model, face;

const api = { state: 'Walking' };

const socket = io();
var Isconnected = false; 
var message = ""

const lblOnline = document.querySelector('#lblOnline');
const lblOffline = document.querySelector('#lblOffline');

socket.on('connect', () => {
    console.log('Conectado');
    Isconnected = true;
    lblOffline.style.display = 'none';
    lblOnline.style.display = '';
});
socket.on('disconnect', () => {
    console.log('Desconectado');
    Isconnected = false;
    lblOffline.style.display = '';
    lblOnline.style.display = 'none';
});
socket.on('servermessage',( payload) => {
    console.log(payload);
    if(payload == "caminar" || payload == "Caminar"){
        activeAction = actions[ 'Idle' ];
        activeAction.play();
    
        mixer.removeEventListener( 'finished', restoreState );
        fadeToAction("Walking",0.5);  
    }

    if(payload == "correr" || payload == "Correr"){
        activeAction = actions[ 'Idle' ];
        activeAction.play();    
        mixer.removeEventListener( 'finished', restoreState );
        fadeToAction("Running",0.5);  
    }

    if(payload == "Bailar" || payload == "bailar"){
        activeAction = actions[ 'Idle' ];
        activeAction.play();    
        mixer.removeEventListener( 'finished', restoreState );
        activeAction = actions[ 'Dance' ];
        activeAction.play();
    }
    function restoreState() {

        mixer.removeEventListener( 'finished', restoreState );

        fadeToAction( api.state, 0.2 );

    }
});
var message = document.querySelector('#message');
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;

var grammer = '#JSGF V1.0';

var recognition = new SpeechRecognition();
var speechRecognitionGrammerList = new SpeechGrammarList();
speechRecognitionGrammerList.addFromString(grammer,1);

recognition.grammars = speechRecognitionGrammerList;
recognition.lang = "es-ES";
recognition.continuous = true;
recognition.interimResults = false;

recognition.onresult = function(event){
    for (var i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal){
            //console.log( event.results[i][0].transcript);
            if(Isconnected){
                //Enviar data de voz 
               
            var payload = {
                message: (event.results[i][0].transcript).toString(),
                id: 'speech'
            } 
                socket.emit('sendmessage',(event.results[i][0].transcript).toString() );
                //socket.emit('message',(event.results[i][0].transcript).toString() );
            }
        }
    }
}

recognition.onspeechend = function(){
    recognition.start();
};

recognition.onerror = function(event){
    message.textContent = 'Error ocurred in recognition: ' + event.error;
}

document.querySelector('#btnGiveCommand').addEventListener('click', function(event){
    recognition.start();
});





init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
    camera.position.set( - 5, 3, 10 );
    camera.lookAt( new THREE.Vector3( 0, 2, 0 ) );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xe0e0e0 );
    scene.fog = new THREE.Fog( 0xe0e0e0, 20, 100 );

    clock = new THREE.Clock();

    // lights

    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    hemiLight.position.set( 0, 20, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff );
    dirLight.position.set( 0, 20, 10 );
    scene.add( dirLight );

    // ground

    const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
    mesh.rotation.x = - Math.PI / 2;
    scene.add( mesh );

    const grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add( grid );

    // model

    const loader = new GLTFLoader();
    loader.load( '../models/RobotExpressive.glb', function ( gltf ) {

        model = gltf.scene;
        scene.add( model );
        var animations =  gltf.animations;
        const states = [ 'Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing' ];
        const emotes = [ 'Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp' ];
        mixer = new THREE.AnimationMixer( model );

        actions = {};
    
        for ( let i = 0; i < animations.length; i ++ ) {

            const clip = animations[ i ];
            const action = mixer.clipAction( clip );
            actions[ clip.name ] = action;
    
        }
        activeAction = actions[ 'Idle' ];
    activeAction.play();

        createGUI( model, gltf.animations );

    }, undefined, function ( e ) {

        console.error( e );

    } );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize );

    // stats
    stats = new Stats();
    container.appendChild( stats.dom );

}

function createGUI( model, animations ) {

    const states = [ 'Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing' ];
    const emotes = [ 'Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp' ];

    gui = new GUI();

    mixer = new THREE.AnimationMixer( model );

    actions = {};

    for ( let i = 0; i < animations.length; i ++ ) {

        const clip = animations[ i ];
        const action = mixer.clipAction( clip );
        actions[ clip.name ] = action;

        if ( emotes.indexOf( clip.name ) >= 0 || states.indexOf( clip.name ) >= 4 ) {

            action.clampWhenFinished = true;
            action.loop = THREE.LoopOnce;

        }

    }

    // states

    const statesFolder = gui.addFolder( 'States' );

    const clipCtrl = statesFolder.add( api, 'state' ).options( states );

    clipCtrl.onChange( function () {

        fadeToAction( api.state, 0.5 );

    } );

    statesFolder.open();

    // emotes

    const emoteFolder = gui.addFolder( 'Emotes' );

    function createEmoteCallback( name ) {

        api[ name ] = function () {

            fadeToAction( name, 0.2 );

            mixer.addEventListener( 'finished', restoreState );

        };

        emoteFolder.add( api, name );

    }

    function restoreState() {

        mixer.removeEventListener( 'finished', restoreState );

        fadeToAction( api.state, 0.2 );

    }

    for ( let i = 0; i < emotes.length; i ++ ) {

        createEmoteCallback( emotes[ i ] );

    }

    emoteFolder.open();

    // expressions

    face = model.getObjectByName( 'Head_4' );

    const expressions = Object.keys( face.morphTargetDictionary );
    const expressionFolder = gui.addFolder( 'Expressions' );

    for ( let i = 0; i < expressions.length; i ++ ) {

        expressionFolder.add( face.morphTargetInfluences, i, 0, 1, 0.01 ).name( expressions[ i ] );

    }

    expressionFolder.open();

}

function fadeToAction( name, duration ) {

    previousAction = activeAction;
    activeAction = actions[ name ];

    if ( previousAction !== activeAction ) {

        previousAction.fadeOut( duration );

    }

    activeAction
        .reset()
        .setEffectiveTimeScale( 1 )
        .setEffectiveWeight( 1 )
        .fadeIn( duration )
        .play();

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    const dt = clock.getDelta();

    if ( mixer ) mixer.update( dt );

    requestAnimationFrame( animate );

    renderer.render( scene, camera );

    stats.update();

}
