const superagent = require('superagent');
const cheerio = require('cheerio');
const _ = require('lodash');
const iconv = require('iconv-lite');
const rp = require('request-promise');
const fs = require('fs-promise');

const EMPTY = '.\r';

class Crawler {
  constructor() {
  }
  
  async getWikiParagraphs(keyword) {
    const $ = await this.getDollar(`https://ko.wikipedia.org/wiki/${keyword}`)
    const paragraphs = [];
    $('#mw-content-text p').each(function (i, el) {
      paragraphs.push($(this).text());
    });
    return paragraphs;
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
      }, () => {
        // status 404가 오는 경우 있음
        console.log('404!');
        resolve([])
      })
      .catch((err) => {
        console.log('getDollar error :', err);
        reject(err);
      })
    });
  }
}

function findSentence(paragraphs, sbj, obj) {
  const SBJ = sbj.split('_').join(' ');
  const OBJ = obj.split('_').join(' ');
  
  for (let j = 0; j < paragraphs.length; j++) {
    const paragraph = paragraphs[j].split('\n').join('');
    const sentences = paragraph.split('.');
    
    for (let k = 0; k < sentences.length; k++) {
      if (sentences[k].indexOf(SBJ) >= 0 && sentences[k].indexOf(OBJ) >= 0) {
        return sentences[k].replace(SBJ, ' << _sbj_ >> ').replace(OBJ, ' << _obj_ >> ');
      }
    }
  }
  return null;
}

function findSentence2(paragraphs, sbj, obj) {
  const SBJ = sbj.split('_');
  const OBJ = obj.split('_');
  
  for (let j = 0; j < paragraphs.length; j++) {
    const paragraph = paragraphs[j].split('\n').join('');
    const sentences = paragraph.split('.');
    
    for (let k = 0; k < sentences.length; k++) {
      
      for (let p = 0; p < SBJ.length; p++) {
        for (let q = 0; q < OBJ.length; q++) {
          
          if (sentences[k].indexOf(SBJ[p]) >= 0 && sentences[k].indexOf(OBJ[q]) >= 0) {
            return sentences[k].replace(SBJ[p], ' << _sbj_ >> ').replace(OBJ[q], ' << _obj_ >> ');
          }
        }
      }
      
    }
  }
  return null;
}

async function run() {
  const data = await fs.readFile('triples.nt', 'utf8');
  const lines = data.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    console.log(`progress ${i + 1}/${lines.length}(${((i + 1) / lines.length * 100).toFixed(2)}%)`);
    const cols = lines[i].split('\t');
    
    const sbj = cols[0];
    const obj = cols[2];
    const relation = cols[1];
    let sentence = cols[3];
    
    if (sentence !== EMPTY) {
      console.log('pass');
      continue;
    }
    try {
      const paragraphsSbj = await new Crawler().getWikiParagraphs(sbj);
      
      let tmp = findSentence2(paragraphsSbj, sbj, obj);
      if (tmp) {
        sentence = tmp;
      } else {
        const paragraphsObj = await new Crawler().getWikiParagraphs(obj);
        tmp = findSentence2(paragraphsObj, sbj, obj);
        if (tmp) sentence = tmp;
      }
      
      if (sentence !== EMPTY) {
        cols[3] = sentence + EMPTY;
        const newLine = cols.join('\t');
        console.log('found :', newLine);
        
        lines[i] = newLine;
        await fs.writeFile('triples.nt', lines.join('\n'));
      } else {
        console.log('not found', cols);
      }
    } catch (e) {
      console.log('error at :', i);
    }
  }
}

run().then();


// Module Exports...
module.exports = Crawler;
