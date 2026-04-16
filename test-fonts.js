const sharp = require("sharp");
const { resolve } = require("path");

const fontsDir = "./fonts/";
const distNumbers = "./dist/numbers/";
const fonts = [`${fontsDir}/0.png`, `${fontsDir}/1.png`, `${fontsDir}/2.png`, `${fontsDir}/3.png`, `${fontsDir}/4.png`, `${fontsDir}/5.png`, `${fontsDir}/6.png`, `${fontsDir}/7.png`, `${fontsDir}/8.png`, `${fontsDir}/9.png`];

function countSpacingX(number) {
  return number === 1 ? 400 : 500;
}

async function createNumberImageDirect(number) {
  let numberToPrint = number.toString().padStart(4, '0');
  let digits = numberToPrint.split('').map(Number);
  
  let x = 0;
  x += countSpacingX(digits[0]);
  
  let baseImage = await sharp(fonts[digits[0]]).toBuffer();
  
  for (let i = 1; i < digits.length; i++) {
    const overlay = await sharp(fonts[digits[i]]).toBuffer();
    baseImage = await sharp(baseImage)
      .composite([{ input: overlay, left: x, top: 0 }])
      .toBuffer();
    x += countSpacingX(digits[i]);
  }
  
  await sharp(baseImage).toFile(resolve(`${distNumbers}${number}.png`));
  console.log(`Number ${number} created: ${numberToPrint}`);
}

async function test() {
  await createNumberImageDirect(4);  // Should be 0004
  await createNumberImageDirect(12);  // Should be 0012
  await createNumberImageDirect(123); // Should be 0123
  await createNumberImageDirect(9999);
}

test().catch(console.error);