var express = require('express');
const axios = require('axios');
const bcrypt = require('bcrypt');
var jsonServer = require('json-server');
var router = express.Router();
const jsonServerPort = 3000;
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
 try{if(req.body.password) {}} catch(e) {return}
 const {password, email} = req.body
  const hashPassword = await bcrypt.hash(password, saltRounds);
  const axiosResponse = await axios.get(`http://localhost:3000/api/users?email=${req.body.email}`)
  const user = axiosResponse.data[0]

  if(!user) {res.status(404).end("User not found"); return}

  if(!await bcrypt.compare(password, user.password)) {res.status(401).end("Data incorrect"); return}
  
  req.session.user = user.name
  res.redirect('/')
})

router.get('/logout', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
      res.clearCookie('user_sid');
      res.redirect('/');
  } else {
      res.redirect('/login');
  }
});
router.use('/api',jsonServer.router('db.json'));

module.exports = router;
