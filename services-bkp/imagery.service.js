// "use strict";

const Sequelize = require("sequelize");
const DbMixin = require("../mixins/db.mixin");
const {MoleculerClientError} = require("moleculer").Errors;

const {resolve} = require("path");
const {readdir} = require("fs").promises;
const jimp = require("jimp");
const dir = "../assets";
const fontsDir = "./fonts/";
const allNumbersDir = "../allNumbers";
const dist = "../dist";

let fonts = [`${fontsDir}/0.png`, `${fontsDir}/1.png`, `${fontsDir}/2.png`, `${fontsDir}/3.png`, `${fontsDir}/4.png`, `${fontsDir}/5.png`, `${fontsDir}/6.png`, `${fontsDir}/7.png`, `${fontsDir}/8.png`, `${fontsDir}/9.png`];
let jfg = []; // JIMP FONTS GLOBAL

module.exports = {
	name: "imagery",
	mixins: [DbMixin],
	settings: {},
	model: {
		name: "imagery",
		define: {
			id: {type: Sequelize.INTEGER, primaryKey: true},
			combination: {type: Sequelize.STRING, primaryKey: true},
			con1: {type: Sequelize.INTEGER, primaryKey: true},
			con2: {type: Sequelize.INTEGER, primaryKey: true},
			con3: {type: Sequelize.INTEGER, primaryKey: true},
			con4: {type: Sequelize.INTEGER, primaryKey: true},
			processed: {type: Sequelize.INTEGER},
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
				for (const layer of layers) {
					if (maxPossibleCombinations === 0) {
						maxPossibleCombinations = layer.total;
					} else {
						maxPossibleCombinations *= layer.total;
					}
				}


				// let asd = ["1", "2", "3"];
				// asd = asd.toString();
				// asd = asd.split(',');
				// console.log(layers);

				// for (let i = 1; i <= maxPossibleCombinations; i++) {
				// 	let combination = [];
				// 	for ()
				// }

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
						arrays.push(layer.files);
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

				// console.log(dbObject);
				await ctx.call("imagery.insert", {entities: dbObject});
				// console.log(123, layers);
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
				await ctx.call("imagery.createNumberImage");
				let callNumber = initialNumber + steps;
				// if (!(lastNumber >= maximumNumber)) {
				if (!(initialNumber >= maximumNumber)) {
					ctx.call("imagery.createImage", {initialNumber: callNumber});
				}
			}
		},
		createImage: {
			async handler(ctx) {
				let dbImage = await this.model.findOne({where: {processed: 0}, raw: true});
				if (!dbImage) {
					console.log("All numbers PROCESSED!");
					return 1;
				} else {
					dbImage.processed = 1;
					await ctx.call("imagery.update", dbImage);
				}

				let jimpImages = [];
				let combinations = dbImage.combination.split(",");
				try {
					for (let [index, imageName] of combinations.entries()) {
						jimpImages.push(await jimp.read(`${dir}/${index}/${imageName}`));
					}
					let connId = await jimp.read(`${allNumbersDir}/${dbImage.id}.png`);
					let conn1 = await jimp.read(`${allNumbersDir}/${dbImage.con1}.png`);
					let conn2 = await jimp.read(`${allNumbersDir}/${dbImage.con2}.png`);
					let conn3 = await jimp.read(`${allNumbersDir}/${dbImage.con3}.png`);
					let conn4 = await jimp.read(`${allNumbersDir}/${dbImage.con4}.png`);

					// console.log(12, combinations.length);
					// console.log(12, dbImage);
					for (let i = 0; i <= combinations.length - 1; i++) {
						await jimpImages[0].composite(jimpImages[i], 0, 0);
					}
					await jimpImages[0].composite(connId, 550, 100);
					await jimpImages[0].composite(conn1, 7850, 5500);
					await jimpImages[0].composite(conn2, 7850, 6700);
					await jimpImages[0].composite(conn3, 7850, 7900);
					await jimpImages[0].composite(conn4, 7850, 9100);

					await jimpImages[0].write(`${dist}/Connected Star - ${dbImage.id}.png`, function () {
						console.log(ctx.params.number, "DONE!!!");
					});
					dbImage.processed = 2;
					await ctx.call("imagery.update", dbImage);
					return 1;

				} catch (e) {
					dbImage.processed = 0;
					await ctx.call("imagery.update", dbImage);
					return -1;
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

		async sleep(ms) {
			return new Promise((resolve) => {
				setTimeout(resolve, ms);
			});
		}

	},

	async started() {
		// for (let i = 0; i < fonts.length; i++) {
		// 	jfg.push(await jimp.read(fonts[i]));
		// }
		console.log("all fonts read!");
	}
};
