const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Conexión nativa usando tu estructura
const dbPath = path.join(__dirname, '..', 'db', 'music.db');
const db = new DatabaseSync(dbPath);

console.log('Conectado a la base de datos para poblar datos reales...');

try {
    // 1. Insertar Artistas reales si no existen
    db.exec(`
        INSERT OR IGNORE INTO artists (id, name, bio, image_url) VALUES 
        (1, 'MC Tuto', 'Artista brasileño de Funk', NULL),
        (2, 'Casey Edwards', 'Compositor musical de videojuegos de acción', NULL),
        (3, 'Shoji Meguro', 'Famoso compositor de la saga Persona', NULL),
        (4, 'Zezé Di Camargo & Luciano', 'Histórica dupla sertaneja brasileña', NULL);
    `);
    console.log('Artistas insertados o verificados.');

    db.exec(`
        INSERT OR IGNORE INTO albums (id, artist_id, title, release_date, cover_url) VALUES 
        (1, 1, 'Meu Número Single', '2023', 'covers/meu_numero.jpg'),
        (2, 2, 'Devil May Cry 5 OST', '2019', 'covers/bury_the_light.jpg'),
        (3, 3, 'Persona 5 OST', '2016', 'covers/beneath_the_mask.jpg'),
        (4, 4, 'Classicos sertanejos', '2000', 'covers/vai_cair_agua.jpg');
    `);
    console.log('Álbumes insertados o verificados.');

    db.exec(`
        UPDATE tracks SET album_id = 1 WHERE id = 1;
        UPDATE tracks SET album_id = 2 WHERE id = 2;
        UPDATE tracks SET album_id = 3 WHERE id = 3;
        UPDATE tracks SET album_id = 4 WHERE id = 4;
    `);
    console.log('Canciones vinculadas correctamente a sus respectivos artistas y álbumes.');

    console.log('Base de datos enriquecida con éxito!');

} catch (error) {
    console.error('Error al poblar la base de datos:', error.message);
}