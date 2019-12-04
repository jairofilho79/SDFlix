var express = require('express');
var jsonServer = require('json-server');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'SDFlix' });
});

router.get('/login',(req,res,next)=>{
  res.render('login');
});

router.use('/api',jsonServer.router('db.json'));

module.exports = router;
