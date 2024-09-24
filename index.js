// call required libs for this project
const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");
const { type } = require("os");
const multer = require("multer");

// Configure set up
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", (request, response) => {
  response.sendFile(process.cwd() + "/views/index.html");
});

// Set all Links
app.get("/views/exercises/express.html", (request, response) => {
  response.sendFile(process.cwd() + "/views/exercises/express.html");
});
app.get("/views/exercises/headerParser.html", (request, response) => {
  response.sendFile(process.cwd() + "/views/exercises/headerParser.html");
});
app.get("/views/exercises/timestamp.html", (request, response) => {
  response.sendFile(process.cwd() + "/views/exercises/timestamp.html");
});
app.get("/views/exercises/mongomongoose.html", (request, response) => {
  response.sendFile(process.cwd() + "/views/exercises/mongomongoose.html");
});
app.get("/views/exercises/urlshortner.html", (request, response) => {
  response.sendFile(process.cwd() + "/views/exercises/urlshortner.html");
});
app.get("/views/exercises/exercise_tracker.html", (request, response) => {
  response.sendFile(process.cwd() + "/views/exercises/exercise_tracker.html");
});
app.get("/views/exercises/file_meta_data.html", (request, response) => {
  response.sendFile(process.cwd() + "/views/exercises/file_meta_data.html");
});
// ends here

app.use(express.static("public"));
// ends here

// Connect Mongo DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Setup Schema
const { Schema, model } = mongoose;

const UrlSchema = new Schema({
  original: { required: true, type: String },
  shorturl: { type: Number },
});

const userSchema = new Schema({ username: { required: true, type: String } });

const exercise_schema = new Schema({
  username: { type: String, required: true },
  description: { type: String },
  duration: { type: Number },
  date: { type: Date },
});

// ends here

// Set Up models
const url = model("Url", UrlSchema);
const user = model("user", userSchema);
const exercise = model("exercise", exercise_schema);
// Ends here

// 1) Using Exress Node Js
app.post("/name", (request, response) => {
  // Get inputs
  let data = request.body;
  response.json({
    name: `${data.first} ${data.last}`,
  });
});

// 2) Header Parser
app.get("/views/exercises/api/whoami", (request, response) => {
  response.json({
    language: request.headers["accept-language"],
    software: request.headers["user-agent"],
    ip: request.ip,
  });
});

const isInvalidDate = (date) => isNaN(date.getTime());

// 3) Timestamp Microservice
app.get("/views/exercises/api/:date", (request, response) => {
  let data = isNaN(Number(request.params.date))
    ? request.params.date
    : Number(request.params.date);
  let d = new Date(data);
  if (isInvalidDate(d)) {
    response.json({
      error: "Invalid Date",
    });
  } else {
    response.json({
      unix: d.getTime(),
      utc: d.toUTCString(),
    });
  }
});

// Find, create or upsert
let findCreateUpsert = async (original, response) => {
  // if url exist
  let isExistUrl = await url.findOne({ original: original });
  if (isExistUrl) {
    response.json(isExistUrl);
  } else {
    // Get short url count
    let maxCount = await url
      .findOne({}, { shorturl: 1 })
      .sort({ shorturl: -1 });
    let newShort = maxCount ? maxCount.shorturl + 1 : 0;

    // Create new url
    let newUrl = await url.create({ original: original, shorturl: newShort });
    response.json(newUrl);
  }
};

// 5) Add url shortner
app.post("/views/exercises/api/:shorturl", (request, response) => {
  let originalUrl = request.body.url;

  // Check if url is valid
  try {
    let urlObj = new URL(originalUrl);
    dns.lookup(urlObj.hostname, (err, address, family) => {
      if (!address) {
        response.json({ error: "Invalid URL" });
      }
      findCreateUpsert(originalUrl, response);
    });
  } catch (e) {
    response.json({
      error: "Invalid URL",
    });
  }
});

app.get("/views/exercises/api/shorturl/:short", async (request, response) => {
  let shortUrl = request.params.short;
  // Find url by short if it exist
  let result = await url.findOne({ shorturl: shortUrl });
  if (result) {
    // redirect to url
    response.redirect(result.original);
  } else {
    // url not exist
    response.status(500).send("Url not Exist on database");
  }
});

// User Tracker
app.post("/api/users", async (request, response) => {
  let username = request.body.username;
  let result = await user.findOneAndUpdate(
    { username: username },
    { $set: { username: username } },
    { new: true, upsert: true }
  );
  if (result) {
    response.json(result);
  } else {
    response.status(500).send("User create failed");
  }
});

// get all users
app.get("/api/users", async (request, response) => {
  let result = await user.find();
  if (result) {
    response.json(result);
  } else {
    response.status(500).send("Failed to query users");
  }
});

// record exercises
app.post("/api/users/:_id/exercises", async (request, response) => {
  const _id = request.params._id;
  let query = request.body;
  // If date is not supplied or invalid use current date
  query.date = isInvalidDate(new Date(query.date))
    ? new Date().toDateString()
    : new Date(query.date).toDateString();
  let user_result = await user.findById(_id);
  if (!user_result) {
    response.status(500).send(`User _id ${_id}, does not exist`);
  } else {
    query.username = user_result.username; // add username to create body
    if (query._id) delete query[":_id"];
    let create_log = await exercise.create(query);
    if (create_log) {
      query._id = _id;
      response.json(query);
    } else {
      response.status(500).send("user exercise create failed");
    }
  }
});

// set filter condition
const condition = (from, to) => {
  let query = {};
  if (!isInvalidDate(new Date(from)) && isInvalidDate(new Date(to))) {
    query.date = { $gte: new Date(from) };
  } else if (isInvalidDate(new Date(from)) && !isInvalidDate(new Date(to))) {
    query.date = { $lte: new Date(to) };
  } else if (!isInvalidDate(new Date(from)) && !isInvalidDate(new Date(to))) {
    query.date = { $gte: new Date(from), $lte: new Date(to) };
  }
  return query;
};

// set limit
const getLimt = (limt) => (isNaN(limt) ? 100 : Number(limt));

app.get("/api/users/:_id/logs", async (request, response) => {
  const _id = request.params._id;
  const { from, to, limit } = request.query;

  // set up query condition
  let query = condition(from, to);

  // get user data
  let user_result = await user.findById(_id);
  if (!user_result) {
    response.status(500).send(`User Id ${_id} not found`);
  } else {
    // set up query condition 2
    query.username = user_result.username;
    let records = await exercise.find(query, null, { limit: getLimt(limit) });
    let logs = {};
    logs.username = user_result.username;
    logs.count = records.length;
    logs._id = _id;
    logs.log = new Array();
    records.map((item) => {
      logs.log.push({
        description: item.description,
        duration: Number(item.duration),
        date: new Date(item.date).toDateString(),
      });
    });
    response.json(logs);
  }
});

// set upload database
const upload = multer({
  dest: "./uploads",
});

app.post("/api/fileanalyse", upload.single("upfile"), (request, response) => {
  let file = request.file;
  response.json({
    name: file.originalname,
    type: file.mimetype,
    size: file.size,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("App is listening on port", listener.address().port);
});

// /api/users/:_id/logs?from=2023-04-15&to=2023-12-12&limit=10
