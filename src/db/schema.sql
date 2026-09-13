-- Schema do banco de dados para site de streaming musical
-- SQLite

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS artists (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  bio        TEXT,
  image_url  TEXT
);

CREATE TABLE IF NOT EXISTS albums (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id     INTEGER NOT NULL,
  title         TEXT NOT NULL,
  release_date  DATE,
  cover_url     TEXT,
  FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tracks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id      INTEGER NOT NULL,
  title         TEXT NOT NULL,
  duration_sec  INTEGER NOT NULL,
  audio_url     TEXT NOT NULL,
  track_number  INTEGER,
  genre TEXT,
  cover_url TEXT,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playlists (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  name        TEXT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id  INTEGER NOT NULL,
  track_id     INTEGER NOT NULL,
  position     INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, track_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id)    REFERENCES tracks(id)    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id    INTEGER NOT NULL,
  track_id   INTEGER NOT NULL,
  added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, track_id),
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS play_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  track_id   INTEGER NOT NULL,
  played_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

-- Índices para acelerar as buscas mais comuns
CREATE INDEX IF NOT EXISTS idx_albums_artist   ON albums(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_album    ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user  ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user    ON play_history(user_id);
