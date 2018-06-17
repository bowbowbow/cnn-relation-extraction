/**
 * Created by bowbowbow on 2018. 6. 18..
 */
const superagent = require('superagent');
const cheerio = require('cheerio');
const _ = require('lodash');
const urlHandler = require('url');
const iconv = require('iconv-lite');
const rp = require('request-promise');

class Crawler {
  constructor() {
  }
  
  /**
   * @param url
   * @returns {Promise}
   */
  getDollar(url) {
    return new Promise((resolve, reject) => {
      rp({
        method: "GET",
        uri: encodeURI(url),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36',
          'Referer': 'https://google.co.kr',
        },
        encoding: null,
      })
      .then((body) => {
        try {
          const str = new Buffer(body);
          let html = iconv.decode(str, 'utf-8').toString();
          if (html.search(`euc-kr`) > 0) {
            html = iconv.decode(str, 'EUC-KR').toString();
          }
          const $ = cheerio.load(html);
          this.$ = $;
          resolve($);
        } catch (err) {
          console.log(err);
          reject(err);
        }
      })
      .catch((err) => {
        reject(err);
      })
    });
  }
}

// Module Exports...
module.exports = Crawler;
