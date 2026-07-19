# Pasta de áudios

Coloque aqui seus arquivos .mp3 (ou .ogg, .wav, etc.).

Exemplo: se você colocar o arquivo "amor-de-verao.mp3" nesta pasta, ele
fica acessível pelo navegador em:

  http://localhost:3000/audio/amor-de-verao.mp3

E é esse link que você deve salvar no campo `audio_url` da tabela `tracks`,
ao criar a faixa via POST /api/tracks:

{
  "album_id": 1,
  "title": "Amor de verão",
  "duration_sec": 210,
  "audio_url": "/audio/amor-de-verao.mp3"
}
