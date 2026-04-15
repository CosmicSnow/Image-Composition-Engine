"use strict";

const Sequelize = require("sequelize");
const path = require("path");
const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const Op = Sequelize.Op;

const dbPath = path.join(__dirname, "../dist/data/chimera.db");

const adapter = new SqlAdapter({
	dialect: "sqlite",
	storage: dbPath,
	logging: false
});

const sequelize = new Sequelize({
	dialect: "sqlite",
	storage: dbPath,
	logging: false
});

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbMixin = {
	mixins: [DbService],
	adapter,
	settings: {
		force: true
	},
	actions: {
	},
	events: {
		"seedDb": {
			params: {
				tableName: "string"
			},
			handler(ctx) {
				this.actions.seedDbNow({tableName});
			}
		}
	},
	methods: {
		getModelMethods(obj) {
			let result = [];
			for (let id in obj) {
				try {
					if (typeof (obj[id]) == "function") {
						result.push(id + ": " + obj[id].toString());
					}
				} catch (err) {
					result.push(id + ": inaccessible");
				}
			}
			console.log(result.join("\n"));
			return result;
		}
	},
	async started() {
	}
};

module.exports = DbMixin;
