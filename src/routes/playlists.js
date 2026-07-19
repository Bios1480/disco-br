const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Lista as playlists de um usuário
router.get('/users/:userId/playlists', (req, res) => {
  const playlists = db
    .prepare('SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.params.userId);
  res.json(playlists);
});

// Cria uma nova playlist
router.post('/playlists', (req, res) => {
  const { user_id, name } = req.body;
  if (!user_id || !name) return res.status(400).json({ error: 'user_id e name são obrigatórios' });
  const result = db
    .prepare('INSERT INTO playlists (user_id, name) VALUES (?, ?)')
    .run(user_id, name);
  res.status(201).json({ id: result.lastInsertRowid, user_id, name });
});

// Retorna uma playlist com todas as faixas, em ordem
router.get('/playlists/:id', (req, res) => {
  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id);
  if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada' });

  const tracks = db
    .prepare(
      `SELECT t.*, pt.position
       FROM playlist_tracks pt
       JOIN tracks t ON t.id = pt.track_id
       WHERE pt.playlist_id = ?
       ORDER BY pt.position`
    )
    .all(req.params.id);

  res.json({ ...playlist, tracks });
});

// Adiciona uma faixa ao final da playlist
router.post('/playlists/:id/tracks', (req, res) => {
  const { track_id } = req.body;
  if (!track_id) return res.status(400).json({ error: 'track_id é obrigatório' });

  const last = db
    .prepare('SELECT MAX(position) AS maxPos FROM playlist_tracks WHERE playlist_id = ?')
    .get(req.params.id);
  const nextPos = (last.maxPos || 0) + 1;

  db.prepare(
    'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)'
  ).run(req.params.id, track_id, nextPos);

  res.status(201).json({ playlist_id: req.params.id, track_id, position: nextPos });
});

// Remove uma faixa da playlist
router.delete('/playlists/:id/tracks/:trackId', (req, res) => {
  db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').run(
    req.params.id,
    req.params.trackId
  );
  res.status(204).send();
});

module.exports = router;
