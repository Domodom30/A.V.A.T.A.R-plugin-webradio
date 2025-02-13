Amplitude.init({
    "bindings": {
        37: 'prev',
        39: 'next',
        32: 'play_pause'
    },
    "songs": [
        {
            "name": "Risin' High (feat Raashan Ahmad)",
            "artist": "Ancient Astronauts",
            "album": "We Are to Answer",
            "url": "https://521dimensions.com/song/Ancient Astronauts - Risin' High (feat Raashan Ahmad).mp3",
            "cover_art_url": "https://521dimensions.com/img/open-source/amplitudejs/album-art/we-are-to-answer.jpg"
        }
    ],
    
});

// Amplitude.play(() => {
// document.querySelector('#buttonPlayPause').classList.remove('amplitude-play-pause')
// })

 Amplitude.play();
  document.querySelector('#buttonPlayPause').classList.remove('amplitude-play-pause')
  document.querySelector('#buttonPlayPause').classList.add('amplitude-play-pause', 'amplitude-playing')

// document.querySelector('amplitude-play-pause').classList.remove('amplitude-paused')
// document.querySelector('amplitude-play-pause').classList.add('amplitude-playing')

window.onkeydown = function(e) {
    return !(e.keyCode == 32);
};

/*
    Handles a click on the song played progress bar.
*/
document.getElementById('song-played-progress').addEventListener('click', function( e ){
    var offset = this.getBoundingClientRect();
    var x = e.pageX - offset.left;

    Amplitude.setSongPlayedPercentage( ( parseFloat( x ) / parseFloat( this.offsetWidth) ) * 100 );
});