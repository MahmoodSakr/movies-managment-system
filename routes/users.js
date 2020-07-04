const express = require("express");
const userModel = require("../models/user");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const jwt = require("jsonwebtoken");
//------------Routes---------------
// Add new user
router.post(
  "/signup",
  [
    check("fname", "First name must no be empty or decimal")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check("lname", "Last name must no be empty or decimal")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check("email", "Email must be an email valid and not empty or decimal")
      .not()
      .isEmpty()
      .isEmail()
      .not()
      .isDecimal(),
    check("username", "Username must no be empty or decimal")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check("password", "Enter a valid password (min 4: max 8) chars")
      .not()
      .isEmpty()
      .isLength({ min: 4, max: 8 }),
    check("password2", "Passwords do not match").custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  (req, res) => {
    // Check validation errors
    errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors : ", errors.array());
      return res.status(400).json({ errorMessage: errors.array() });
    }
    // Create a new user
    user = new userModel();
    user.fname = req.body.fname;
    user.lname = req.body.lname;
    user.email = req.body.email;
    user.username = req.body.username;
    user.password = req.body.password;
    user.save((err, user) => {
      if (err) {
        return res.status(500).json({ errorMessage: err.message });
      }
      if (user == null) {
        return res
          .status(500)
          .json({ message: "Cant add a new user to the db" });
      }
      console.log("New user has been added: ", user);
      return res.status(201).json({ "User is added": user });
    });
  }
);

// user login
router.post(
  "/login",
  [
    check("username", "User name must no be empty or decimal")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check(
      "password",
      "Password must not be empty and contain from (min 4: max 8) chars"
    )
      .not()
      .isEmpty()
      .isLength({ min: 4, max: 8 }),
  ],
  async (req, res) => {
    try {
      // Form login validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors", errors.array());
        return res.status(400).json({ errorMessage: errors.array() });
      }
      // Search for user data
      user = await userModel.findOne({
        username: req.body.username,
        password: req.body.password,
      });
      if (user == null) {
        // User not founded
        return res.status(404).json({
          message: "User is not found, please sign up firstly",
        });
      } else {
        // User is existed
        // Store its username and id as a cookies to be used in the authentication and authorization processes
        userObj = {};
        userObj._id = user._id;
        userObj.username = user.username;
        var token = await jwt.sign(userObj, "secretkey");
        // Store this token in he browser
        res.cookie("token", token);
        return res.status(200).json({
          message: "This user is founded and signed in",
          "User details": user,
        });
      }
    } catch (err) {
      return res.status(500).json({ errorMessage: err.message });
    }
  }
);

router.get("/logout", async (req, res) => {
  if (req.cookies.token) {
    var userObj = await jwt.verify(req.cookies.token, "secretkey");
    console.log("The signed out userObj", userObj);
    res.clearCookie("token");
    return res
      .status(200)
      .json({ message: userObj.username + " has been signed out" });
  } else {
    return res
      .status(200)
      .json({ message: "No user is signed in, please sign in firstly !" });
  }
});

// Get all users
router.get("/", (req, res) => {
  userModel.find((err, users) => {
    if (err) {
      return res.status(500).json({ errorMessage: err.message });
    }
    if (users.length == 0) {
      return res.status(500).json({ message: "No users are existed" });
    }
    return res.status(200).json({ "All Users": users });
  });
});

router.get("/:id", (req, res) => {
  userModel.findById(req.params.id, (err, user) => {
    if (err) {
      res.status(500).json({ errorMessage: err.message });
    } else if (user == null) {
      res.status(200).json({ message: "User is not found" });
    } else {
      res.status(200).json({ message: "User is already founded" });
    }
  });
});

// Delete user
router.delete("/delete/:id", async (req, res) => {
  try {
    user = await userModel.findById(req.params.id);
    if (user != null) {
      userModel.deleteMany({ _id: req.params.id }, (err, deletedResult) => {
        if (err) {
          return res.json({ errorMessage: err.message });
        }
        if (deletedResult.deletedCount == 0) {
          return res.json({ message: "User deletion is not done" });
        }
        if (deletedResult.deletedCount > 0) {
          res.clearCookie("username");
          res.clearCookie("_id");
          return res.json({ message: "user is deleted successfully" });
        }
      });
    } else {
      return res.json({ message: "User is not founded to be deleted" });
    }
  } catch (error) {
    res.status(500).json({ errorMessage: existed });
  }
});

module.exports = router;
