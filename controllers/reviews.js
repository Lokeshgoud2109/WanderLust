const Listing=require("../models/listing");
const Review=require("../models/reviews");

//create Review
module.exports.createReview=async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const newReview = new Review(req.body.review);
    
    newReview.author=req.user._id;
 
    console.log("eda print ayindi ante ida :-"+newReview.author);
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${listing._id}`);
  };

  // delete Review
  module.exports.destroyReview=async (req, res) => {
    const { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {
      $pull: { reviews: reviewId },
    });

    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Deleted a Review!");
    res.redirect(`/listings/${id}`);
  };