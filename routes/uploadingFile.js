const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const router = express.Router();
//-------------- Upload a file -----------------
var original_imageName = "";
var storage = multer.diskStorage({
  // specify the destination folder path
  destination: function (req, file, callback) {
    callback(null, "uploads");
  },
  // specify the file name after be uploaded
  filename: function (req, file, callback) {
    original_imageName = file.originalname;
    callback(null, file.originalname);
  },
});
// Returns middleware that processes a the selected file from the form which its field name the file form element field name.
// fileFormField : is the file field name of the form
var upload = multer({ storage: storage }).single("fileFormField");
// -------------- Routes -----------------------
router.get("/", (req, res) => {
  res.render("index");
});
router.post("/", async (req, res) => {
  // receive the ajax submit sending when the file form button is clicked
  upload(req, res, async (err) => {
    // the ajax response (error)
    if (err) {
      return res.end("Error occurred during uploading the image file !");
    }
    // the ajax response (success)
    res.end("Image file has been uploaded successfully.");
    // Begins working with sharp process to process the uploaded image file
    try {
      // path of the original one
      const original_img_path = path.join(
        __dirname,
        "/..",
        "uploads",
        original_imageName
      );

      // apply sharp process on the original image to produce a buffer for the image 1
      const img1Buffer = await sharp(original_img_path)
        .resize(500, 500)
        .toBuffer();
      const img_1_path = path.join(
        __dirname,
        "/..",
        "uploads",
        original_imageName.replace(".", "_1.")
      );
      // Create an image with the image 1 buffer on the specified path
      fs.writeFileSync(img_1_path, img1Buffer);

      // apply sharp process on the original image to produce a buffer for the image 2
      const img2Buffer = await sharp(original_img_path)
        .resize(250, 250)
        .toBuffer();

      const img_2_path = path.join(
        __dirname,
        "/..",
        "uploads",
        original_imageName.replace(".", "_2.")
      );
      // Create an image with the image 2 buffer on the specified path
      fs.writeFileSync(img_2_path, img2Buffer);

      // apply sharp process on the original image to produce a buffer for the image 3
      const img3Buffer = await sharp(original_img_path).rotate(180).toBuffer();
      const img_3_path = path.join(
        __dirname,
        "/..",
        "uploads",
        original_imageName.replace(".", "_3.")
      );
      // Create an image with the image 3 buffer on the specified path
      fs.writeFileSync(img_3_path, img3Buffer);
    } catch (error) {
      console.error("error : ", error.message);
    }
  });
});

router.get("/images", async (req, res) => {
  const imagesDirectory = await fs.opendirSync(
    path.join(__dirname, "/..", "uploads")
  );
  var imgPathArr = [];
  for await (const imageFile of imagesDirectory) {
    imgPathArr.push(imageFile.name);
  }
  console.log(imgPathArr);
  res.render("images", { imgPathArr: imgPathArr });
});
router.get("/info", async (req, res) => {
  const imagesDirectory = await fs.opendirSync(
    path.join(__dirname, "/..", "uploads")
  );
  var images_counter = 0;
  var output = "<h2><u>The uploaded images details</u></h2>";
  for await (const imageFile of imagesDirectory) {
    output += "<h3>" + ++images_counter + " : " + imageFile.name + "</h3>";
    console.log(images_counter + " : " + imageFile.name);
  }
  if (images_counter > 0) {
    output += "<hr>";
    output +=
      "<h1> <u>The total uploaded images number is : </u>" +
      images_counter +
      "</h1>";
    res.send(output);
  } else {
    res.send("<h1>No images are uploaded yet !</h1>");
  }
});

//-----------------------------------------------------
module.exports = router;
