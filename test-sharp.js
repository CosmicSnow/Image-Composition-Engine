const sharp = require("sharp");
const { resolve } = require("path");
const fs = require("fs");

const dir = "./assets/";
const allNumbersDir = "./dist/numbers/";
const distOutput = "./dist/output/";

async function test() {
  const combinations = ['bg0.png', 'a1.png', 's1.png', 'e7.png', 'm0.png', 'b0.png'];
  const imageName = "0001";
  const plainImage = { con1: 100, con2: 200, con3: 300, con4: 400 };
  
  console.log("Testing Sharp composite directly...");
  
  let compositeImages = [];
  let offsetX = 0;
  
  for (let [index, imgName] of combinations.entries()) {
    const imgPath = resolve(`${dir}${index}/${imgName}`);
    console.log(`Layer ${index}: ${imgPath}, exists: ${fs.existsSync(imgPath)}`);
    compositeImages.push({ input: imgPath, left: offsetX, top: 0 });
    offsetX += 500;
  }
  
  // Add dummy number images for testing
  if (!fs.existsSync(resolve(`${allNumbersDir}0001.png`))) {
    await sharp(resolve(`${dir}0/bg0.png`)).toFile(resolve(`${allNumbersDir}0001.png`));
  }
  if (!fs.existsSync(resolve(`${allNumbersDir}0100.png`))) {
    await sharp(resolve(`${dir}0/bg0.png`)).toFile(resolve(`${allNumbersDir}0100.png`));
  }
  
  compositeImages.push({ input: resolve(`${allNumbersDir}${imageName}.png`), left: 550, top: 100 });
  compositeImages.push({ input: resolve(`${allNumbersDir}0100.png`), left: 7850, top: 5500 });
  
  console.log("Composite images:", compositeImages.length);
  
  try {
    await sharp(resolve(`${dir}0/${combinations[0]}`))
      .composite(compositeImages.slice(1), { limitInputPixels: false })
      .toFile(resolve(`${distOutput}test-output.png`));
    console.log("SUCCESS!");
  } catch (e) {
    console.log("ERROR:", e.message);
  }
}

test();