var audioContext = getAudioCtx();
var volumeNode,
  gainNode,
  toneNode,
  reverbNode;

$(document).ready(function () {
  initGUI();
  initAudioInput();
});

function initGUI() {
  document.getElementById('volume').addEventListener('change', function () {
    volumeNode.gain.value = this.value;
  });

  document.getElementById('gain').addEventListener('change', function () {
    gainNode.gain.value = this.value;
  });

  document.getElementById('tone').addEventListener('change', function () {
    toneNode.frequency.value = this.value;
  });

  document.getElementById('reverb').addEventListener('change', function () {
    reverbNode.time = this.value;
  });
}

function initAudioInput() {
  // Assign navigator.getUserMedia on per browser basis
  if (!navigator.getUserMedia)
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia || navigator.msGetUserMedia;

  // Start stream if possible, else display error
  if (navigator.getUserMedia) {
    navigator.getUserMedia({audio: true},
      function (stream) {
        startMicrophone(stream);
      },
      function (e) {
        alert('Error capturing audio.');
      }
    );

  } else {
    alert('getUserMedia not supported in this browser.');
  }
}

function startMicrophone(stream) {
  var microphoneStream = audioContext.createMediaStreamSource(stream);

  // Volume
  volumeNode = audioContext.createGain();

  // Gain
  gainNode = audioContext.createGain();

  // Tone
  toneNode = audioContext.createBiquadFilter();
  toneNode.type = "highshelf";
  toneNode.frequency.value = 2000;  // Hz
  toneNode.gain.value = 50;

  // Reverb
  reverbNode = Reverb(audioContext);
  reverbNode.time = 0; // seconds
  reverbNode.wet.value = 0.8;
  reverbNode.dry.value = 1;
  reverbNode.filterType = 'lowpass';
  reverbNode.cutoff.value = 4000; // Hz

  // Connect effects
  microphoneStream.connect(volumeNode);
  volumeNode.connect(gainNode);
  volumeNode.connect(reverbNode);

  reverbNode.connect(toneNode);
  toneNode.connect(audioContext.destination);

  gainNode.connect(reverbNode);
  gainNode.connect(audioContext.destination);


  // FFT
  var scriptProcessorFFTNode = audioContext.createScriptProcessor(2048, 1, 1);
  scriptProcessorFFTNode.connect(volumeNode);

  var analyserNode = audioContext.createAnalyser();
  analyserNode.smoothingTimeConstant = 0;
  analyserNode.fftSize = 2048;

  microphoneStream.connect(analyserNode);
  analyserNode.connect(scriptProcessorFFTNode);

  scriptProcessorFFTNode.onaudioprocess = function () {
    // Get average from channel
    var array = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(array);

    // Draw spectrogram
    if (microphoneStream.playbackState == microphoneStream.PLAYING_STATE) {
      draw(array, -1, 'freqDomainCanvas');
    }
  };
}

function getAudioCtx() {
  if ( window.AudioContext ) return new window.AudioContext();
  else if ( window.webkitAudioContext ) return new window.webkitAudioContext();
  else if ( window.audioContext ) return new window.audioContext();
  else alert( 'Browser audio requirements not met' );
}
