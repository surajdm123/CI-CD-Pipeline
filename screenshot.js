#!/usr/bin/env node
const puppeteer = require('puppeteer');
const fs = require('fs');
//const path = require("path");

const [, , ...args] = process.argv;

const logPath = args[2];
const snapshotName = args[3];

(async () => {
  const url = args[0];
  const filename = `${args[1]}.png`;
  let browser = null;

  try {

  browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });

    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: 'networkidle0'
    });
    await page.screenshot({
      path: filename,
      fullPage: true
    });

  fs.appendFileSync(`./${logPath}`,`\t${snapshotName}: SUCCESS\n`);

  } catch (err) {
    fs.appendFileSync(`./${logPath}`,`\t${snapshotName}: FAILED | Error displayed on console\n`);
    console.log("Screenshot Failed: \n" + err);
  } finally {
    // await page.close();
    if(browser !== undefined && browser !== null ) {
      await browser.close();
    }
    
  }
})();
