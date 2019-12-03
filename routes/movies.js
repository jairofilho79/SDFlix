const fs = require('fs');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('movies', { title: 'Tela de catálogo' });
});

router.get('/:movieName', (req, res) => {
    const { movieName } = req.params;
    const movieFile = `./movies/${movieName}`;
    fs.stat(movieFile, (err, stats) => {
      if (err) {
        console.log(err);
        console.log(movieFile);
        return res.status(404).end('<h1>Movie Not found</h1>');
      }
      // Variáveis necessárias para montar o chunk header corretamente
      const { range } = req.headers;
      const { size } = stats;
      const start = Number((range || '').replace(/bytes=/, '').split('-')[0]);
      const end = size - 1;
      const chunkSize = (end - start) + 1;
      // Definindo headers de chunk
      res.set({
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4'
      });
      // É importante usar status 206 - Partial Content para o streaming funcionar
      res.status(206);
      // Utilizando ReadStream do Node.js
      // Ele vai ler um arquivo e enviá-lo em partes via stream.pipe()
      const stream = fs.createReadStream(movieFile, { start, end });
      stream.on('open', () => stream.pipe(res));
      stream.on('error', (streamErr) => res.end(streamErr));
    });
});

module.exports = router;