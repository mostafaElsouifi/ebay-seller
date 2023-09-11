require("dotenv").config();
const puppeteer = require("puppeteer");
const { MAIN_URL } = process.env;
const {
  delay,
  elementExists,
  writeToJson,
  writeToCsv,
} = require("./helpers.js");

const getStoreData = async (page, mainUrl) => {
  await page.goto(MAIN_URL);
  await delay(1);
  const storeName = await page.$eval(".str-seller-card__store-name", (el) =>
    el.textContent.trim()
  );

  const positiveFeedbacks = await page.$eval(
    ".str-seller-card__feedback-link span",
    (el) => el.textContent.trim()
  );
  const feedbacksUrl = await page.$eval(
    ".str-seller-card__feedback-link",
    (el) => el.href
  );

  let sellAllButton = await elementExists(page, ".str-marginals__footer a");
  while (sellAllButton) {
    await page.click(".str-marginals__footer a");
    sellAllButton = await elementExists(page, ".str-marginals__footer a");
  }
  await delay(2);
  // grape all products
  const allListings = await page.evaluate(() => {
    const allProducts = [];
    const allListingsContainers = document.querySelectorAll(
      ".srp-results .s-item__wrapper .s-item__image-section"
    );
    const itemsTitles = document.querySelectorAll(
      ".srp-results .s-item__title"
    );
    const itemsImages = document.querySelectorAll(
      ".srp-results .s-item__wrapper .s-item__image-section img"
    );

    const itemsPrices = document.querySelectorAll(
      ".srp-results .s-item__price"
    );
    const itemsLinks = document.querySelectorAll(".srp-results .s-item__link");
    for (let i = 0; i < allListingsContainers.length; i++) {
      allProducts.push({
        title: itemsTitles[i].textContent,
        image: itemsImages[i].src,
        price: itemsPrices[i].textContent.trim(),
        productUrl: itemsLinks[i].href,
      });
    }
    return allProducts;
  });

  return {
    storeName,
    positiveFeedbacks,
    feedbacksUrl,
    allListings,
  };
};
(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    ignoreDefaultArgs: [
      "--enable-automation",
      "--disable-extensions",
      "--disable-default-apps",
      "--disable-component-extensions-with-background-pages",
    ],
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);

  const data = await getStoreData(page, MAIN_URL);
  await browser.close();
  writeToJson(data, "data.json");
})();
