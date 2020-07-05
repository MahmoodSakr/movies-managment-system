const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const moviesRouterFile = require("./routes/movies");
const usersRouterFile = require("./routes/users");
const fileUploading = require("./routes/uploadingFile");
const path = require("path");
const moment = require("moment");
const ejs = require("ejs");
//---------Create express application-------------
var app = express();
//--------------Middlewares-----------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "uploads")));
//---------------MongoDB Connection---------------
function db_connection_from_localhost() {
  const DbUrl = "mongodb://localhost:27017/movieDB";
  mongoose.connect(DbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
function db_connection_from_heroku() {
  // const DbUrl =
  //   "mongodb+srv://sakr:root@firstcluster-n7gej.mongodb.net/test?retryWrites=true&w=majority";
  mongoose.connect(process.env.DbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
db_connection_from_localhost();
// db_connection_from_heroku();
dbConnection = mongoose.connection;
dbConnection.once("open", () => {
  console.log("Db is connected successfully");
});
dbConnection.on("error", (error) => {
  console.error("Error is occurred during Db connection as : ", error.message);
});
//---------------Views-------------
app.set("view engine", "ejs"); // specify the used template engine
app.set("views", path.join(__dirname, "views")); // set the path of the views folder
//------------Routes---------------
app.use("/movies", moviesRouterFile);
app.use("/users", usersRouterFile);
app.use("/uploadFile", fileUploading);
//otherwise .. the bad request
app.use((req, res) => {
  res.render("badRequest");
});
//------------Launching the server---------------
var PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server is started listening to port number ${PORT} at time: ${moment()}`
  );
});
