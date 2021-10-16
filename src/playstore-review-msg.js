const moment = require('moment');
const ratingUtils = require("./rating-utils.js").RatingUtils;

var PlaystoreTemplate = function () {};
const dateSrcFormat = "YYYY-MM-DDTHH:mm:ss.SSS"
const dateDisplayFormat = "dddd, MMMM Do YYYY, h:mm:ss a"

PlaystoreTemplate.prototype.richText = function (scrap) {
    return `<b>[New Element Android Review]</b>\n
    <p>👤 ${scrap.userName}<br>
    v: <code>${scrap.version}</code><br>
    ${ratingUtils.ratingToStartString(parseInt(scrap.score))}</p>
    \n<blockquote>\n<p>${scrap.text}</p>\n</blockquote>\n
    <p><em>${moment(scrap.date, dateSrcFormat).format(dateDisplayFormat)}</em></p>
    `//<p><em><a href=\"${scrap.url}\">Full review</a></em></p>`
};

exports.PlaystoreTemplate = new PlaystoreTemplate();