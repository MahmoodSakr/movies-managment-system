const express = require("express");
router = express.Router();
const { check, validationResult } = require("express-validator");
const movieModel = require("../models/movie");
const jwt = require("jsonwebtoken");
//------------Routes---------------
// Show all movies
router.get("/", (req, res) => {
  movieModel.find((err, movies) => {
    if (err) {
      return res.status(500).json({ errorMessage: err.message });
    }
    if (movies.length == 0) {
      return res
        .status(200)
        .json({ message: "No movies are existed in the db" });
    } else {
      return res.status(200).json({ "All existed movies": movies });
    }
  });
});
// Add a new movie + Authorization + Authentication
router.post(
  "/add",
  authenticate,
  [
    check(
      "name",
      "Please enter a valid movie name :: not empty, decimal, or email "
    )
      .not()
      .isEmpty()
      .not()
      .isDecimal()
      .not()
      .isEmail(),
    check(
      "category",
      "Please enter a valid category name :: not empty, decimal, or email "
    )
      .not()
      .isEmpty()
      .not()
      .isDecimal()
      .not()
      .isEmail(),
    check(
      "productionCompany",
      "Please enter a valid productionCompany name :: not empty, decimal, or email "
    )
      .not()
      .isEmpty()
      .not()
      .isDecimal()
      .not()
      .isEmail(),
    check(
      "productionYear",
      "Please enter a valid productionYear :: not empty, letters, or email "
    )
      .not()
      .isEmpty()
      .isDecimal()
      .not()
      .isEmail(),
  ],
  async (req, res) => {
    // Form validation
    const errors = validationResult(req);
    // check errors
    if (!errors.isEmpty()) {
      return res.json({ errorMessage: errors.array() });
    }
    // No Errors
    // Get the hashed cookies and get the user id to be inserted as a owner id for the movie
    var userObj = {};
    try {
      userObj = await jwt.verify(req.cookies.token, "secretkey");
    } catch (error) {
      return res.json({ errorMessage: errors.message });
    }
    // Add a new movie
    movieObj = new movieModel();
    movieObj.owner_id = userObj._id;
    movieObj.name = req.body.name;
    movieObj.category = req.body.category;
    movieObj.productionCompany = req.body.productionCompany;
    movieObj.productionYear = req.body.productionYear;
    movieObj.save((err, movie) => {
      // error checking
      if (err) {
        return res.status(500).json({ errorMessage: err.message });
      }
      // No Error
      // Check for the adding of a new movie document in the db
      // Is adding is done
      if (movie != null) {
        console.log("New movie is added", movie);
        return res.status(201).json({ "New movie is added": movie });
      } else {
        // Is adding is not done
        return res
          .status(500)
          .json({ message: "Movie document is not added to the Db" });
      }
    });
  }
);
// Search for a movie + Authorization + Authentication
router.get("/:id", authenticate, (req, res) => {
  movieModel.findById(req.params.id, (err, movie) => {
    if (err) {
      return res.status(500).json({ errorMessage: err.message });
    } else if (movie != null) {
      return res.status(200).json({ "Movie is founded ": movie });
    } else {
      return res.status(500).json({ message: "Movie is not found" });
    }
  });
});

// Edit/Update an existed movie + Authentication + Authorization
router.patch("/:id", authenticate, async (req, res) => {
  // search for it before being updated
  try {
    movie = await movieModel.findById(req.params.id);
    if (movie != null) {
      // Checks for Authorization
      const userObj = await jwt.verify(req.cookies.token, "secretkey");
      if (movie.owner_id == userObj._id) {
        movieModel.updateMany(
          { _id: req.params.id },
          {
            $set: {
              name: req.body.name == null ? movie.name : req.body.name,
              category:
                req.body.category == null ? movie.category : req.body.category,
              productionCompany:
                req.body.productionCompany == null
                  ? movie.productionCompany
                  : req.body.productionCompany,
              productionYear:
                req.body.productionYear == null
                  ? movie.productionYear
                  : req.body.productionYear,
            },
          },
          (err, updatedResult) => {
            console.log("updatedResult", updatedResult);
            if (err) {
              return res.status(500).json({ errorMessage: err.message });
            } else if (updatedResult.nModified > 0) {
              return res
                .status(200)
                .json({ message: "Movie is updated successfully" });
            } else if (updatedResult.nModified == 0 && updatedResult.ok == 1) {
              return res.status(500).json({
                message: "These data are existed before, no update is done",
              });
            }
          }
        );
      } else {
        // This is not the owner user
        return res.status(403).json({
          message: "Not allowed, this user not authorized to update this movie",
        });
      }
    } else {
      return res
        .status(500)
        .json({ message: "This movie is not founded to be updated" });
    }
  } catch (err) {
    return res.status(500).json({ errorMessage: err.message });
  }
});

// Delete an existed movie + Authentication + Authorization
router.delete("/:id", authenticate, async (req, res) => {
  // search for it before being deleted
  try {
    movie = await movieModel.findById(req.params.id);
    if (movie != null) {
      // Checks the user authorization
      const userObj = await jwt.verify(req.cookies.token, "secretkey");
      if (movie.owner_id == userObj._id) {
        // The owner user delete the movie
        movieModel.deleteMany({ _id: req.params.id }, (err, deletedResult) => {
          if (err) {
            return res.status(500).json({ errorMessage: err.message });
          } else if (deletedResult.deletedCount > 0) {
            return res
              .status(200)
              .json({ message: "Movie is deleted successfully" });
          } else {
            return res
              .status(500)
              .json({ message: "Error on deleting the Movie" });
          }
        });
      } else {
        // This is not the owner user
        return res.status(403).json({
          message: "Not allowed, this user not authorized to delete this movie",
        });
      }
    } else {
      return res
        .status(500)
        .json({ message: "This movie is not found to be deleted" });
    }
  } catch (err) {
    return res.status(500).json({ errorMessage: err.message });
  }
});

// Create an authentication middleware for protecting the route
async function authenticate(req, res, next) {
  try {
    console.log("The req path / url is : ", req.path);
    if (req.cookies.token) {
      const userObj = await jwt.verify(req.cookies.token, "secretkey");
      console.log("The current user name ", userObj.username);
      console.log("The current user id ", userObj._id);
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Please you have to sign in firstly!" });
    }
  } catch (err) {
    res.status(500).json({ errorMessage: err.message });
  }
}

//----------------------------------
module.exports = router;
