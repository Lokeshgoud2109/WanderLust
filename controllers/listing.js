const Listing=require("../models/listing");
const geocodeLocation = require("../utils/geocode");

//index route
module.exports.index=async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

//new Route
module.exports.renderNewForm= (req, res) => {
  
    
    res.render("listings/new.ejs");
};

// show Route
module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate("owner") 
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    });

  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    return res.redirect("/listings");
  }
  

 res.render("listings/show.ejs", { listing, mapKey: process.env.GOOGLE_MAP_KEY });

};

// create Listing

module.exports.createListing = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;

  // const { location, country } = req.body.listing;



  // 👇 PASTE HERE
  const { location, country } = req.body.listing;

  console.log("LOCATION:", location);
  console.log("COUNTRY:", country);

  const geometry = await geocodeLocation(location, country);

  console.log("GEOMETRY:", geometry);
  // 👆 END

  // 🔹 GET COORDINATES
  // const geometry = await geocodeLocation(location, country);

  if (!geometry) {
    req.flash("error", "Invalid location");
    return res.redirect("/listings/new");
  }

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = geometry; // ⭐ ADD THIS LINE

  await newListing.save();

  req.flash("success", "New listing created");
  res.redirect("/listings");
};


//edit route
module.exports.renderEditForm=async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        return res.redirect("/listings");  
    }
    let modifiedImage= listing.image.url;
    modifiedImage=modifiedImage.replace("/upload", "/upload/w_300,h_200,c_fill");
    res.render("listings/edit.ejs", { listing,modifiedImage }); 
};

//Update route


module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const updates = req.body.listing || req.body;

  const listing = await Listing.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  );

  // Update image
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  // Update coordinates
  if (updates.location || updates.country) {
    const geometry = await geocodeLocation(
      updates.location,
      updates.country
    );
    if (geometry) {
      listing.geometry = geometry;
    }
  }

  await listing.save();

  req.flash("success", "Listing Updated successfully");
  res.redirect(`/listings/${id}`);
};


// Delete route
module.exports.destroyListing=async (req, res) => {
    const { id } = req.params;
    const deleteListing = await Listing.findByIdAndDelete(id);
    console.log(deleteListing);
    req.flash("success","Listing deleted");
    res.redirect("/listings");
};



