const TelegramBot = require('node-telegram-bot-api');
const cheerio = require('cheerio');
const axios = require('axios');
const schedule = require('node-schedule');
const fs = require('fs');
const configfilePath = './config.json';
let config;
let bot;
let lastUpdatedNoticeNumber;

async function initConfig() {
  config = JSON.parse(fs.readFileSync(configfilePath, 'utf-8'));
  if (config.telegramBotToken !== undefined) {
    console.log('init: config load success');
    bot = new TelegramBot(config.telegramBotToken, {
      polling: true,
    });
    config.updated = new Date();
  } else {
    throw new Error('config setup error');
  }
}

async function sendMessage(payload) {
  await bot.sendMessage(config.telegramChannelId, payload);
}

async function crawl() {
  const universities = config.universities;
  let message = '';
  await Promise.all(
    await universities.map(async (univ) => {
      console.log(univ);
      const result = await axios.get(univ.ratio_url);
      const $ = cheerio.load(result.data);
      const ratio = $(univ.target_xpath)
        .text()
        .replace(/(\r\n|\n|\r)/gm, '');
      data = '대학교: ' + univ.name + '\n' + '경쟁률: ' + ratio;
      console.log(data);
      message += `${data} \n ---------------------- \n`;
    })
  );
  sendMessage(message);
}

initConfig();
crawl();
schedule.scheduleJob(config.schedule, async function () {
  const a = await crawl();
});
