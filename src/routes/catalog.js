const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// ---------- ARTISTAS ----------

router.get('/artists', (req, res) => {
  const artists = db.prepare('SELECT * FROM artists ORDER BY name').all();
  res.json(artists);
});

router.get('/artists/:id', (req, res) => {
  const artist = db.prepare('SELECT * FROM artists WHERE id = ?').get(req.params.id);
  if (!artist) return res.status(404).json({ error: 'Artista não encontrado' });
  const albums = db.prepare('SELECT * FROM albums WHERE artist_id = ?').all(req.params.id);
  res.json({ ...artist, albums });
});

router.post('/artists', (req, res) => {
  const { name, bio, image_url } = req.body;
  if (!name) return res.status(400).json({ error: 'name é obrigatório' });
  const result = db
    .prepare('INSERT INTO artists (name, bio, image_url) VALUES (?, ?, ?)')
    .run(name, bio || null, image_url || null);
  res.status(201).json({ id: result.lastInsertRowid, name, bio, image_url });
});

// ---------- ÁLBUNS ----------

router.get('/albums', (req, res) => {
  const albums = db.prepare('SELECT * FROM albums ORDER BY release_date DESC').all();
  res.json(albums);
});

router.get('/albums/:id', (req, res) => {
  const album = db.prepare('SELECT * FROM albums WHERE id = ?').get(req.params.id);
  if (!album) return res.status(404).json({ error: 'Álbum não encontrado' });
  const tracks = db
    .prepare('SELECT * FROM tracks WHERE album_id = ? ORDER BY track_number')
    .all(req.params.id);
  res.json({ ...album, tracks });
});

router.post('/albums', (req, res) => {
  const { artist_id, title, release_date, cover_url } = req.body;
  if (!artist_id || !title) {
    return res.status(400).json({ error: 'artist_id e title são obrigatórios' });
  }
  const result = db
    .prepare(
      'INSERT INTO albums (artist_id, title, release_date, cover_url) VALUES (?, ?, ?, ?)'
    )
    .run(artist_id, title, release_date || null, cover_url || null);
  res.status(201).json({ id: result.lastInsertRowid, artist_id, title, release_date, cover_url });
});


// ---------- FAIXAS (RUTAS CORREGIDAS CON JOIN) ----------

router.get('/tracks', (req, res) => {
  const { search } = req.query;
  let tracks;

  // Consulta base que une tracks, albums y artists para traer TODA la información junta
  const baseQuery = `
    SELECT 
      t.id,
      t.title,
      t.genre,
      t.cover_url,
      t.duration_sec,
      t.audio_url,
      t.track_number,
      a.title AS album,
      ar.name AS artist
    FROM tracks t
    LEFT JOIN albums a ON a.id = t.album_id
    LEFT JOIN artists ar ON ar.id = a.artist_id
  `;

  if (search) {
    tracks = db
      .prepare(`${baseQuery} WHERE t.title LIKE ? ORDER BY t.title`)
      .all(`%${search}%`);
  } else {
    tracks = db
      .prepare(`${baseQuery} ORDER BY t.id DESC LIMIT 100`)
      .all();
  }
  res.json(tracks);
});

router.get('/tracks/:id', (req, res) => {
  const query = `
    SELECT 
      t.id,
      t.title,
      t.genre,
      t.cover_url,
      t.duration_sec,
      t.audio_url,
      t.track_number,
      a.title AS album,
      ar.name AS artist
    FROM tracks t
    LEFT JOIN albums a ON a.id = t.album_id
    LEFT JOIN artists ar ON ar.id = a.artist_id
    WHERE t.id = ?
  `;

  const track = db.prepare(query).get(req.params.id);
  if (!track) return res.status(404).json({ error: 'Faixa não encontrada' });
  res.json(track);
});

router.post('/tracks', (req, res) => {
  const { album_id, title, duration_sec, audio_url, track_number, genre, cover_url } = req.body;
  if (!album_id || !title || !duration_sec || !audio_url) {
    return res.status(400).json({
      error: 'album_id, title, duration_sec e audio_url são obrigatórios',
    });
  }
  const result = db
    .prepare(
      'INSERT INTO tracks (album_id, title, duration_sec, audio_url, track_number, genre, cover_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(album_id, title, duration_sec, audio_url, track_number || null, genre || null, cover_url || null);
  res.status(201).json({ id: result.lastInsertRowid, album_id, title, duration_sec, audio_url, genre, cover_url });
});

// EL EXPORT SIEMPRE VA AL FINAL DE TODO EL ARCHIVO:
module.exports = router;