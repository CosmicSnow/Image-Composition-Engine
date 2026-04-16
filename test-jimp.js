const jimp = require("jimp");
const { resolve } = require("path");

const fontsDir = "./fonts/";
const distNumbers = "./dist/numbers/";
const fonts = [`${fontsDir}/0.png`, `${fontsDir}/1.png`, `${fontsDir}/2.png`, `${fontsDir}/3.png`, `${fontsDir}/4.png`, `${fontsDir}/5.png`, `${fontsDir}/6.png`, `${fontsDir}/7.png`, `${fontsDir}/8.png`, `${fontsDir}/9.png`];

function makeFourDigits(number) {
  return number.toString().padStart(4, '0');
}

function countSpacingX(number) {
  if (number === 1) return 400;
  return 500;
}

async function createNumberImageJimp(number) {
  let numberToPrint = makeFourDigits(number);
  let jimpNumbers = [];
  
  for (let i = 0; i < numberToPrint.length; i++) {
    let targetNumber = Number(numberToPrint.substr(i, 1));
    jimpNumbers.push(await jimp.read(fonts[targetNumber]));
  }
  
  let x = 0;
  x += countSpacingX(Number(numberToPrint.substr(0, 1)));
  for (let i = 1; i <= numberToPrint.length - 1; i++) {
    let targetNumber = Number(numberToPrint.substr(i, 1));
    await jimpNumbers[0].composite(jimpNumbers[i], x, 0);
    x += countSpacingX(targetNumber);
  }
  
  await jimpNumbers[0].writeAsync(resolve(`${distNumbers}jimp_${number}.png`));
}

async function test() {
  console.time("10 Imagens (Jimp)");
  for (let i = 0; i < 10; i++) {
    const num = Math.floor(Math.random() * 9000) + 1000;
    await createNumberImageJimp(num);
    console.log(`Imagem ${i+1}: ${num} gerada`);
  }
  console.timeEnd("10 Imagens (Jimp)");
}

test().catch(console.error);