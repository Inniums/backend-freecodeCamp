// call required libs for this project
const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");

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

// ends here

// Set Up models
const url = model("Url", UrlSchema);
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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("App is listening on port", listener.address().port);
});
