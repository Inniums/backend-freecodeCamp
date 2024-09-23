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

// set mongo-db
// mongoose.connect(process.env.M)
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("App is listening on port", listener.address);
});
