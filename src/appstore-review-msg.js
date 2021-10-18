const moment = require('moment');
const ratingUtils = require("./rating-utils.js").RatingUtils;

var AppleTemplate = function () {};

const dateSrcFormat = "YYYY-MM-DDTHH:mm:ss.SSS"
const dateDisplayFormat = "dddd, MMMM Do YYYY, h:mm:ss a"

AppleTemplate.prototype.richText = function (title, rssItem) {
    return `<b>${title}: ${rssItem.title}</b>\n
    <p>👤 ${rssItem.author}<br>
    v: <code>${rssItem["im:version"]["#"]}</code><br>
    ${ratingUtils.ratingToStartString(rssItem["im:rating"]["#"])}</p>
    \n<blockquote>\n<p>${rssItem.description}</p>\n</blockquote>\n
    <p><em>${moment(rssItem.date, dateSrcFormat).format(dateDisplayFormat)}</em></p>
    `//<p><em><a href=\"${rssItem["atom:author"]["uri"]["#"]}\">Full review</a></em></p>`
};

AppleTemplate.prototype.richTextTest = function (title, rssItem) {
    return `<b>${title}: ${rssItem.title}</b>\n
    <p>👤 ${rssItem.author}<br>
    v: <code>?</code><br>
    ?</p>
    \n<blockquote>\n<p>${rssItem.content}</p>\n</blockquote>\n
    `//<p><em>${moment(rssItem.date, dateSrcFormat).format(dateDisplayFormat)}</em></p>`
};

exports.AppleTemplate = new AppleTemplate();