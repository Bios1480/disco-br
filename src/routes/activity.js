const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// ---------- FAVORITOS ----------

router.get('/users/:userId/favorites', (req, res) => {
  const favorites = db
    .prepare(
      `SELECT t.*, f.added_at
       FROM favorites f
       JOIN tracks t ON t.id = f.track_id
       WHERE f.user_id = ?
       ORDER BY f.added_at DESC`
    )
    .all(req.params.userId);
  res.json(favorites);
});

router.post('/users/:userId/favorites', (req, res) => {
  const { track_id } = req.body;
  if (!track_id) return res.status(400).json({ error: 'track_id é obrigatório' });
  db.prepare(
    'INSERT OR IGNORE INTO favorites (user_id, track_id) VALUES (?, ?)'
  ).run(req.params.userId, track_id);
  res.status(201).json({ user_id: req.params.userId, track_id });
});

router.delete('/users/:userId/favorites/:trackId', (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND track_id = ?').run(
    req.params.userId,
    req.params.trackId
  );
  res.status(204).send();
});

// ---------- HISTÓRICO DE REPRODUÇÃO ----------

// Registra uma reprodução (chamar sempre que uma faixa começa a tocar)
router.post('/users/:userId/history', (req, res) => {
  const { track_id } = req.body;
  if (!track_id) return res.status(400).json({ error: 'track_id é obrigatório' });
  const result = db
    .prepare('INSERT INTO play_history (user_id, track_id) VALUES (?, ?)')
    .run(req.params.userId, track_id);
  res.status(201).json({ id: result.lastInsertRowid, user_id: req.params.userId, track_id });
});

// Retorna as últimas faixas reproduzidas (padrão: 20)
router.get('/users/:userId/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const history = db
    .prepare(
      `SELECT t.*, ph.played_at
       FROM play_history ph
       JOIN tracks t ON t.id = ph.track_id
       WHERE ph.user_id = ?
       ORDER BY ph.played_at DESC
       LIMIT ?`
    )
    .all(req.params.userId, limit);
  res.json(history);
});

module.exports = router;
