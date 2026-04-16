// "use strict";

const Sequelize = require("sequelize");
const DbMixin = require("../mixins/db.mixin");
const {MoleculerClientError} = require("moleculer").Errors;

const {resolve, path} = require("path");
const {readdir} = require("fs").promises;
const jimp = require("jimp");
const sharp = require("sharp");
const fs = require("fs");
const dir = "./assets/";
const fontsDir = "./fonts/";
const distNumbers = "./dist/numbers/";
const distOutput = "./dist/output/";
const allNumbersDir = distNumbers;

let fonts = [`${fontsDir}/0.png`, `${fontsDir}/1.png`, `${fontsDir}/2.png`, `${fontsDir}/3.png`, `${fontsDir}/4.png`, `${fontsDir}/5.png`, `${fontsDir}/6.png`, `${fontsDir}/7.png`, `${fontsDir}/8.png`, `${fontsDir}/9.png`];
let jfg = []; // JIMP FONTS GLOBAL

module.exports = {
	name: "imagery",
	mixins: [DbMixin],
	settings: {},
	model: {
		name: "imagery",
		define: {
			id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
			combination: {type: Sequelize.STRING(1000), unique: true},
			con1: {type: Sequelize.INTEGER},
			con2: {type: Sequelize.INTEGER},
			con3: {type: Sequelize.INTEGER},
			con4: {type: Sequelize.INTEGER},
			processed: {type: Sequelize.INTEGER, defaultValue: 0},
		},
	},

	actions: {
		readAssets: {
			async handler(ctx) {
				// layer looks like layer[0] = {name: "1", items [1,2,3], total: x}
				let layers = [];
				let totalItems = 0;
				let totalLayers = 0;
				let maxPossibleCombinations = 0;
				let dbObject = []; //Object to push to db.

				const assetsFolder = await readdir(dir, {withFileTypes: true});
				for (const asset of assetsFolder) {
					let layerObject = {name: "", files: [], total: 0};
					if (asset.isDirectory()) {
						totalLayers++;
						layerObject.name = asset.name;
						const intraAssets = await readdir(dir + asset.name);
						for (const intra of intraAssets) {
							if (intra.endsWith(".png")) {
								layerObject.files.push(intra);
								layerObject.total++;
								totalItems++;
							}
						}
					}
					layers.push(layerObject);
				}
				
				console.log('DEBUG: layers found:', JSON.stringify(layers.map(l => ({name: l.name, total: l.total}))));
				
				for (const layer of layers) {
					if (layer.total > 0 && maxPossibleCombinations === 0) {
						maxPossibleCombinations = layer.total;
					} else if (layer.total > 0) {
						maxPossibleCombinations *= layer.total;
					}
				}
				
				let possibleConnections = [];

				if (maxPossibleCombinations > 0) {
					for (let i = maxPossibleCombinations; i > 0; i--) {
						possibleConnections.push(i);
						possibleConnections.push(i);
						possibleConnections.push(i);
						possibleConnections.push(i);
					}
				let arrays = [];
				for (const layer of layers) {
					if (layer.total > 0) {
						// Shuffle files for random mixing
						for (let i = layer.files.length - 1; i > 0; i--) {
							const j = Math.floor(Math.random() * (i + 1));
							[layer.files[i], layer.files[j]] = [layer.files[j], layer.files[i]];
						}
						arrays.push(layer.files);
					}
				}
				
				let resultArray = this.product(arrays);

				resultArray.forEach((element, index) => {
						index++;
						let obj = {
							id: index,
							combination: element.toString(),
							con1: null,
							con2: null,
							con3: null,
							con4: null,
							processed: 0
						};
						dbObject.push(obj);
					});
				}

				for (let element of dbObject) {
					if (element.con1 === null) {
						let position = this.getRandomInt(0, possibleConnections.length);
						while (element.id === possibleConnections[position]) {
							position = this.getRandomInt(0, possibleConnections.length);
						}
						let target = possibleConnections[position];
						let targetNullCon = this.getNullCon(dbObject[target - 1]);
						dbObject[target - 1][`${targetNullCon}`] = element.id;
						dbObject[element.id - 1].con1 = dbObject[target - 1].id;
						possibleConnections.splice(position, 1);
						possibleConnections.splice(this.removeSpecificNumberFromArray(possibleConnections, element.id), 1);
					}

					if (element.con2 === null) {
						let position = this.getRandomInt(0, possibleConnections.length);
						while (element.id === possibleConnections[position]) {
							position = this.getRandomInt(0, possibleConnections.length);
						}
						let target = possibleConnections[position];
						let targetNullCon = this.getNullCon(dbObject[target - 1]);
						dbObject[target - 1][`${targetNullCon}`] = element.id;
						dbObject[element.id - 1].con2 = dbObject[target - 1].id;
						possibleConnections.splice(position, 1);
						possibleConnections.splice(this.removeSpecificNumberFromArray(possibleConnections, element.id), 1);
					}

					if (element.con3 === null) {
						let position = this.getRandomInt(0, possibleConnections.length);
						while (element.id === possibleConnections[position]) {
							position = this.getRandomInt(0, possibleConnections.length);
						}
						let target = possibleConnections[position];
						let targetNullCon = this.getNullCon(dbObject[target - 1]);
						dbObject[target - 1][`${targetNullCon}`] = element.id;
						dbObject[element.id - 1].con3 = dbObject[target - 1].id;
						possibleConnections.splice(position, 1);
						possibleConnections.splice(this.removeSpecificNumberFromArray(possibleConnections, element.id), 1);
					}

					if (element.con4 === null) {
						let position = this.getRandomInt(0, possibleConnections.length);
						while (element.id === possibleConnections[position]) {
							position = this.getRandomInt(0, possibleConnections.length);
						}
						let target = possibleConnections[position];
						let targetNullCon = this.getNullCon(dbObject[target - 1]);
						dbObject[target - 1][`${targetNullCon}`] = element.id;
						dbObject[element.id - 1].con4 = dbObject[target - 1].id;
						possibleConnections.splice(position, 1);
						possibleConnections.splice(this.removeSpecificNumberFromArray(possibleConnections, element.id), 1);
					}
				}

				await this.insertEntities(dbObject);
			}
		},
		orderNumber: {
			params: {initialNumber: "number"},
			async handler(ctx) {
				let initialNumber = ctx.params.initialNumber;
				let steps = 1;
				let maximumNumber = 4000;
				if (ctx.params.initialNumber > maximumNumber) {
					return;
				}
				let callArray = [];
				let lastNumber;
				// for (let i = initialNumber; i <= initialNumber + steps; i++) {
				// 	if (i <= maximumNumber) {
				// 		callArray.push(
				// 			{
				// 				action: `imagery.createNumberImage`,
				// 				params: {number: i}
				// 			});
				// 		lastNumber = i;
				// 	}
				// }
				// await ctx.mcall(callArray);

				// await ctx.call("imagery.createNumberImage", {number: initialNumber});
				// await this.sleep(this.getRandomInt(1000,5000));
				await ctx.call("imagery.createNumberImage");
				let callNumber = initialNumber + steps;
				// if (!(lastNumber >= maximumNumber)) {
				if (!(initialNumber >= maximumNumber)) {
					ctx.call("imagery.orderNumber", {initialNumber: callNumber});
				}
			}
		},
		createNumberImage: {
			async handler(ctx) {
				console.log("STARTED!");
				let dbNumber = await ctx.call("numberTable.findOneByProcessed", {processed: 0});
				if (!dbNumber) {
					return "All numbers PROCESSED!";
				}
				dbNumber = dbNumber.dataValues;
				console.log(111, dbNumber.number);
				dbNumber.processed = 1;
				await ctx.call("numberTable.update", dbNumber);
				// console.log(dbNumber);
				const assetsFolder = await readdir(allNumbersDir, {withFileTypes: true});
				let filesNames = [];
				for (const asset of assetsFolder) {
					filesNames.push(asset.name);
				}
				if ((filesNames.indexOf(`${dbNumber.number}.png`)) > -1) {
					dbNumber.processed = 2;
					await ctx.call("numberTable.update", dbNumber);
					// return ctx.call("imagery.createNumberImage");
					return;
				}

				try {
					let numberToPrint = this.makeFourDigits(dbNumber.number);
					let firstNumber = Number(numberToPrint.substr(0, 1));
					// let jimpNumber = jfg[firstNumber];

					let jimpNumbers = [];
					for (let i = 0; i < numberToPrint.length; i++) {
						let targetNumber = Number(numberToPrint.substr(i, 1));
						console.log(111, targetNumber);
						jimpNumbers.push(await jimp.read(fonts[targetNumber]));
					}

					// let jimpNumber = await jimp.read(fonts[firstNumber]);
					let x = 0;
					x += this.countSpacingX(firstNumber);
					for (let i = 1; i <= numberToPrint.length - 1; i++) {
						let targetNumber = Number(numberToPrint.substr(i, 1));
						// let nextNumber = await jimp.read(fonts[targetNumber])
						await jimpNumbers[0].composite(jimpNumbers[i], x, 0);
						x += this.countSpacingX(targetNumber);
					}
					await jimpNumbers[0].write(`${allNumbersDir}/${dbNumber.number}.png`, function () {
						console.log(ctx.params.number, "DONE!!!");
					});
					dbNumber.processed = 2;
					return await ctx.call("numberTable.update", dbNumber);
				} catch (e) {
					dbNumber.processed = 0;
					return await ctx.call("numberTable.update", dbNumber);
				}
				// return ctx.call("imagery.createNumberImage");
			}
		},
		orderCreateImages: {
			params: {initialNumber: "number"},
			async handler(ctx) {
				let initialNumber = ctx.params.initialNumber;
				let steps = 1;
				let maximumNumber = 4000;
				if (ctx.params.initialNumber > maximumNumber) {
					return;
				}
				let callArray = [];
				let lastNumber;
				// for (let i = initialNumber; i <= initialNumber + steps; i++) {
				// 	if (i <= maximumNumber) {
				// 		callArray.push(
				// 			{
				// 				action: `imagery.createNumberImage`,
				// 				params: {number: i}
				// 			});
				// 		lastNumber = i;
				// 	}
				// }
				// await ctx.mcall(callArray);

				// await ctx.call("imagery.createNumberImage", {number: initialNumber});
				// await this.sleep(this.getRandomInt(1000,5000));
				let res = await ctx.call("imagery.createImage");
				if (res === 0) {
					return;
				}
				let callNumber = initialNumber + steps;
				// if (!(lastNumber >= maximumNumber)) {
				if (!(initialNumber >= maximumNumber)) {
					ctx.call("imagery.orderCreateImages", {initialNumber: callNumber});
				}
			}
		},
		createImage: {
			async handler(ctx) {
				const fs = require("fs");
				const { Op } = require("sequelize");
				const model = this.adapter.db.models.imagery;
				const numberModel = this.adapter.db.models.numberTable;
				let dbImage = await model.findOne({where: {processed: 0}});
				
				if (!dbImage) {
					console.log("All images PROCESSED!");
					return 0;
				}
				
				const plainImage = dbImage.get({ plain: true });
				
				const requiredNumbers = [plainImage.id, plainImage.con1, plainImage.con2, plainImage.con3, plainImage.con4];
				
				for (const num of requiredNumbers) {
					if (!num) continue;
					let numFileName = this.makeFourDigits(num);
					const numPath = resolve(process.cwd(), `${allNumbersDir}${numFileName}.png`);
					if (!fs.existsSync(numPath)) {
						console.log(`Creating number ${num} first...`);
						await this.createNumberImageDirect(num);
					}
				}
				
				console.log(plainImage.id, "STARTED");
				
				plainImage.processed = 1;
				await model.update(plainImage, {where: {id: plainImage.id}});
				
				let imageName = this.makeFourDigits(plainImage.id);
				let images = [];
				let combinations = plainImage.combination.split(",");
				
try {
					let imageName = this.makeFourDigits(plainImage.id);
					let combinations = plainImage.combination.split(",");
					
					let compositeImages = [];
					
					// Asset layers should all be at origin (0,0) - they overlay on top of each other
					for (let [index, imgName] of combinations.entries()) {
						const imgPath = resolve(process.cwd(), `${dir}${index}/${imgName}`);
						compositeImages.push({ input: imgPath, left: 0, top: 0 });
					}
					
					// Numbers are positioned at specific coordinates
					const numDir = resolve(process.cwd(), allNumbersDir);
					compositeImages.push({ input: resolve(numDir, `${imageName}.png`), left: 550, top: 100 });
					compositeImages.push({ input: resolve(numDir, `${this.makeFourDigits(plainImage.con1)}.png`), left: 7850, top: 5500 });
					compositeImages.push({ input: resolve(numDir, `${this.makeFourDigits(plainImage.con2)}.png`), left: 7850, top: 6700 });
					compositeImages.push({ input: resolve(numDir, `${this.makeFourDigits(plainImage.con3)}.png`), left: 7850, top: 7900 });
					compositeImages.push({ input: resolve(numDir, `${this.makeFourDigits(plainImage.con4)}.png`), left: 7850, top: 9100 });
					
					const firstImgPath = resolve(process.cwd(), `${dir}0/${combinations[0]}`);
					
					let result = await sharp(firstImgPath).toBuffer();
					for (let i = 1; i < compositeImages.length; i++) {
						result = await sharp(result)
							.composite([compositeImages[i]], { limitInputPixels: false })
							.toBuffer();
					}
					
					await sharp(result).toFile(resolve(process.cwd(), `${distOutput}Connected Star - ${imageName}.png`));
					plainImage.processed = 2;
					await model.update(plainImage, {where: {id: plainImage.id}});
					console.log(plainImage.id, "FINISHED!!!");
					return 1;

				} catch (e) {
					console.log(1122, e);
					console.log(plainImage.id, "ERROR!!!");
					plainImage.processed = 0;
					await model.update(plainImage, {where: {id: plainImage.id}});
					return -1;
				}
			}
		},
		createTextDetails: {
			async handler(ctx) {
				// let dbImage = await this.model.findOne({where: {processed: 2}, raw: true});
				let dbImage = await this.model.findAll({raw: true});
				// console.log(1122, dbImage);
				for (let [index, imageName] of dbImage.entries()) {
					let combinations = imageName.combination.split(",");
					let v0, v1, v2, v3, v4;
					switch (combinations[0]) {
						case "bg0.png":
							v0 = "black";
							break;
						case "bg1.png":
							v0 = "orange";
							break;
						case "bg2.png":
							v0 = "pink";
							break;
						case "bg3.png":
							v0 = "purple";
							break;
						case "bg4.png":
							v0 = "dark blue";
							break;
						case "bg5.png":
							v0 = "light blue";
							break;
						case "bg6.png":
							v0 = "salmon";
							break;
						case "bg7.png":
							v0 = "green";
							break;
						case "bg8.png":
							v0 = "red";
							break;
						case "bg9.png":
							v0 = "colorful black";
							break;
					}
					switch (combinations[1]) {
						case "a0.png":
							v1 = "no";
							break;
						case "a1.png":
							v1 = "yes";
							break;
					}
					switch (combinations[2]) {
						case "s0.png":
							v2 = "yellow";
							break;
						case "s1.png":
							v2 = "turquoise";
							break;
						case "s2.png":
							v2 = "brown";
							break;
						case "s3.png":
							v2 = "white";
							break;
						case "s4.png":
							v2 = "light blue";
							break;
						case "s5.png":
							v2 = "red";
							break;
						case "s6.png":
							v2 = "dark blue";
							break;
						case "s7.png":
							v2 = "pearl colorful";
							break;
						case "s8.png":
							v2 = "strong colorful";
							break;
						case "s9.png":
							v2 = "super colorful";
							break;
					}
					switch (combinations[3]) {
						case "e0.png":
							v3 = "line black";
							break;
						case "e1.png":
							v3 = "indifferent";
							break;
						case "e2.png":
							v3 = "dead";
							break;
						case "e3.png":
							v3 = "green";
							break;
						case "e4.png":
							v3 = "turquoise";
							break;
						case "e5.png":
							v3 = "black";
							break;
						case "e6.png":
							v3 = "brown";
							break;
						case "e7.png":
							v3 = "purple";
							break;
						case "e8.png":
							v3 = "angry red";
							break;
						case "e9.png":
							v3 = "colorful";
							break;
					}
					switch (combinations[4]) {
						case "m0.png":
							v4 = "no";
							break;
						case "m1.png":
							v4 = "yes";
							break;
					}
					let text = `background\n${v0}\nshooting star\n${v1}\nstar\n${v2}\neyes\n${v3}\nmouth\n${v4}`;
					let starNumber = this.makeFourDigits(imageName.id);
					fs.writeFile(`./dist/output/Connected Star - ${starNumber}.txt`, text, function (err, data) {
						if (err) return console.log(err);

					});
				}
			}
		},

		// This action mixtures all the combinations between rows in the DB.
		mixCombinations: {
			async handler(ctx) {
				let dbImage = await this.model.findAll({raw: true});
				for (let i = 0; i <= dbImage.length; i++) {
					let pos1 = this.getRandomInt(1, dbImage.length);
					let combination1 = dbImage[pos1].combination;
					let pos2 = this.getRandomInt(1, dbImage.length);
					dbImage[pos1].combination = dbImage[pos2].combination;
					dbImage[pos2].combination = combination1;
				}
				try {
					await this.model.destroy({where: {}});
					await ctx.call("imagery.insert", {entities: dbImage});
				} catch (e) {
					console.log(500, e);
				}
			}
		}
	},
	methods: {
		//mix arrays with unique combination.
		product(elements) {
			if (!Array.isArray(elements)) {
				throw new TypeError();
			}
			let end = elements.length - 1,
				result = [];

			function addTo(curr, start) {
				let first = elements[start],
					last = (start === end);
				for (let i = 0; i < first.length; ++i) {
					let copy = curr.slice();
					copy.push(first[i]);
					if (last) {
						result.push(copy);
					} else {
						addTo(copy, start + 1);
					}
				}
			}

			if (elements.length) {
				addTo([], 0);
			} else {
				result.push([]);
			}
			return result;
		},

		getRandomInt(min, max) {
			min = Math.ceil(min);
			max = Math.floor(max);
			return Math.floor(Math.random() * (max - min)) + min;
		},

		getNullCon(target) {
			if (!target.con1) {
				return "con1";
			} else if (!target.con2) {
				return "con2";
			} else if (!target.con3) {
				return "con3";
			} else if (!target.con4) {
				return "con4";
			} else {
				return "error";
			}
		},

		removeSpecificNumberFromArray(array, idToRemove) {
			let indexToRemove;
			array.forEach((element, index) => {
				if (element === idToRemove) {
					indexToRemove = index;
				}
			});
			return indexToRemove;
		},

		makeFourDigits(number) {
			number = number.toString();
			if (number.length === 1) {
				number = "000" + number;
			} else if (number.length === 2) {
				number = "00" + number;
			} else if (number.length === 3) {
				number = "0" + number;
			}
			return number;
		},

		countSpacingX(number) {
			if (number === 1) {
				return 400;
			} else {
				return 500;
			}
		},

		async createNumberImageDirect(number) {
			try {
				let numberToPrint = this.makeFourDigits(number);
				let digits = numberToPrint.split('').map(Number);
				
				let x = 0;
				let baseImage = await sharp(fonts[digits[0]]).toBuffer();
				
				// Primeiro dígito tem largura 400 ou 500
				x += digits[0] === 1 ? 400 : 500;
				
				for (let i = 1; i < digits.length; i++) {
					const overlay = await sharp(fonts[digits[i]]).toBuffer();
					// Offset é a largura do dígito anterior
					const offset = digits[i-1] === 1 ? 400 : 500;
					baseImage = await sharp(baseImage)
						.composite([{ input: overlay, left: x, top: 0 }])
						.toBuffer();
					// Atualiza x para o próximo dígito
					x += digits[i] === 1 ? 400 : 500;
				}
				
				await sharp(baseImage).toFile(resolve(`${distNumbers}${numberToPrint}.png`));
				console.log(`Number ${number} created`);
			} catch (e) {
				console.error(`Error creating number ${number}:`, e.message);
			}
		},

		async sleep(ms) {
			return new Promise((resolve) => {
				setTimeout(resolve, ms);
			});
		}

	},

	async started() {
	}
};
