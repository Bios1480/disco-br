const fs = require("fs");
const path = require("path");
const db = require("../db/connection");

const AUDIO_FOLDER = path.join(__dirname, "../uploads/audio");

// Obtiene todos los mp4
const files = fs.readdirSync(AUDIO_FOLDER).filter(file =>
    file.toLowerCase().endsWith(".mp4")
);

if (files.length === 0) {
    console.log("No se encontraron archivos MP4.");
    process.exit();
}

// ===========================
// ARTISTA
// ===========================

const ARTIST_NAME = "Artista Desconocido";

let artist = db.prepare(`
SELECT id
FROM artists
WHERE name = ?
`).get(ARTIST_NAME);

let artistId;

if (!artist) {

    db.prepare(`
    INSERT INTO artists(
        name,
        bio,
        image_url
    )
    VALUES(?,?,?)
    `).run(
        ARTIST_NAME,
        "",
        ""
    );

    artist = db.prepare(`
    SELECT id
    FROM artists
    WHERE name = ?
    `).get(ARTIST_NAME);
}

artistId = artist.id;

// ===========================
// ALBUM
// ===========================

const ALBUM_NAME = "Álbum Importado";

let album = db.prepare(`
SELECT id
FROM albums
WHERE title = ?
`).get(ALBUM_NAME);

let albumId;

if (!album) {

    db.prepare(`
    INSERT INTO albums(
        artist_id,
        title,
        release_date,
        cover_url
    )
    VALUES(?,?,?,?)
    `).run(
        artistId,
        ALBUM_NAME,
        "",
        ""
    );

    album = db.prepare(`
    SELECT id
    FROM albums
    WHERE title = ?
    `).get(ALBUM_NAME);
}

albumId = album.id;

// ===========================
// IMPORTAÇÃO
// ===========================

let track = 1;

for (const file of files) {

    const title = path.parse(file).name;

    const exists = db.prepare(`
    SELECT id
    FROM tracks
    WHERE title = ?
    `).get(title);

    if (exists) {

        console.log(`⏩ ${title} ya existe.`);

        continue;
    }

    db.prepare(`
    INSERT INTO tracks(
        album_id,
        title,
        duration_sec,
        audio_url,
        track_number
    )
    VALUES(?,?,?,?,?)
    `).run(
        albumId,
        title,
        0,
        `uploads/audio/${file}`,
        track
    );

    console.log(`✔ Importada: ${title}`);

    track++;
}

console.log("");
console.log("Importación finalizada.");