"use strict";

const Sequelize = require("sequelize");
const DbMixin = require("../mixins/db.mixin");

const { resolve } = require("path");
const { readdir } = require("fs").promises;
const sharp = require("sharp");
const fs = require("fs");

const assetsDir = "./assets/";
const fontsDir = "./fonts/";
const distNumbers = "./dist/numbers/";
const distOutput = "./dist/output/";

const fonts = [
	`${fontsDir}0.png`, `${fontsDir}1.png`, `${fontsDir}2.png`, `${fontsDir}3.png`, `${fontsDir}4.png`,
	`${fontsDir}5.png`, `${fontsDir}6.png`, `${fontsDir}7.png`, `${fontsDir}8.png`, `${fontsDir}9.png`
];

module.exports = {
	name: "imagery",
	mixins: [DbMixin],
	settings: {},
	model: {
		name: "imagery",
		define: {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
			combination: { type: Sequelize.STRING(1000), unique: true },
			con1: { type: Sequelize.INTEGER },
			con2: { type: Sequelize.INTEGER },
			con3: { type: Sequelize.INTEGER },
			con4: { type: Sequelize.INTEGER },
			processed: { type: Sequelize.INTEGER, defaultValue: 0 },
		},
	},

	actions: {
		readAssets: {
			async handler(ctx) {
				const model = this.adapter.db.models.imagery;
				const existingCount = await model.count();
				if (existingCount > 0) {
					console.log(`DB already has ${existingCount} records, skipping population`);
					return { count: existingCount };
				}

				let layers = [];
				let totalItems = 0;
				let maxPossibleCombinations = 0;

				const assetsFolder = await readdir(resolve(process.cwd(), assetsDir), { withFileTypes: true });
				for (const asset of assetsFolder) {
					let layerObject = { name: "", files: [], total: 0 };
					if (asset.isDirectory()) {
						layerObject.name = asset.name;
						const intraAssets = await readdir(resolve(process.cwd(), `${assetsDir}${asset.name}`));
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
					if (layer.total > 0 && maxPossibleCombinations === 0) {
						maxPossibleCombinations = layer.total;
					} else if (layer.total > 0) {
						maxPossibleCombinations *= layer.total;
					}
				}

				let possibleConnections = [];
				if (maxPossibleCombinations > 0) {
					for (let i = maxPossibleCombinations; i > 0; i--) {
						possibleConnections.push(i, i, i, i);
					}
				}

				let arrays = [];
				for (const layer of layers) {
					if (layer.total > 0) {
						for (let i = layer.files.length - 1; i > 0; i--) {
							const j = Math.floor(Math.random() * (i + 1));
							[layer.files[i], layer.files[j]] = [layer.files[j], layer.files[i]];
						}
						arrays.push(layer.files);
					}
				}

				let resultArray = this.product(arrays);
				for (let i = resultArray.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[resultArray[i], resultArray[j]] = [resultArray[j], resultArray[i]];
				}

				let dbObject = [];
				resultArray.forEach((element, index) => {
					index++;
					dbObject.push({
						id: index,
						combination: element.toString(),
						con1: null, con2: null, con3: null, con4: null,
						processed: 0
					});
				});

				for (let element of dbObject) {
					for (let conNum = 1; conNum <= 4; conNum++) {
						const conField = `con${conNum}`;
						if (element[conField] === null) {
							let position = this.getRandomInt(0, possibleConnections.length);
							while (element.id === possibleConnections[position]) {
								position = this.getRandomInt(0, possibleConnections.length);
							}
							let target = possibleConnections[position];
							let targetNullCon = this.getNullCon(dbObject[target - 1]);
							dbObject[target - 1][targetNullCon] = element.id;
							dbObject[element.id - 1][conField] = dbObject[target - 1].id;
							possibleConnections.splice(position, 1);
							possibleConnections.splice(this.removeSpecificNumberFromArray(possibleConnections, element.id), 1);
						}
					}
				}

				await this.insertEntities(dbObject);
				return { count: dbObject.length };
			}
		},

		createImage: {
			params: {
				count: { type: "number", default: 1 },
				workers: { type: "number", default: 1 }
			},
			async handler(ctx) {
				const count = ctx.params.count || 1;
				const workers = ctx.params.workers || 1;
				
				const model = this.adapter.db.models.imagery;
				let created = 0;
				
				const processImage = async (plainImage) => {
					let imageName = this.makeFourDigits(plainImage.id);
					let combinations = plainImage.combination.split(",");
					
					const loadPromises = combinations.map(async (imgName, index) => {
						const imgPath = resolve(process.cwd(), `${assetsDir}${index}/${imgName}`);
						const buffer = await sharp(imgPath).toBuffer();
						return { input: buffer, left: 0, top: 0 };
					});
					let compositeImages = await Promise.all(loadPromises);
					
					let result = await sharp(compositeImages[0].input)
						.composite(compositeImages.slice(1), { limitInputPixels: false })
						.toBuffer();
					
					await sharp(result).toFile(resolve(process.cwd(), `${distOutput}Image - ${imageName}.png`));
					return 1;
				};
				
				while (created < count) {
					const dbImage = await model.findOne({ where: { processed: 0 } });
					if (!dbImage) break;
					
					const plainImage = dbImage.get({ plain: true });
					plainImage.processed = 1;
					await model.update(plainImage, { where: { id: plainImage.id } });
					
					try {
						await processImage(plainImage);
						plainImage.processed = 2;
						await model.update(plainImage, { where: { id: plainImage.id } });
						created++;
					} catch (e) {
						plainImage.processed = 0;
						await model.update(plainImage, { where: { id: plainImage.id } });
					}
				}
				
				return { created, requested: count };
			}
		},

		createImageWithNumbers: {
			params: {
				count: { type: "number", default: 1 },
				workers: { type: "number", default: 1 }
			},
			async handler(ctx) {
				const count = ctx.params.count || 1;
				const workers = ctx.params.workers || 1;
				
				const model = this.adapter.db.models.imagery;
				let created = 0;
				
				const processImage = async (plainImage) => {
					const allNumbersDir = resolve(process.cwd(), distNumbers);
					const requiredNumbers = [plainImage.id, plainImage.con1, plainImage.con2, plainImage.con3, plainImage.con4];
					const missingNumbers = requiredNumbers.filter(n => n && !fs.existsSync(resolve(allNumbersDir, `${this.makeFourDigits(n)}.png`)));
					
					if (missingNumbers.length > 0) {
						await Promise.all(missingNumbers.map(n => this.createNumberImageDirect(n)));
					}
					
					console.log(plainImage.id, "STARTED");
					
					let imageName = this.makeFourDigits(plainImage.id);
					let combinations = plainImage.combination.split(",");
					
					const loadPromises = combinations.map(async (imgName, index) => {
						const imgPath = resolve(process.cwd(), `${assetsDir}${index}/${imgName}`);
						const buffer = await sharp(imgPath).toBuffer();
						return { input: buffer, left: 0, top: 0 };
					});
					let compositeImages = await Promise.all(loadPromises);
					
					const numDir = resolve(process.cwd(), allNumbersDir);
					const numPromises = [
						resolve(numDir, `${imageName}.png`),
						resolve(numDir, `${this.makeFourDigits(plainImage.con1)}.png`),
						resolve(numDir, `${this.makeFourDigits(plainImage.con2)}.png`),
						resolve(numDir, `${this.makeFourDigits(plainImage.con3)}.png`),
						resolve(numDir, `${this.makeFourDigits(plainImage.con4)}.png`)
					].map((p, i) => sharp(p).toBuffer().then(buf => ({
						input: buf,
						left: [550, 7850, 7850, 7850, 7850][i],
						top: [100, 5500, 6700, 7900, 9100][i]
					})));
					
					const numImages = await Promise.all(numPromises);
					compositeImages.push(...numImages);
					
					let result = await sharp(compositeImages[0].input)
						.composite(compositeImages.slice(1), { limitInputPixels: false })
						.toBuffer();
					
					await sharp(result).toFile(resolve(process.cwd(), `${distOutput}Connected Star - ${imageName}.png`));
					return 1;
				};
				
				while (created < count) {
					const dbImage = await model.findOne({ where: { processed: 0 } });
					if (!dbImage) break;
					
					const plainImage = dbImage.get({ plain: true });
					plainImage.processed = 1;
					await model.update(plainImage, { where: { id: plainImage.id } });
					
					try {
						await processImage(plainImage);
						plainImage.processed = 2;
						await model.update(plainImage, { where: { id: plainImage.id } });
						console.log(plainImage.id, "FINISHED!!!");
						created++;
					} catch (e) {
						console.log(plainImage.id, "ERROR:", e.message);
						plainImage.processed = 0;
						await model.update(plainImage, { where: { id: plainImage.id } });
					}
				}
				
				return { created, requested: count };
			}
		},

		rescale: {
			params: {
				sourceDir: { type: "string", default: "./assets/" },
				outputDir: { type: "string", default: "./dist/output-scale/" },
				percentage: { type: "number", default: 100 }
			},
			async handler(ctx) {
				const sourceDir = ctx.params.sourceDir;
				const outputDir = ctx.params.outputDir;
				const percentage = ctx.params.percentage;
				
				console.log(`=== Rescaling ${sourceDir} to ${percentage}% ===`);
				
				if (!fs.existsSync(resolve(process.cwd(), outputDir))) {
					fs.mkdirSync(resolve(process.cwd(), outputDir), { recursive: true });
				}
				
				const sourcePath = resolve(process.cwd(), sourceDir);
				const entries = await readdir(sourcePath, { withFileTypes: true });
				let count = 0;
				
				const isLayerFolder = entries.some(e => e.isDirectory() && !e.name.startsWith('.'));
				
				if (isLayerFolder) {
					for (const folder of entries) {
						if (folder.isDirectory()) {
							const outFolder = resolve(process.cwd(), outputDir, folder.name);
							fs.mkdirSync(outFolder, { recursive: true });
							
							const files = await readdir(resolve(process.cwd(), sourceDir, folder.name));
							for (const file of files) {
								if (file.endsWith(".png")) {
									const inputPath = resolve(process.cwd(), sourceDir, folder.name, file);
									const meta = await sharp(inputPath).metadata();
									const newSize = Math.round(Math.min(meta.width, meta.height) * (percentage / 100));
									
									await sharp(inputPath)
										.resize(newSize, newSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
										.toFile(resolve(outFolder, file));
									count++;
								}
							}
						}
					}
				} else {
					for (const file of entries) {
						if (file.isFile() && file.name.endsWith(".png")) {
							const inputPath = resolve(sourcePath, file.name);
							const meta = await sharp(inputPath).metadata();
							const newSize = Math.round(Math.min(meta.width, meta.height) * (percentage / 100));
							
							await sharp(inputPath)
								.resize(newSize, newSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
								.toFile(resolve(process.cwd(), outputDir, file.name));
							count++;
						}
					}
				}
				
				return { success: true, count, percentage };
			}
		}
	},

	methods: {
		product(elements) {
			if (!Array.isArray(elements)) throw new TypeError();
			let end = elements.length - 1, result = [];
			function addTo(curr, start) {
				let first = elements[start], last = (start === end);
				for (let i = 0; i < first.length; ++i) {
					let copy = curr.slice();
					copy.push(first[i]);
					if (last) result.push(copy);
					else addTo(copy, start + 1);
				}
			}
			if (elements.length) addTo([], 0);
			else result.push([]);
			return result;
		},

		getRandomInt(min, max) {
			return Math.floor(Math.random() * (Math.ceil(max) - Math.floor(min))) + Math.ceil(min);
		},

		getNullCon(target) {
			if (!target.con1) return "con1";
			if (!target.con2) return "con2";
			if (!target.con3) return "con3";
			if (!target.con4) return "con4";
			return "error";
		},

		removeSpecificNumberFromArray(array, idToRemove) {
			let indexToRemove;
			array.forEach((element, index) => {
				if (element === idToRemove) indexToRemove = index;
			});
			return indexToRemove;
		},

		makeFourDigits(number) {
			number = number.toString();
			if (number.length === 1) number = "000" + number;
			else if (number.length === 2) number = "00" + number;
			else if (number.length === 3) number = "0" + number;
			return number;
		},

		async createNumberImageDirect(number) {
			try {
				let numberToPrint = this.makeFourDigits(number);
				let digits = numberToPrint.split('').map(Number);
				
				const digitBuffers = await Promise.all(digits.map(d => sharp(fonts[d]).toBuffer()));
				
				let x = 0;
				let baseImage = digitBuffers[0];
				x += digits[0] === 1 ? 400 : 500;
				
				for (let i = 1; i < digitBuffers.length; i++) {
					baseImage = await sharp(baseImage)
						.composite([{ input: digitBuffers[i], left: x, top: 0 }])
						.toBuffer();
					x += digits[i] === 1 ? 400 : 500;
				}
				
				await sharp(baseImage).toFile(resolve(`${distNumbers}${numberToPrint}.png`));
			} catch (e) {
				console.error(`Error creating number ${number}:`, e.message);
			}
		}
	},

	async started() {}
};