# API do site de streaming musical

Back-end em Node.js + Express, banco de dados em SQLite (arquivo único, sem instalação de servidor separado).

## Como rodar

```bash
cd src
npm install
npm run dev
```

> **Nota:** Este proyecto utiliza el módulo nativo `node:sqlite` de Node.js v22.5+, por lo que **no** requiere compilar módulos en C++ ni tener instalado Visual Studio Build Tools.

O servidor sobe em `http://localhost:3000`. Na primeira execução, o arquivo `db/music.db`
é criado automaticamente com todas as tabelas (`db/schema.sql`).

## Estrutura

```
music-backend/
├── db/
│   ├── schema.sql       -> definição das tabelas
│   ├── connection.js    -> abre/cria o banco SQLite
│   └── music.db         -> gerado automaticamente (não versionar)
├── routes/
│   ├── catalog.js        -> artistas, álbuns, faixas
│   ├── playlists.js      -> playlists e suas faixas
│   └── activity.js       -> favoritos e histórico de reprodução
├── uploads/
│   └── audio/             -> coloque aqui os arquivos .mp3/.ogg/.wav
├── server.js              -> ponto de entrada
└── package.json
```

## Onde ficam os arquivos de áudio

O banco de dados guarda só os **metadados** de cada música (título, duração, etc.)
e um campo `audio_url` apontando para o arquivo. O arquivo em si fica em
`uploads/audio/`, servido como estático pelo Express.

1. Copie o `.mp3` para `uploads/audio/` (ex: `uploads/audio/amor-de-verao.mp3`)
2. Ele fica acessível em `http://localhost:3000/audio/amor-de-verao.mp3`
3. Ao cadastrar a faixa (`POST /api/tracks`), use esse caminho no campo `audio_url`:

```json
{
  "album_id": 1,
  "title": "Amor de verão",
  "duration_sec": 210,
  "audio_url": "/audio/amor-de-verao.mp3"
}
```

No front-end, basta usar esse valor direto num `<audio src="...">`, prefixado
pela URL do servidor.

## Endpoints principais

| Método | Rota                                   | Descrição                          |
|--------|-----------------------------------------|-------------------------------------|
| GET    | `/api/artists`                          | Lista artistas                      |
| GET    | `/api/artists/:id`                      | Artista + seus álbuns               |
| POST   | `/api/artists`                          | Cria artista                        |
| GET    | `/api/albums/:id`                       | Álbum + suas faixas                 |
| POST   | `/api/albums`                           | Cria álbum                          |
| GET    | `/api/tracks?search=nome`               | Busca faixas por título             |
| POST   | `/api/tracks`                           | Cria faixa                          |
| GET    | `/api/users/:userId/playlists`          | Playlists do usuário                |
| POST   | `/api/playlists`                        | Cria playlist                       |
| GET    | `/api/playlists/:id`                    | Playlist + faixas em ordem          |
| POST   | `/api/playlists/:id/tracks`             | Adiciona faixa à playlist           |
| DELETE | `/api/playlists/:id/tracks/:trackId`    | Remove faixa da playlist            |
| GET    | `/api/users/:userId/favorites`          | Faixas favoritas do usuário         |
| POST   | `/api/users/:userId/favorites`          | Favorita uma faixa                  |
| DELETE | `/api/users/:userId/favorites/:trackId` | Remove dos favoritos                |
| POST   | `/api/users/:userId/history`            | Registra reprodução                 |
| GET    | `/api/users/:userId/history?limit=20`   | Últimas faixas reproduzidas         |

## Exemplo de chamada no seu front-end (JS puro)

```javascript
fetch('http://localhost:3000/api/tracks?search=amor')
  .then(res => res.json())
  .then(tracks => console.log(tracks));
```
