var RatingUtils = function () {};

const ratingsStrings = ["✩✩✩✩✩", "★✩✩✩✩", "★★✩✩✩", "★★★✩✩",  "★★★★✩",  "★★★★★"]

RatingUtils.prototype.ratingToStartString = function(rating) {
    return ratingsStrings[parseInt(rating) % 6]
}

exports.RatingUtils = new RatingUtils();
