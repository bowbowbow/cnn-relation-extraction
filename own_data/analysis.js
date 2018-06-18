const superagent = require('superagent');
const cheerio = require('cheerio');
const _ = require('lodash');
const iconv = require('iconv-lite');
const rp = require('request-promise');
const fs = require('fs-promise');

const EMPTY = '.\r';

async function run() {
  const data = await fs.readFile('triples.nt', 'utf8');
  const lines = data.split('\n');
  
  let success = 0, fail = 0;
  for (let i = 0; i < lines.length; i++) {
    // console.log(`progress ${i + 1}/${lines.length}(${((i + 1) / lines.length * 100).toFixed(2)}%)`);
    const cols = lines[i].split('\t');
    
    const sbj = cols[0];
    const obj = cols[2];
    const relation = cols[1];
    let sentence = cols[3];
    
    if (sentence !== EMPTY) {
      success++;
    } else {
      fail++;
    }
  }
  
  console.log('success :', success);
  console.log('fail : ', fail);
}

run().then();
