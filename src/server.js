const express = require('express');
const cors = require('cors');
const path = require('path');

const catalogRoutes = require('./routes/catalog');
const playlistRoutes = require('./routes/playlists');
const activityRoutes = require('./routes/activity');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());              // permite chamadas do seu front-end HTML/JS
app.use(express.json());      // interpreta JSON no corpo das requisições

/* app.use('/audio', express.static(path.join(__dirname, 'uploads', 'audio')));
app.use('/covers', express.static(path.join(__dirname, 'uploads', 'covers'))); */

// Todas as rotas da API ficam sob /api
app.use('/api', catalogRoutes);
app.use('/api', playlistRoutes);
app.use('/api', activityRoutes);


// Sirviendo el frontend desde la carpeta padre (disco-br)
app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

const fs = require('fs');

// ELIMINAMOS EL 'src' DUPLICADO DE LAS RUTAS:
const rutaCovers = path.join(process.cwd(), 'uploads', 'covers');
const rutaAudio = path.join(process.cwd(), 'uploads', 'audio');

console.log('--------------------------------------------------');
console.log('🔍 NUEVA INVESTIGACIÓN DE PORTADAS:');
console.log('El servidor ahora busca en:');
console.log(rutaCovers);
console.log('¿Existe la carpeta? ->', fs.existsSync(rutaCovers) ? ' SÍ EXISTE' : 'NO EXISTE');
if (fs.existsSync(rutaCovers)) {
  console.log('Archivos en la carpeta:', fs.readdirSync(rutaCovers));
}
console.log('--------------------------------------------------');

// Mapear las carpetas en Express
app.use('/covers', express.static(rutaCovers));
app.use('/audio', express.static(rutaAudio));