const _ = require('underscore');
const EventEmitter = require('events').EventEmitter

export default class AudioHelper {
    
    constructor(options) {

        _.bindAll(this, '_isLoaded', '_render');

        this.options = options
        this.isAnalyse = this.options.isAnalyse;
        this.url = this.options.url;
        this.loop = this.options.loop;
        this.autoplay = this.options.autoplay;

        this.ee = new EventEmitter();

        this.audio = new Audio();
        this._loadSound();

    }

    _loadSound(){
        this.audio.src = this.url;
        this.audio.loop = this.loop;
        this.audio.addEventListener('canplaythrough', this._isLoaded, false);
    }

    _isLoaded(){
        if(this.autoplay){
            if(this.isAnalyse){
                this._analyser();
            }
            this.play();
        } else {
            return;
        }

    }


    _analyser(){

        if('webkitAudioContext' in window) {
            this.context = new webkitAudioContext();
        }else{
            this.context = new AudioContext();
        }
              
        this.analyser = this.context.createAnalyser();
        this.source = this.context.createMediaElementSource(this.audio);
        
        this.source.connect(this.analyser);
        this.source.connect(this.context.destination);
        this.analyser.connect(this.context.destination);
        this.analyser.fftSize = 1024;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

        requestAnimationFrame(this._render);
    }

    _getPeaksAtThreshold(data, threshold) {
        
        var peaksArray = [];
        var length = data.length;

        for(var i = 0; i < length;) {
            if (data[i] > threshold) {
                peaksArray.push(i);
                // Skip forward ~ 1/4s to get past this peak.
                i += 10000;
            }
                i++;
        }

        return peaksArray;
    }

    play() {
        if(this.isAnalyse){
            this._analyser();
        }
        this.audio.play();
    }

    slow(speed){
        this.audio.playbackRate = speed;
    }

    get(){
        return this.audio();
    }

    pause() {
        this.audio.pause();
    }

    _render(){
        this.analyser.getByteFrequencyData(this.frequencyData);
        this.ee.emit("render", this.frequencyData);
        requestAnimationFrame(this._render);
    }

    destroy(){
        this.audio.removeEventListener('canplaythrough', this.isLoaded, false);
    }

}