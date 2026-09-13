const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const catalogRoutes = require('./routes/catalog');
const playlistRoutes = require('./routes/playlists');
const activityRoutes = require('./routes/activity');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


const rutaCovers = path.join(__dirname, 'uploads', 'covers');
const rutaAudio = path.join(__dirname, 'uploads', 'audio');

console.log('--------------------------------------------------');
console.log('🔍 INVESTIGACIÓN DE ARCHIVOS:');
console.log('Servidor busca portadas en:');
console.log(rutaCovers);
console.log('¿Existe la carpeta de portadas? ->',
  fs.existsSync(rutaCovers) ? 'SÍ EXISTE' : 'NO EXISTE'
);

if (fs.existsSync(rutaCovers)) {
  console.log('Portadas encontradas:', fs.readdirSync(rutaCovers));
}

console.log('Servidor busca audios en:');
console.log(rutaAudio);
console.log('¿Existe la carpeta de audio? ->',
  fs.existsSync(rutaAudio) ? 'SÍ EXISTE' : 'NO EXISTE'
);

if (fs.existsSync(rutaAudio)) {
  console.log('Audios encontrados:', fs.readdirSync(rutaAudio));
}

console.log('--------------------------------------------------');


// ==================================================
// ARCHIVOS ESTÁTICOS
// ==================================================

app.use('/covers', express.static(rutaCovers));
app.use('/audio', express.static(rutaAudio));

app.use('/api', catalogRoutes);
app.use('/api', playlistRoutes);
app.use('/api', activityRoutes);


// ==================================================
// FRONTEND
// ==================================================

app.use(express.static(path.join(__dirname, '..')));


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
