const express = require("express");
const userModel = require("../models/user");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const router = express.Router();
//-------------Routes---------------
// Add new user from the sign up form post request
router.post(
  "/signup",
  [
    check("fname", "User first name must not be empty or decimal")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check("lname", "user last name must not be empty or decimal")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check(
      "email",
      "User email must be a valid format and not be empty or decimal"
    )
      .not()
      .isEmpty()
      .isEmail()
      .not()
      .isDecimal(),
    check("username", "Username must not be empty or decimal")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check(
      "password",
      "Password must not be empty and its length included from 4 up to 8 chars"
    )
      .not()
      .isEmpty()
      .isLength({ min: 4, max: 8 }),
    check("password2", "The two passwords are not matched").custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  (req, res) => {
    // User sign up form validation
    errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Sign up request validation errors : ", errors.array());
      return res.status(400).json({ errorMessage: errors.array() });
    }
    // Create a new user
    user = new userModel();
    user.fname = req.body.fname;
    user.lname = req.body.lname;
    user.email = req.body.email;
    user.username = req.body.username;
    user.password = req.body.password;
    // insert a new user in the db
    user.save((err, user) => {
      // error
      if (err) {
        return res.status(500).json({ errorMessage: err.message });
      }
      // if the user not be added
      if (user == null) {
        return res
          .status(500)
          .json({ message: "Cant add a new user to the db" });
      }
      // user is added on the db
      console.log("New user has been added: ", user);
      return res.status(201).json({ "New user has been added": user });
    });
  }
);

// handle the user login post request from the sign-in form
router.post(
  "/login",
  [
    check("username", "User name must not be empty or decimal")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check(
      "password",
      "Password must not be empty and contain from 4 up to 8 chars"
    )
      .not()
      .isEmpty()
      .isLength({ min: 4, max: 8 }),
  ],
  async (req, res) => {
    try {
      // User login form validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Login request validation errors", errors.array());
        return res.status(400).json({ errorMessage: errors.array() });
      }
      // Search for user data
      // if u need to use bcrypt to hash the password before the query filter, u have to do that here
      user = await userModel.findOne({
        username: req.body.username,
        password: req.body.password,
      });
      if (user == null) {
        // User not founded
        return res.status(404).json({
          message: "This user is not founded, please sign up firstly !",
        });
      } else {
        // User is existed
        // Store its username and id as a cookies to be used in the authentication and authorization processes
        userObj = {};
        userObj._id = user._id;
        userObj.username = user.username;
        var token = await jwt.sign(userObj, "secretkey");
        // for each logined use data, a jwt token is stored in the user/client  browser as a cookie
        res.cookie("token", token);
        return res.status(200).json({
          message: "This user is logined successfully.",
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
    return res.status(200).json({
      message: "No user is logined in before, please sign in !",
    });
  }
});

// Get all users
router.get("/", (req, res) => {
  userModel.find((err, users) => {
    if (err) {
      return res.status(500).json({ errorMessage: err.message });
    }
    if (users.length == 0) {
      return res.status(500).json({ message: "No users are existed in Db" });
    }
    return res.status(200).json({ "All existed users in db": users });
  });
});

router.get("/:id", (req, res) => {
  userModel.findById(req.params.id, (err, user) => {
    if (err) {
      res.status(500).json({ errorMessage: err.message });
    } else if (user == null) {
      res.status(200).json({ message: "This user is not founded in db !" });
    } else {
      res.status(200).json({
        message: `This user is founded in db and its name is ${user.username}`,
      });
    }
  });
});

// Delete user
router.delete("/delete/:id", deleting_authorization, async (req, res) => {
  try {
    // find him before deleting process
    user = await userModel.findById(req.params.id);
    if (user != null) {
      userModel.deleteOne({ _id: req.params.id }, (err, deletedResult) => {
        if (err) {
          return res.json({ errorMessage: err.message });
        }
        if (deletedResult.deletedCount == 0) {
          return res.json({ message: "User deleting operation is not done !" });
        }
        if (deletedResult.deletedCount > 0) {
          res.clearCookie("token");
          return res.json({
            message: `User ${user.username} has been deleted successfully.`,
          });
        }
      });
    } else {
      return res.json({
        message: "This user is not founded in the db to be deleted",
      });
    }
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
});
async function deleting_authorization(req, res, next) {
  try {
    if (req.cookies.token) {
      userObj = await jwt.verify(req.cookies.token, "secretkey");
      if (userObj._id == req.params.id) {
        console.log(
          `The logined user ${userObj.username} is authorized to delete his data`
        );
        next();
      } else {
        console.log(
          `The logined user ${userObj.username} is not authorized to delete other user data`
        );
        return res.status(403).json({
          message: `This user ${userObj.username} is not authorized to delete other user data`,
        });
      }
    } else {
      return res.status(403).json({
        message:
          "No user is currently logined, so the deleting process is not authorized totally!",
      });
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: error.message,
    });
  }
}

module.exports = router;
