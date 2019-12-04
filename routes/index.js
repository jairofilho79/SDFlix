var express = require('express');
const axios = require('axios');
const bcrypt = require('bcrypt');
var router = express.Router();
const jsonServerPort = 1000;
const saltRounds = 10;
/* GET home page. */



// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
      console.log(123)
      res.render('movies')
  } else {
      next();
  }    
};

router.use(express.json());
router.use(express.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

// route for Home-Page
router.get('/', sessionChecker, (req, res) => {
  console.log(456)
  res.redirect('/login')
});

router.get('/login',(req,res,next)=>{
  console.log(987)
  res.render('login');
});

router.post('/login', async function(req, res) {
  const hashPassword = await bcrypt.hash(req.body.password, saltRounds);
  const user = await axios.get(`http://localhost:${jsonServerPort}/users?email=${req.body.email}&password=${hashPassword}`)
  
  if(!user) res.status(401).end("Data incorrect")
  
  req.session.user = user.name
  res.status(200).redirect('/')
})

router.get('/logout', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
      res.clearCookie('user_sid');
      res.redirect('/');
  } else {
      res.redirect('/login');
  }
});

module.exports = router;
