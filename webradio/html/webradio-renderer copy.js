let listeRadios,
    startRadio,
    sentenceRadio,
    songs = [];

window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.quit();
};

window.onload = (e) => {
    e.returnValue = false;
};

document.querySelector(".exit").addEventListener("click", () => {
    window.electronAPI.quit();
});

document.getElementsByClassName("show-playlist")[0].addEventListener("click", function () {
    document.getElementById("white-player-playlist-container").classList.remove("slide-out-top");
    document.getElementById("white-player-playlist-container").classList.add("slide-in-top");
    document.getElementById("white-player-playlist-container").style.display = "block";
});

document.getElementsByClassName("close-playlist")[0].addEventListener("click", function () {
    document.getElementById("white-player-playlist-container").classList.remove("slide-in-top");
    document.getElementById("white-player-playlist-container").classList.add("slide-out-top");
    document.getElementById("white-player-playlist-container").style.display = "none";
});

async function appendToSongDisplay(song, index) {
    try {
        const playlistElement = document.querySelector(".white-player-playlist");

        const playlistSong = document.createElement("div");
        playlistSong.className = "white-player-playlist-song amplitude-song-container amplitude-play-pause";
        playlistSong.dataset.amplitudeSongIndex = index;

        const playlistSongImg = document.createElement("img");
        playlistSongImg.src = song.cover_art_url;

        const playlistSongMeta = document.createElement("div");
        playlistSongMeta.className = "playlist-song-meta";

        const metadata = [
            { className: "playlist-song-name", content: song.name },
            { className: "playlist-song-genre", content: song.genre },
            { className: "playlist-song-artist", content: song.artist },
        ];

        metadata.forEach(({ className, content }) => {
            const span = document.createElement("span");
            span.className = className;
            span.textContent = content;
            playlistSongMeta.appendChild(span);
        });

        playlistSong.appendChild(playlistSongImg);
        playlistSong.appendChild(playlistSongMeta);

        playlistElement.appendChild(playlistSong);
    } catch (error) {
        console.error("Erreur lors de l'ajout de la chanson à l'affichage :", error);
        throw error;
    }
}

async function getListeRadios() {
    listeRadios = await window.electronAPI.searchTop();
    if (!sentenceRadio){
        sentenceRadio = await window.electronAPI.setRadio();
    }
    if (sentenceRadio.length > 0) {
        const { name, genre, audio_stream: url, cover_art_url } = sentenceRadio[0];
        startRadio = { name, genre, url, cover_art_url };
    } else {  
        const { name, genre, audio_stream: url, cover_art_url } = listeRadios.radioStart;
        startRadio = { name, genre, url, cover_art_url };
    }

    songs.push(
        ...listeRadios.resultat.map((radio) => ({
            name: radio.name,
            genre: radio.genre,
            url: radio.audio_stream,
            cover_art_url: radio.cover_art_url,
        }))
    );

    songs.forEach((element, index) => appendToSongDisplay(element, index));

    Amplitude.init({ songs });
    Amplitude.playNow(startRadio);
}

window.electronAPI.nameRadio((_event, infoRadio) => {
    sentenceRadio = infoRadio;
    Amplitude.playNow( { name: infoRadio[0].name, genre: infoRadio[0].genre, url: infoRadio[0].audio_stream, cover_art_url: infoRadio[0].cover_art_url} );
    
})

window.electronAPI.onInitWebRadio((_event) => {
    getListeRadios();
});
