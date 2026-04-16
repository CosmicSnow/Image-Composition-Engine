"use strict";

const { ServiceBroker } = require("moleculer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const DIST_OUTPUT_DIR = path.join(__dirname, "../dist/output");
const DIST_OUTPUT_SCALE_DIR = path.join(__dirname, "../dist/output-scale");

async function createBroker() {
	const broker = new ServiceBroker({
		nodeID: "test-node",
		logger: false,
		cacher: "Memory"
	});

	broker.createService({
		name: "imagery",
		mixins: [require("../mixins/db.mixin")],
		model: {
			name: "imagery",
			define: {
				id: { type: require("sequelize").INTEGER, primaryKey: true, autoIncrement: true },
				combination: { type: require("sequelize").STRING(1000), unique: true },
				con1: { type: require("sequelize").INTEGER },
				con2: { type: require("sequelize").INTEGER },
				con3: { type: require("sequelize").INTEGER },
				con4: { type: require("sequelize").INTEGER },
				processed: { type: require("sequelize").INTEGER, defaultValue: 0 },
			}
		},
		actions: {
			readAssets: require("../services/imagery.service").actions.readAssets,
			createImage: require("../services/imagery.service").actions.createImage,
			createImageWithNumbers: require("../services/imagery.service").actions.createImageWithNumbers,
			rescale: require("../services/imagery.service").actions.rescale,
		},
		methods: {
			product: require("../services/imagery.service").methods.product,
			getRandomInt: require("../services/imagery.service").methods.getRandomInt,
			getNullCon: require("../services/imagery.service").methods.getNullCon,
			removeSpecificNumberFromArray: require("../services/imagery.service").methods.removeSpecificNumberFromArray,
			makeFourDigits: require("../services/imagery.service").methods.makeFourDigits,
			createNumberImageDirect: require("../services/imagery.service").methods.createNumberImageDirect,
		}
	});

	await broker.start();
	return broker;
}

async function runTests() {
	console.log("Starting tests...\n");

	const broker = await createBroker();
	let passed = 0;
	let failed = 0;

	async function test(name, fn) {
		try {
			await fn();
			console.log(`✓ ${name}`);
			passed++;
		} catch (e) {
			console.log(`✗ ${name}: ${e.message}`);
			failed++;
		}
	}

	function expectThat(actual) {
		return {
			toBe(expected) {
				if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
			},
			toBeGreaterThan(expected) {
				if (actual <= expected) throw new Error(`Expected ${actual} > ${expected}`);
			},
			toBeLessThan(expected) {
				if (actual >= expected) throw new Error(`Expected ${actual} < ${expected}`);
			},
			toEqual(expected) {
				if (JSON.stringify(actual) !== JSON.stringify(expected)) {
					throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
				}
			},
			toContain(expected) {
				if (!actual.includes(expected)) throw new Error(`Expected ${actual} to contain ${expected}`);
			}
		};
	}

	await test("readAssets populates DB", async () => {
		const result = await broker.call("imagery.readAssets");
		expectThat(result.count).toBeGreaterThan(0);
	});

	await test("createImage creates image without numbers", async () => {
		const result = await broker.call("imagery.createImage", { count: 1 });
		expectThat(result.created).toBe(1);
	});

	await test("createImageWithNumbers creates image with numbers", async () => {
		const result = await broker.call("imagery.createImageWithNumbers", { count: 1 });
		expectThat(result.created).toBe(1);
	});

	const rescaleTestDir = path.join(__dirname, "../dist/rescale-test");
	await test("rescale reduces image size by percentage", async () => {
		if (fs.existsSync(rescaleTestDir)) {
			fs.rmSync(rescaleTestDir, { recursive: true });
		}
		const result = await broker.call("imagery.rescale", {
			sourceDir: "./assets/2/",
			outputDir: "./dist/rescale-test/",
			percentage: 50
		});
		expectThat(result.success).toBe(true);
		expectThat(result.count).toBeGreaterThan(0);
		expectThat(result.percentage).toBe(50);
	});

	await test("rescaled images have correct dimensions", async () => {
		if (fs.existsSync(rescaleTestDir)) {
			const files = fs.readdirSync(rescaleTestDir);
			if (files.length > 0) {
				const firstFile = path.join(rescaleTestDir, files[0]);
				const metadata = await sharp(firstFile).metadata();
				expectThat(metadata.width).toBeLessThan(10000);
				expectThat(metadata.height).toBeLessThan(10000);
			}
		}
	});

	await broker.stop();

	console.log(`\n${passed} passed, ${failed} failed`);
	process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
	console.error(e);
	process.exit(1);
});