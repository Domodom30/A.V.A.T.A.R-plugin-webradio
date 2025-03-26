let songs = [];

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

document.querySelector("#previous").addEventListener("click", function () {
    let index = Amplitude.getActiveIndex() - 1;
    let song = Amplitude.getSongAtIndex(index);
    window.electronAPI.saveRadio(song.name);
});

document.querySelector("#next").addEventListener("click", function () {
    let index = Amplitude.getActiveIndex() + 1;
    let song = Amplitude.getSongAtIndex(index);
    window.electronAPI.saveRadio(song.name);
});

const appendToSongDisplay = (song, index) => {
    const playlistElement = document.querySelector(".white-player-playlist");

    const playlistSong = document.createElement("div");
    playlistSong.className = "white-player-playlist-song amplitude-song-container amplitude-play-pause";
    playlistSong.dataset.amplitudeSongIndex = index;

    playlistSong.addEventListener("click", () => {
        document.getElementById("white-player-playlist-container").classList.remove("slide-in-top");
        document.getElementById("white-player-playlist-container").classList.add("slide-out-top");
        document.getElementById("white-player-playlist-container").style.display = "none";

        window.electronAPI.saveRadio(song.name);
    });

    const playlistSongImg = document.createElement("img");
    playlistSongImg.src = song.cover_art_url;
    playlistSongImg.alt = `${song.name} cover art`; // Ajout d'un attribut alt pour l'accessibilité

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
};

const setListeRadios = async () => {
    const listeRadios = await window.electronAPI.searchTop();

    const newSongs = listeRadios.map((radio) => ({
        name: radio.name,
        genre: radio.genre,
        url: radio.audio_stream,
        cover_art_url: radio.cover_art_url,
    }));

    songs.push(...newSongs);

    songs.forEach((element, index) => appendToSongDisplay(element, index));

    Amplitude.init({ songs });
};

const findAndPlaySong = (infosRadio) => {
    if (!infosRadio || (!Array.isArray(infosRadio) && !infosRadio.length)) {
        console.error("No valid radio info provided");
        return;
    }

    // Normalisation du nom à rechercher
    const songNameToFind = (Array.isArray(infosRadio) ? infosRadio[0]?.name : infosRadio)?.trim().toLowerCase();
    
    if (!songNameToFind) {
        console.error("Invalid song name");
        return;
    }

    const playlistSongs = document.querySelectorAll(".white-player-playlist-song");

    let songFound = false;

    playlistSongs.forEach((playlistSong, index) => {
        const songNameElement = playlistSong.querySelector(".playlist-song-name");
        
        if (songNameElement) {
            const currentSongName = songNameElement.textContent.trim().toLowerCase();
            
            if (currentSongName === songNameToFind) {
                Amplitude.playSongAtIndex(index);
                window.electronAPI.saveRadio(songNameToFind);
                songFound = true;
            }
        }
    });

    if (!songFound) {
        console.error(`Aucune chanson trouvée avec le nom : ${songNameToFind}`);
    }
}

window.electronAPI.onInitWebRadio(async (infosRadio) => {
    await setListeRadios();
    findAndPlaySong(infosRadio); // Trouver et jouer la chanson correspondante
});
