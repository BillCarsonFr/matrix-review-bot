const PlaystoreReviewFeed = require('./review-feed');
const { EventEmitter } = require('events');
const AndroidFeedManager = require('./android-feed-manager')

class AndroidFeedEmitter extends EventEmitter {

    constructor(options = { skipFirstLoad: false }) {
        super();
    
        /**
         * Array of feeds that are tracked
         * @private
         * @type {Feed[]}
         */
        this.feedList = [];
    
        /**
         * Whether or not to skip the normal emit event on first load
         * @private
         * @type {boolean}
         */
        this.skipFirstLoad = options.skipFirstLoad;
    }


    /**
     * List of feeds this emitter is handling
     * @public
     * @returns {Feed[]} Feed arrray
     */
    get list() {
        return this.feedList;
    }

    destroy() {
        this.feedList.forEach((feed) => feed.destroy());
        delete this.feedList;
        this.feedList = [];
    }

    add(config) {
        const feed = new PlaystoreReviewFeed(config);
        this.addOrUpdateFeedList(feed);
        return this.feedList;
    }
    
    addOrUpdateFeedList(feed) {
        const feedInList = this.findFeed(feed);
        if (feedInList) {
          this.removeFromFeedList(feedInList);
        }
    
        this.addToFeedList(feed);
    }

    findFeed(feed) {
        return this.feedList.find((feedEntry) => feedEntry.appId === feed.appId && feedEntry.country === feed.country);
    }

    addToFeedList(feed) {
        feed.items = [];
        feed.interval = this.createSetInterval(feed);
    
        this.feedList.push(feed);
    }

    createSetInterval(feed) {
        const feedManager = new AndroidFeedManager(this, feed);
        feedManager.getContent(true);
        return setInterval(feedManager.getContent.bind(feedManager), feed.refresh);
    }

    removeFromFeedList(feed) {
        if (!feed) return;
    
        feed.destroy();
        const pos = this.feedList.findIndex((e) => e.url === feed.url);
        this.feedList.splice(pos, 1);
    }
}


module.exports = AndroidFeedEmitter;