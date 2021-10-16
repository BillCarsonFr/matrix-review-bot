class AndroidFeedManager {
    /**
     * Manage a feed from a specific emitter
     * Side effect:
     *  - Sets the error handler for the feed.
     * @param {AndroidFeedEmitter} emitter emitter that will create events per item
     * @param {PlaystoreReviewFeed} feed    feed to store items and retrieve configuration from
     */
    constructor(emitter, feed) {
      /**
       * Instance to manage
       * @type {AndroidFeedEmitter}
       */
      this.instance = emitter;
      /**
       * Feed to emit items for
       * @type {PlaystoreReviewFeed}
       */
      this.feed = feed;
  
    }

    identifyNewItems(data) {
        data.newItems = data.items.filter((fetchedItem) => {
          const foundItemInsideFeed = this.feed.findItem(fetchedItem);
          if (foundItemInsideFeed) {
            return false;
          }
          return fetchedItem;
        });

        console.log("## identified new items: " + data.newItems.length)
    }

    populateNewItemsInFeed(data, firstload) {
        data.newItems.forEach((item) => {
          this.feed.addItem(item);
          if (!(firstload && this.instance.skipFirstLoad)) {
            this.instance.emit(this.feed.eventName, item);
          }
        });
    }

    async getContent(firstload) {
        console.log("## getContent firstLoad: " + firstload)
        const items = await this.feed.fetchData();
        console.log("## fetched items ["+ this.feed.country +"]" +  items.length)
        const data = {
          items,
          urappIdl: this.feed.appId,
        };
        this.feed.updateHxLength(items);
        //this.sortItemsByDate(data);
        this.identifyNewItems(data);
        this.populateNewItemsInFeed(data, firstload);
        if (firstload && !this.instance.skipFirstLoad) {
          this.instance.emit(`initial-load:${this.feed.appId}`, { url: this.feed.appId, items: this.feed.items });
        }
    }
    
}


module.exports = AndroidFeedManager;