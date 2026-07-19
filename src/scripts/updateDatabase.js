const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Apunta correctamente a tu base de datos en src/db/music.db
const dbPath = path.join(__dirname, '..', 'db', 'music.db');
const db = new DatabaseSync(dbPath);

console.log('Conectado a la base de datos (nativa) en:', dbPath);

// 1. Añadir columna 'genre' si no existe
try {
    db.exec("ALTER TABLE tracks ADD COLUMN genre TEXT;");
    console.log(" Columna 'genre' añadida con éxito.");
} catch (err) {
    console.log(" La columna 'genre' ya existe o no se pudo añadir.");
}

// 2. Añadir columna 'cover_url' si no existe
try {
    db.exec("ALTER TABLE tracks ADD COLUMN cover_url TEXT;");
    console.log(" La columna 'cover_url' añadida con éxito.");
} catch (err) {
    console.log(" La columna 'cover_url' ya existe o no se pudo añadir.");
}

// 3. Actualizar los datos de tus 4 canciones actuales
console.log('Actualizando datos de las canciones...');

const cancionesActualizar = [
    { id: 1, genre: 'funk', cover_url: 'covers/meu_numero.jpg' },
    { id: 2, genre: 'rock', cover_url: 'covers/bury_the_light.jpg' },
    { id: 3, genre: 'game', cover_url: 'covers/beneath_the_mask.jpg' },
    { id: 4, genre: 'sertanejo', cover_url: 'covers/vai_cair_agua.jpg' }
];

// Preparamos la consulta
const stmt = db.prepare("UPDATE tracks SET genre = ?, cover_url = ? WHERE id = ?;");

cancionesActualizar.forEach(cancion => {
    try {
        // En DatabaseSync, los parámetros se pasan como un objeto o array en .run()
        const info = stmt.run(cancion.genre, cancion.cover_url, cancion.id);

        if (info.changes > 0) {
            console.log(`  Canción ID ${cancion.id} actualizada (Género: ${cancion.genre}).`);
        } else {
            console.log(`  No se encontró la canción con ID ${cancion.id} (puede que los IDs en tu DB empiecen desde otro número).`);
        }
    } catch (err) {
        console.error(` Error actualizando canción ID ${cancion.id}:`, err.message);
    }
});

console.log(' ¡Proceso de actualización terminado con éxito!');