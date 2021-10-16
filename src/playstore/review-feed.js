
var gplay = require('google-play-scraper');

const historyLengthMultiplier = 3;

class PlaystoreReviewFeed {

    constructor(data) {
        // array of reviews
        this.items;

        // Application Id
        this.appId;

        /**
         * Duration between feed refreshes
         * @type {number}
         */
        this.refresh; 

        ({
            items: this.items, appId: this.appId, refresh: this.refresh, eventName: this.eventName, 
            country: this.country, lang: this.lang
          } = data);

          if (!this.items) this.items = [];
          if (!this.appId) throw new TypeError('missing required field `appId`');
          if (!this.refresh) this.refresh = 60000;
          if (!this.eventName) this.eventName = 'new-item';
          if (!this.country) this.country = 'us';
          if (!this.lang) this.lang = 'en';

    }

    findItem(item) {
        return this.items.find((entry) => {
          return entry.id === item.id;
        });
    }

    updateHxLength(newItems) {
        this.maxHistoryLength = newItems.length * historyLengthMultiplier;
    }
    
      /**
       * Add an item to the feed
       * @public
       * @param {FeedItem} item Feed item. Indeterminant structure.
       */
    addItem(item) {
        this.items.push(item);
        this.items = this.items.slice(this.items.length - this.maxHistoryLength, this.items.length);
    }

    fetchData() {
        return new Promise(async (resolve) => {
            gplay.reviews({
                appId: this.appId,
                sort: gplay.sort.NEWEST,
                num: 10,
                country: this.country,
                lang: this.lang
            }).then( function (resp) {
                // resp.data.forEach(element => {
                //    this.items.push(element)
                //  });
                resolve(resp.data);
            }, function (err) {
                console.log("Error: " + err)
                resolve([])
            });
        });
    }


    /*
    * Destroy feed
    * @public
    */
   destroy() {
     clearInterval(this.interval);
     delete this.interval;
   }
}


module.exports = PlaystoreReviewFeed;