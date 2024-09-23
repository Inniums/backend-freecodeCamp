// call required libs for this project
const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");

// Configure set up
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", (request, response) => {
  response.sendFile(process.cwd() + "/views/index.html");
});
app.use(express.static("public"));
// ends here

// Set mongo-db
mongoose.connect(process.env.MONGO_URI);
const { Schema, model } = mongoose;

// ends here

// Exercises

// 1) Using Exress Node Js
app.post("/name", (request, response) => {
  // Get inputs
  let data = request.body;
  response.json({
    name: `${data.first} ${data.last}`,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("App is listening on port", listener.address);
});
