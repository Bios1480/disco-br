/* ===========================================================
   DISCO BR — STREAMING DE MÚSICA
   script.js — Modules: DB, Player, Navigation, UI, Import
   =========================================================== */

const DATABASE = {
    songs: [],
    playlists: [],
    users: [],
    podcasts: [],
    albums: [],
    favorites: [],
    searchHistory: []
};

/* ======================================================
   UNSPLASH IMAGE HELPER
   Imágenes de alta calidad para la interfaz
====================================================== */
const UnsplashImages = {
    base: 'https://images.unsplash.com/',
    music: [
        'photo-1511671782779-c97d3d27a1d4',
        'photo-1493225457124-a3eb161ffa5f',
        'photo-1459749411175-04bf5292ceea',
        'photo-1506157786151-b8491531f063'
    ],
    concert: [
        'photo-1501386761578-eac5c94b800a',
        'photo-1524368535928-5b5e00ddc76b',
        'photo-1429962714451-bb934ecdc4ec',
        'photo-1470229722913-7c0e2dbbafd3'
    ],
    vinyl: [
        'photo-1514320291840-2e0a9bf2a9ae',
        'photo-1516280440614-37939bbacd81',
        'photo-1539375665275-f9de415ef9ac'
    ],
    dj: [
        'photo-1470225620780-dba8ba36b745',
        'photo-1485579149621-3123dd979885',
        'photo-1571266028243-3716f02d2d3e'
    ],
    studio: [
        'photo-1598488035139-bdbb2231ce04',
        'photo-1507838153414-b4b713384a76',
        'photo-1519892300165-cb5542fb47c7'
    ],
    microphone: [
        'photo-1478737270239-2f02b77fc618',
        'photo-1590602847861-f357a9332bbc'
    ],

    buildUrl(id, width = 400, height = 400) {
        return `${this.base}${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80&fm=jpg`;
    },

    /** Get a random image from a category */
    getRandom(category) {
        const imgs = this[category] || this.music;
        const id = imgs[Math.floor(Math.random() * imgs.length)];
        return this.buildUrl(id);
    },

    /** Get all images flattened */
    getAll() {
        return [
            ...this.music,
            ...this.concert,
            ...this.vinyl,
            ...this.dj,
            ...this.studio,
            ...this.microphone
        ].map(id => this.buildUrl(id));
    }
};

/* ======================================================
   MOCK DATA
====================================================== */
const PODCASTS = [
    { id: 1, title: 'Weekly Culture', host: 'Fletcher Morse', duration: '45 min', img: UnsplashImages.getRandom('microphone') },
    { id: 2, title: 'Tech Today', host: 'Samantha Green', duration: '38 min', img: UnsplashImages.getRandom('concert') },
    { id: 3, title: 'True Crime Stories', host: 'Jessica Monroe', duration: '52 min', img: UnsplashImages.getRandom('studio') },
    { id: 4, title: 'Sound Design Lab', host: 'DJ Kyoto', duration: '29 min', img: UnsplashImages.getRandom('dj') }
];

/* ======================================================
   PLAYER STATE
====================================================== */
const player = {
    playlist: [],
    currentSong: null,
    currentIndex: 0,
    currentAudio: null,
    currentAudioUrl: null,
    isPlaying: false,
    volume: 80,
    isShuffle: false,
    isRepeat: false,
    progress: 0,
    duration: 225,
    currentTime: 0,

    play() {
        if (!this.currentSong) return;
        this.isPlaying = true;

        if (this.currentAudio) {
            this.currentAudio.volume = this.volume / 100;
            const playPromise = this.currentAudio.play();
            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.catch(() => { });
            }
        } else {
            PlayerUI.startProgressSimulation();
        }

        PlayerUI.updatePlayButton();
    },

    pause() {
        if (this.currentAudio) {
            this.currentAudio.pause();
        } else {
            PlayerUI.stopProgressSimulation();
        }
        this.isPlaying = false;
        PlayerUI.updatePlayButton();
        if (typeof PlayerControls !== 'undefined') {
            PlayerControls.updateHeroButtonState(null);
        }
    },

    togglePlay() {
        if (!this.currentSong) return;
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    },

    next() {
        if (this.playlist.length === 0) return;
        if (this.isShuffle) {
            this.currentIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        }
        this.loadSong(this.playlist[this.currentIndex]);
    },

    prev() {
        if (this.playlist.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadSong(this.playlist[this.currentIndex]);
    },

    loadSong(song) {
        this.currentSong = song;
        this.currentTime = 0;
        this.progress = 0;
        PlayerUI.updateSongInfo(song);
        PlayerUI.updateProgress(0);

        if (this.currentAudio) {
            this.currentAudio.pause();
            if (this.currentAudioUrl && this.currentAudioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(this.currentAudioUrl);
            }
        }

        if (song.file instanceof File) {
            this.currentAudioUrl = URL.createObjectURL(song.file);
            this.currentAudio = new Audio(this.currentAudioUrl);
        } else if (song.audio_url) {
            this.currentAudioUrl = song.audio_url;
            this.currentAudio = new Audio(this.currentAudioUrl);
        } else {
            this.currentAudio = null;
            this.currentAudioUrl = null;
            this.duration = 225;
        }

        if (this.currentAudio) {
            this.currentAudio.volume = this.volume / 100;
            this.currentAudio.addEventListener('ended', () => {
                if (this.isRepeat) {
                    this.currentAudio.currentTime = 0;
                    this.currentAudio.play();
                } else {
                    this.next();
                }
            });
            this.currentAudio.addEventListener('timeupdate', () => {
                this.currentTime = this.currentAudio.currentTime;
                this.duration = this.currentAudio.duration || this.duration;
                this.progress = (this.duration > 0) ? (this.currentTime / this.duration) * 100 : 0;
                PlayerUI.updateProgress(this.progress);
                PlayerUI.updateDuration(this.duration);
            });
            this.currentAudio.addEventListener('loadedmetadata', () => {
                if (!song.duration || song.duration === '--:--' || typeof song.duration === 'number') {
                    this.duration = this.currentAudio.duration || this.duration;
                    PlayerUI.updateDuration(this.duration);
                }
            });
        }

        if (this.isPlaying) {
            this.play();
        }
    },

    setVolume(val) {
        this.volume = Math.max(0, Math.min(100, val));
        if (this.currentAudio) {
            this.currentAudio.volume = this.volume / 100;
        }
        PlayerUI.updateVolume();
    },

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        const btn = document.getElementById('btn-shuffle');
        btn.classList.toggle('active', this.isShuffle);
    },

    toggleRepeat() {
        this.isRepeat = !this.isRepeat;
        const btn = document.getElementById('btn-repeat');
        btn.classList.toggle('active', this.isRepeat);
    }
};

/* ======================================================
   PLAYER UI
====================================================== */
const PlayerUI = {
    progressInterval: null,

    updatePlayButton() {
        const playIcon = document.getElementById('play-icon');
        const pauseIcon = document.getElementById('pause-icon');
        if (player.isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    },

    updateSongInfo(song) {
        if (!song) return;
        document.getElementById('player-song-name').textContent = song.name || 'Unknown';
        document.getElementById('player-artist-name').textContent = song.artist || 'Unknown Artist';
        if (song.img) {
            document.getElementById('player-thumb-img').src = song.img;
        }
        if (song.duration) {
            document.getElementById('player-total-time').textContent = song.duration;
        }
    },

    updateProgress(percent) {
        const fill = document.getElementById('progress-fill');
        fill.style.width = percent + '%';

        const elapsed = Math.floor((percent / 100) * player.duration);
        document.getElementById('player-current-time').textContent = this.formatTime(elapsed);
    },

    updateDuration(seconds) {
        if (seconds && !isNaN(seconds) && seconds > 0) {
            document.getElementById('player-total-time').textContent = this.formatTime(Math.floor(seconds));
        }
    },

    startProgressSimulation() {
        this.stopProgressSimulation();
        this.progressInterval = setInterval(() => {
            if (player.isPlaying) {
                player.currentTime += 1;
                const percent = (player.currentTime / player.duration) * 100;
                if (percent >= 100) {
                    if (player.isRepeat) {
                        player.currentTime = 0;
                    } else {
                        player.next();
                        return;
                    }
                }
                player.progress = percent;
                this.updateProgress(percent);
            }
        }, 1000);
    },

    stopProgressSimulation() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    },

    updateVolume() {
        const fill = document.getElementById('volume-fill');
        fill.style.width = player.volume + '%';
    },

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
};

/* ======================================================
   NAVIGATION
====================================================== */
const Navigation = {
    currentPage: 'home',

    goTo(pageName) {
        if (this.currentPage === pageName) return;

        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        document.querySelectorAll('.sidebar__link[data-page]').forEach(link => {
            link.classList.remove('active');
        });

        const targetPage = document.getElementById(`page-${pageName}`);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.querySelectorAll('.fade-in, .slide-up').forEach(el => {
                el.style.animation = 'none';
                el.offsetHeight;
                el.style.animation = '';
            });
        }

        const activeLink = document.querySelector(`.sidebar__link[data-page="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentPage = pageName;
        Sidebar.close();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    init() {
        document.querySelectorAll('.sidebar__link[data-page]').forEach(link => {
            link.addEventListener('click', () => {
                const page = link.dataset.page;
                this.goTo(page);
            });
        });
    }
};

/* ======================================================
   SIDEBAR
====================================================== */
const Sidebar = {
    isOpen: false,

    toggle() {
        this.isOpen = !this.isOpen;
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('mobile-toggle');
        const overlay = document.getElementById('sidebar-overlay');

        sidebar.classList.toggle('open', this.isOpen);
        toggle.classList.toggle('open', this.isOpen);
        overlay.classList.toggle('visible', this.isOpen);
    },

    close() {
        this.isOpen = false;
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('mobile-toggle');
        const overlay = document.getElementById('sidebar-overlay');

        sidebar.classList.remove('open');
        toggle.classList.remove('open');
        overlay.classList.remove('visible');
    },

    init() {
        document.getElementById('mobile-toggle').addEventListener('click', () => this.toggle());
        document.getElementById('sidebar-overlay').addEventListener('click', () => this.close());
    }
};

/* ======================================================
   RENDERER
====================================================== */
const Renderer = {

    renderInterests(items) {
        const container = document.getElementById('interests-list');
        container.innerHTML = items.map(item => `
            <div class="interest-item" data-id="${item.id}">
                <img class="interest-item__thumb" 
                     src="${item.img}" 
                     alt="${item.name}" 
                     loading="lazy">
                <div class="interest-item__info">
                    <span class="interest-item__name">${item.name}</span>
                    <span class="interest-item__artist">${item.artist}</span>
                </div>
                <span class="interest-item__genre">${item.category}</span>
                <span class="interest-item__duration">${item.duration}</span>
                <button class="interest-item__fav ${item.isFav ? 'active' : ''}" 
                        data-id="${item.id}" 
                        aria-label="Favorito">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>
            </div>
        `).join('');

        container.querySelectorAll('.interest-item__fav').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.classList.toggle('active');
                const id = parseInt(btn.dataset.id);
                const item = DATABASE.songs.find(i => i.id === id);
                if (item) item.isFav = !item.isFav;
            });
        });

        container.querySelectorAll('.interest-item').forEach(row => {
            row.addEventListener('click', () => {
                const id = parseInt(row.dataset.id);
                const item = DATABASE.songs.find(i => i.id === id);
                if (item) {
                    player.loadSong(item);
                    if (!player.isPlaying) player.togglePlay();
                }
            });
        });
    },

    renderCards(items) {
        const container = document.getElementById('card-grid');
        container.innerHTML = items.map(item => `
            <div class="music-card" data-id="${item.id}" data-category="${item.category}">
                <div class="music-card__img-wrap">
                    <img class="music-card__img" 
                         src="${item.img}" 
                         alt="${item.name}" 
                         loading="lazy">
                    <button class="music-card__play" aria-label="Play ${item.name}">
                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </button>
                </div>
                <div class="music-card__body">
                    <div class="music-card__name">${item.name}</div>
                    <div class="music-card__author">${item.artist}</div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.music-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const item = DATABASE.songs.find(c => c.id === id);
                if (item) {
                    player.loadSong(item);
                    player.play();
                }
            });
        });
    },

    renderPlaylists(items) {
        const container = document.getElementById('playlist-grid');
        container.innerHTML = items.map(item => `
            <div class="playlist-card" data-id="${item.id}">
                <div class="playlist-card__img-wrap">
                    <img class="playlist-card__img" 
                         src="${item.img}" 
                         alt="${item.name}" 
                         loading="lazy">
                </div>
                <div class="playlist-card__body">
                    <div class="playlist-card__name">${item.name}</div>
                    <div class="playlist-card__count">${item.songCount} canciones</div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.playlist-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id, 10);
                PlaylistManager.selectPlaylist(id);
            });
        });
    },

    renderPlaylistDetails(playlist) {
        const list = document.getElementById('playlist-songs-list');
        const status = document.getElementById('playlist-details-status');
        if (!playlist) {
            status.textContent = 'Selecciona una playlist para ver las canciones';
            list.innerHTML = '<p class="playlist-details__empty">Selecciona una playlist disponible arriba.</p>';
            return;
        }

        const songs = playlist.songs || [];
        const count = songs.length || playlist.songCount;
        status.textContent = `${playlist.name} · ${count} canciones`;

        if (songs.length === 0) {
            list.innerHTML = '<p class="playlist-details__empty">Esta playlist aún no tiene canciones.</p>';
            return;
        }

        list.innerHTML = songs.map(song => `
            <div class="playlist-song-item">
                <div class="playlist-song-item__left">
                    <span class="playlist-song-item__title">${song.name}</span>
                    <span class="playlist-song-item__artist">${song.artist}</span>
                </div>
                <span class="playlist-song-item__duration">${song.duration}</span>
            </div>
        `).join('');
    },

    renderPodcasts(items) {
        const container = document.getElementById('podcast-grid');
        container.innerHTML = items.map(item => `
            <div class="podcast-card">
                <div class="podcast-card__img-wrap">
                    <img class="podcast-card__img" 
                         src="${item.img}" 
                         alt="${item.title}" 
                         loading="lazy">
                </div>
                <div class="podcast-card__body">
                    <div class="podcast-card__title">${item.title}</div>
                    <div class="podcast-card__meta">${item.host} · ${item.duration}</div>
                </div>
            </div>
        `).join('');
    },

    renderImportedSongs(songs) {
        const list = document.getElementById('imported-list');
        const empty = document.getElementById('imported-empty');

        if (songs.length === 0) {
            list.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        const hasSelectedPlaylist = !!PlaylistManager.selectedPlaylistId;
        empty.style.display = 'none';
        list.innerHTML = songs.map((song, idx) => `
            <div class="imported-item" data-index="${idx}">
                <div class="imported-item__cover">🎵</div>
                <div class="imported-item__info">
                    <span class="imported-item__name">${song.name}</span>
                    <span class="imported-item__artist">${song.artist || 'Artista desconocido'}</span>
                </div>
                <span class="imported-item__duration">${song.duration || '--:--'}</span>
                <div class="imported-item__actions">
                    <button class="imported-item__add" data-index="${idx}" ${hasSelectedPlaylist ? '' : 'disabled title="Selecciona una playlist"'}>
                        Agregar
                    </button>
                    <button class="imported-item__delete" data-index="${idx}" aria-label="Eliminar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.imported-item__delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                MusicImporter.removeSong(idx);
            });
        });

        list.querySelectorAll('.imported-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.index, 10);
                const song = MusicImporter.importedSongs[idx];
                if (!song) return;
                player.loadSong(song);
                player.play();
                if (PlayerControls && typeof PlayerControls.updateHeroButtonState === 'function') {
                    PlayerControls.updateHeroButtonState(null);
                }
            });
        });

        list.querySelectorAll('.imported-item__add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index, 10);
                const song = MusicImporter.importedSongs[idx];
                PlaylistManager.addSongToSelectedPlaylist(song);
            });
        });
    }
};

/* ======================================================
   CATEGORY FILTER
====================================================== */
const CategoryFilter = {
    current: 'all',

    init() {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const category = btn.dataset.category;
                this.current = category;
                this.filter(category);
            });
        });
    },

    filter(category) {
        if (category === 'all') {
            Renderer.renderCards(DATABASE.songs);
        } else {
            const filtered = DATABASE.songs.filter(c => c.category === category);
            Renderer.renderCards(filtered);
        }
    }
};

/* ======================================================
   MUSIC IMPORTER
====================================================== */
const MusicImporter = {
    importedSongs: [],
    acceptedFormats: ['.mp3', '.wav', '.ogg', '.flac', '.mp4'],

    init() {
        const importBtn = document.getElementById('btn-import-music');
        const fileInput = document.getElementById('file-input');

        importBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
            fileInput.value = '';
        });
    },

    handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!this.acceptedFormats.includes(ext)) {
                console.warn(`Formato no soportado: ${file.name}`);
                return;
            }

            const song = {
                id: Date.now() + Math.random(),
                name: file.name.replace(/\.[^/.]+$/, ''),
                artist: this.extractArtist(file.name) || 'Artista Desconocido',
                duration: '--:--',
                seconds: null,
                file: file,
                size: file.size,
                type: file.type,
                addedAt: new Date().toISOString(),
                img: UnsplashImages.getRandom('music'),
                category: 'pop'
            };

            this.importedSongs.push(song);
            DATABASE.songs.push(song);
            this.loadAudioMetadata(song);
        });

        Renderer.renderImportedSongs(this.importedSongs);
    },

    loadAudioMetadata(song) {
        const url = URL.createObjectURL(song.file);
        const audio = new Audio(url);

        audio.addEventListener('loadedmetadata', () => {
            song.seconds = audio.duration;
            song.duration = PlayerUI.formatTime(Math.floor(audio.duration));
            Renderer.renderImportedSongs(this.importedSongs);
            URL.revokeObjectURL(url);
        });

        audio.addEventListener('error', () => {
            URL.revokeObjectURL(url);
        });
    },

    extractArtist(filename) {
        const name = filename.replace(/\.[^/.]+$/, '');
        if (name.includes(' - ')) {
            return name.split(' - ')[0].trim();
        }
        return null;
    },

    removeSong(index) {
        if (index >= 0 && index < this.importedSongs.length) {
            this.importedSongs.splice(index, 1);
            Renderer.renderImportedSongs(this.importedSongs);
        }
    }
};

/* ======================================================
   PLAYLIST MANAGER
====================================================== */
const PlaylistManager = {
    playlists: [],

    init() {
        const btnNew = document.getElementById('btn-new-playlist');
        const modal = document.getElementById('modal-new-playlist');
        const btnCancel = document.getElementById('modal-cancel');
        const btnConfirm = document.getElementById('modal-confirm');
        const input = document.getElementById('input-playlist-name');

        btnNew.addEventListener('click', () => {
            modal.classList.add('open');
            input.value = '';
            setTimeout(() => input.focus(), 100);
        });

        btnCancel.addEventListener('click', () => {
            modal.classList.remove('open');
        });

        btnConfirm.addEventListener('click', () => {
            const name = input.value.trim();
            if (name) {
                this.createPlaylist(name);
                modal.classList.remove('open');
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('open');
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                btnConfirm.click();
            }
        });
    },

    selectedPlaylistId: null,

    createPlaylist(name) {
        const newPlaylist = {
            id: Date.now(),
            name: name,
            songCount: 0,
            img: UnsplashImages.getRandom('music'),
            songs: []
        };
        this.playlists.push(newPlaylist);
        DATABASE.playlists.push(newPlaylist);
        Renderer.renderPlaylists(this.playlists);
    },

    async selectPlaylist(id) {
        this.selectedPlaylistId = id;
        try {
            const response = await fetch(`/api/playlists/${id}`);
            if (response.ok) {
                const data = await response.json();
                const playlist = this.playlists.find(item => item.id === id);
                if (playlist) {
                    playlist.songs = data.tracks.map(t => ({
                        id: t.id,
                        name: t.title,

                        // CORRECCIÓN AQUÍ: Usar el artista real de la playlist
                        artist: t.artist || t.author || 'Artista Desconocido',

                        duration: PlayerUI.formatTime(t.duration_sec),
                        audio_url: t.audio_url,
                        img: t.cover_url ? '/' + t.cover_url.replace(/^\//, '') : UnsplashImages.getRandom('music')
                    }));
                    playlist.songCount = playlist.songs.length;
                    Renderer.renderPlaylistDetails(playlist);
                }
            } else {
                const playlist = this.playlists.find(item => item.id === id);
                Renderer.renderPlaylistDetails(playlist);
            }
        } catch (error) {
            console.error('Error fetching playlist details:', error);
            const playlist = this.playlists.find(item => item.id === id);
            Renderer.renderPlaylistDetails(playlist);
        }
        Renderer.renderImportedSongs(MusicImporter.importedSongs);
    },

    addSongToSelectedPlaylist(song) {
        const playlist = this.playlists.find(item => item.id === this.selectedPlaylistId);
        if (!playlist || !song) return;

        const exists = playlist.songs.some(playlistSong => playlistSong.id === song.id);
        if (exists) return;

        playlist.songs.push({
            id: song.id,
            name: song.name,
            artist: song.artist || 'Artista desconocido',
            duration: song.duration || '--:--',
            file: song.file || null,
            img: song.img || UnsplashImages.getRandom('music'),
            source: 'imported'
        });
        playlist.songCount = playlist.songs.length;
        Renderer.renderPlaylistDetails(playlist);
        Renderer.renderPlaylists(this.playlists);
    }
};

/* ======================================================
   PLAYER CONTROLS
====================================================== */
const PlayerControls = {
    init() {
        document.getElementById('btn-play-pause').addEventListener('click', () => {
            player.togglePlay();
        });

        document.getElementById('btn-next').addEventListener('click', () => {
            player.next();
        });

        document.getElementById('btn-prev').addEventListener('click', () => {
            player.prev();
        });

        document.getElementById('btn-shuffle').addEventListener('click', () => {
            player.toggleShuffle();
        });

        document.getElementById('btn-repeat').addEventListener('click', () => {
            player.toggleRepeat();
        });

        document.getElementById('player-fav').addEventListener('click', function () {
            this.classList.toggle('active');
        });

        document.getElementById('progress-bar').addEventListener('click', (e) => {
            const bar = e.currentTarget;
            const rect = bar.getBoundingClientRect();
            const percent = ((e.clientX - rect.left) / rect.width) * 100;
            player.currentTime = Math.floor((percent / 100) * player.duration);
            player.progress = percent;
            PlayerUI.updateProgress(percent);
        });

        document.getElementById('volume-bar').addEventListener('click', (e) => {
            const bar = e.currentTarget;
            const rect = bar.getBoundingClientRect();
            const percent = ((e.clientX - rect.left) / rect.width) * 100;
            player.setVolume(percent);
        });

        let prevVolume = player.volume;
        document.getElementById('btn-volume').addEventListener('click', () => {
            if (player.volume > 0) {
                prevVolume = player.volume;
                player.setVolume(0);
            } else {
                player.setVolume(prevVolume);
            }
        });

        const heroLeft = document.getElementById('hero-play-left');
        const heroRight = document.getElementById('hero-play-right');
        const heroCardLeft = document.getElementById('hero-card-left');
        const heroCardRight = document.getElementById('hero-card-right');

        const updateHeroLabels = (activeSide) => {
            const leftText = heroLeft.querySelector('.hero__btn-text');
            const rightText = heroRight.querySelector('.hero__btn-text');

            if (activeSide === 'left') {
                leftText.textContent = 'Tocando';
                heroLeft.classList.add('hero__btn--playing');
                rightText.textContent = 'Play now';
                heroRight.classList.remove('hero__btn--playing');
            } else if (activeSide === 'right') {
                rightText.textContent = 'Tocando';
                heroRight.classList.add('hero__btn--playing');
                leftText.textContent = 'Play now';
                heroLeft.classList.remove('hero__btn--playing');
            } else {
                leftText.textContent = 'Play now';
                rightText.textContent = 'Play now';
                heroLeft.classList.remove('hero__btn--playing');
                heroRight.classList.remove('hero__btn--playing');
            }
        };

        const playLeft = () => {
            player.loadSong({
                name: 'True Crime Weekly',
                artist: 'Jessica Monroe',
                img: UnsplashImages.buildUrl('photo-1493225457124-a3eb161ffa5f', 120, 120),
                duration: '45:00'
            });
            player.play();
            updateHeroLabels('left');
        };

        const playRight = () => {
            player.loadSong({
                name: 'The Daily Recap',
                artist: 'Michael Lane',
                img: UnsplashImages.buildUrl('photo-1511671782779-c97d3d27a1d4', 120, 120),
                duration: '35:00'
            });
            player.play();
            updateHeroLabels('right');
        };

        heroLeft.addEventListener('click', (e) => {
            e.stopPropagation();
            playLeft();
        });
        heroCardLeft.addEventListener('click', playLeft);

        heroRight.addEventListener('click', (e) => {
            e.stopPropagation();
            playRight();
        });
        heroCardRight.addEventListener('click', playRight);

        this.updateHeroButtonState = updateHeroLabels;
    }
};

/* ======================================================
   INTERSECTION OBSERVER
====================================================== */
const ScrollAnimations = {
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('slide-up');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        document.querySelectorAll('.interests, .categories, .card-grid, .import-section, .imported-songs').forEach(el => {
            observer.observe(el);
        });
    }
};

/* ======================================================
   KEYBOARD SHORTCUTS
====================================================== */
const KeyboardShortcuts = {
    init() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    player.togglePlay();
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey) player.next();
                    break;
                case 'ArrowLeft':
                    if (e.ctrlKey) player.prev();
                    break;
                case 'ArrowUp':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        player.setVolume(player.volume + 5);
                    }
                    break;
                case 'ArrowDown':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        player.setVolume(player.volume - 5);
                    }
                    break;
                case 'KeyM':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        document.getElementById('btn-volume').click();
                    }
                    break;
            }
        });
    }
};

/* ======================================================
   APP INITIALIZATION
====================================================== */
const App = {
    init() {
        console.log('🎵 Disco BR — Initializing...');

        Navigation.init();
        Sidebar.init();
        PlayerControls.init();
        CategoryFilter.init();
        MusicImporter.init();
        PlaylistManager.init();
        ScrollAnimations.init();
        KeyboardShortcuts.init();

        Renderer.renderPodcasts(PODCASTS);

        this.loadData();

        PlayerUI.updateVolume();

        console.log('✅ Disco BR — Ready!');
    },

    async loadData() {
        try {
            const tracksRes = await fetch('/api/tracks');
            if (tracksRes.ok) {
                const tracksData = await tracksRes.json();
                DATABASE.songs = tracksData.map(track => {
                    const audioUrl = track.audio_url
                        ? track.audio_url.replace(/^uploads\/audio\//, '/audio/')
                        : '';
                    console.log("Ruta de audio:", audioUrl);

                    // SISTEMA INTELIGENTE DE PORTADAS:
                    // Si existe ruta local, la usamos. Si no, usamos una imagen de Unsplash como respaldo.
                    let coverImg = (track.cover_url && track.cover_url.trim() !== '')
                        ? '/' + track.cover_url.replace(/^\\/, '/')
                        : UnsplashImages.getRandom('music');

                    return {
                        id: track.id,
                        name: track.title,
                        artist: track.artist || track.author || 'Artista Desconocido', // Muestra el artista real de fill-db
                        duration: PlayerUI.formatTime(track.duration_sec),
                        duration_sec: track.duration_sec,
                        audio_url: audioUrl,
                        img: coverImg,
                        category: track.genre || 'pop' // Muestra el género dinámico
                    };
                });
                Renderer.renderCards(DATABASE.songs);
                Renderer.renderInterests(DATABASE.songs.slice(0, 5));
                player.playlist = DATABASE.songs;

                // PLAN B MÁXIMO: Si la imagen física da un error 404 (no existe en la carpeta local),
                // reemplázala automáticamente por una de Unsplash para evitar el icono roto de imagen.
                setTimeout(() => {
                    document.querySelectorAll('.music-card__img, .interest-item__thumb').forEach(img => {
                        img.onerror = function () {
                            this.src = UnsplashImages.getRandom('music');
                            this.onerror = null; // Evita bucles infinitos
                        };
                    });
                }, 500);
            }

            const playRes = await fetch('/api/users/1/playlists');
            if (playRes.ok) {
                const playData = await playRes.json();
                PlaylistManager.playlists = playData.map(pl => ({
                    id: pl.id,
                    name: pl.name,
                    songCount: 0,
                    img: UnsplashImages.getRandom('music'),
                    songs: []
                }));
                DATABASE.playlists = PlaylistManager.playlists;
                Renderer.renderPlaylists(PlaylistManager.playlists);
            }
        } catch (error) {
            console.error('Error fetching API data:', error);
        }
        Renderer.renderPlaylistDetails(null);
    }
};

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});