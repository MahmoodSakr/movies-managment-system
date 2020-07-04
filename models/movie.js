const mongoose = require("mongoose");
moviesSchema = new mongoose.Schema({
  owner_id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  productionCompany: { type: String, required: true },
  productionYear: { type: Number, required: true },
});
module.exports = mongoose.model("movies", moviesSchema);
