const express = require("express");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const uuid = require("uuid");

const router = express.Router();
const saltRounds = 10;

const adapter = new FileSync("db.json");
const db = low(adapter);

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.get("/", sessionChecker, (req, res, next) => {
  res.redirect("/login");
});

router.get("/login", sessionChecker, (req, res) => {
  res.render("login");
});

router.post("/login", loginUser);

router.get("/api/users", listUsers);
router.post("/api/users", registerUser);

router.get("/api/users", listUsers);
router.post("/api/users", registerUser);

router.all("*", (req, res) => {
  res.status(404).send({
    code: "notFound"
  });
});

db.defaults({ users: [], movies: [] }).write();

function listUsers(req, res) {
  res.send(db.get("users"));
}

function registerUser(req, res) {
  let { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send({
      code: "missingArgument"
    });
    return;
  }

  const userFind = db
    .find({ email })
    .get("users")
    .value();

  if (userFind) {
    res.status(400).send({
      code: "userExist"
    });
    return;
  }

  password = bcrypt.hashSync(password, saltRounds);
  db.get("users")
    .push({ email, password })
    .write();

  res.status(201).send(db.get("users").find({ email }));
}

function loginUser(req, res){
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send({
      code: "missingArgument"
    });
    return;
  }

  const userFind = db
    .get("users")
    .find({ email })
    .value();

  if (!userFind) {
    res.status(404).send({ code: "userNotFound" });
    return;
  }

  if (!bcrypt.compareSync(password, userFind.password)) {
    res.status(401).send({
      code: "invalidPassword"
    });
    return;
  }
  
  req.session.user = email;
  res.redirect("/");
}

// middleware function to check for logged-in users
function sessionChecker(req, res, next) {
  console.log(req.session);
  console.log(req)
  if (req.session.user && req.cookies.user_sid) {
    res.render("movies");
  } else {
    next();
  }
}

// router.post('/login', async function(req, res) {
//  try{if(req.body.password) {}} catch(e) {return}

//  console.log("olha eu aqui")
//  const {password, email} = req.body
//   const hashPassword = await bcrypt.hash(password, saltRounds);
//   const axiosResponse = await axios.get(`http://localhost:3000/api/users?email=${req.body.email}`)
//   const user = axiosResponse.data[0]

//   if(!user) {res.status(404).end("User not found"); return}

//   if(!await bcrypt.compare(password, user.password)) {res.status(401).end("Data incorrect"); return}

//   req.session.user = user.name
//   res.redirect('/')
// })

// router.get('/logout', (req, res) => {
//   if (req.session.user && req.cookies.user_sid) {
//       res.clearCookie('user_sid');
//       res.redirect('/');
//   } else {
//       res.redirect('/login');
//   }
// });

module.exports = router;
