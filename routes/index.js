const express = require("express");
const bcrypt = require("bcrypt");
const low = require("lowdb");
const jwt = require("jsonwebtoken");
const FileSync = require("lowdb/adapters/FileSync");
const fs = require("fs");

const router = express.Router();
const saltRounds = 10;

const adapter = new FileSync("db.json");
const db = low(adapter);

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.get("/", sessionChecker, (req, res, next) => {
  res.redirect("/login");
});

router.get("/login", sessionChecker, (req, res) => {
  res.render("login");
});

router.post("/login", loginUser);
router.get("/logout", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie("user_sid");
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

router.get("/api/users", listUsers);
router.post("/api/users", registerUser);

router.get("/api/users", listUsers);
router.post("/api/users", registerUser);

router.get("/api/movies/:movieName", isLogged, (req, res) => {
  const { movieName } = req.params;

  const movieFile = `./movies/${movieName}`;

  fs.stat(movieFile, (err, stats) => {
    if (err) {
      res.status(404).send({
        code: "notFoundMovie"
      });
      return;
    }

    const { range } = req.headers;
    const { size } = stats;
    const start = Number((range || "").replace(/bytes=/, "").split("-")[0]);
    const end = size - 1;
    const chunkSize = end - start + 1;
    // Definindo headers de chunk
    res.set({
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4"
    });
    // É importante usar status 206 - Partial Content para o streaming funcionar
    res.status(206);
    // Utilizando ReadStream do Node.js
    // Ele vai ler um arquivo e enviá-lo em partes via stream.pipe()
    const stream = fs.createReadStream(movieFile, { start, end });
    stream.on("open", () => stream.pipe(res));
    stream.on("error", streamErr => res.end(streamErr));
    return;
  });
});

router.all("*", (req, res) => {
  res.status(404).send({
    code: "notFound"
  });
});

db.defaults({ users: [], movies: [] }).write();

async function isLogged(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login")
    return;
  }

  hasValidToken = await db
    .get("users")
    .find({ token: req.session.user })
    .value();

  if (!!hasValidToken && req.cookies.user_sid) {
    next()
    return;
  }
  res.redirect("/login")
}

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

async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send({
      code: "missingArgument"
    });
    return;
  }

  const userFind = await db
    .get("users")
    .find({ email })
    .value();

  if (!userFind) {
    res.status(404).send({ code: "userNotFound" });
    return;
  }

  if (!(await bcrypt.compare(password, userFind.password))) {
    res.status(401).send({
      code: "invalidPassword"
    });
    return;
  }

  const token = jwt.sign(
    { _id: email + userFind.password },
    "ldnnsdlknsdlkvn",
    { expiresIn: "7 days" }
  );

  req.session.user = token;
  await db
    .get("users")
    .find({ email })
    .assign({ token })
    .write();

  res.redirect("/");
}

// middleware function to check for logged-in users
async function sessionChecker(req, res, next) {
  if (!req.session.user) {
    next();
    return;
  }

  hasValidToken = await db
    .get("users")
    .find({ token: req.session.user })
    .value();
  if (!!hasValidToken && req.cookies.user_sid) {
    res.render("movies");
  } else {
    next();
  }
}

module.exports = router;
