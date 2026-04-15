"use strict";

// import Sequelize from "sequelize";
const Sequelize = require("sequelize");
// const DbService = require("moleculer-db");
const envConfig = require("../env.config");
// const SqlAdapter = require("moleculer-db-adapter-sequelize");
const MoleculerSequelize = require("moleculer-sequelize");
const Op = Sequelize.Op;


/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbMixin = {
	mixins: [MoleculerSequelize],
	settings: {
		force: true,
		sequelize: new Sequelize(envConfig.database.database, envConfig.database.user, envConfig.database.password, {
			host: envConfig.database.url,
			dialect: "mysql",
			pool: {
				max: 5,
				min: 0,
				idle: 10000
			},
			logging: false
		})
	},
	actions: {
		// listEntities: {
		// 	cache: true,
		// 	async handler({params}) {
		// 		let {page, pageSize, sort, ...request} = params;
		// 		let query = {};
		// 		for (let prop in request) {
		// 			query[prop] = {[Op.like]: `%` + request[prop] + `%`}
		// 		}
		// 		return this.broker.call(`${this.fullName}.list`, {
		// 			page,
		// 			pageSize,
		// 			maxPageSize: 100,
		// 			sort,
		// 			query: query
		// 		});
		// 	}
		// },

		// CAUTION it will remove all matching rolls!
		// removeWhere: {
		// 	params: {
		// 		where: "object",
		// 		$$strict: true
		// 	},
		// 	async handler({params}) {
		// 		return this.model.destroy(params.query);
		// 	}
		// }
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

		// Method to get all relation methods of a model object.
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
