// "use strict";

const Sequelize = require("sequelize");
const DbMixin = require("../mixins/db.mixin");
const {MoleculerClientError} = require("moleculer").Errors;

const {resolve} = require("path");
const {readdir} = require("fs").promises;


module.exports = {
	name: "numberTable",
	mixins: [DbMixin],
	settings: {},
	model: {
		name: "numberTable",
		define: {
			id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
			number: {type: Sequelize.INTEGER, unique: true},
			processed: {type: Sequelize.INTEGER, defaultValue: 0},
		},
	},

	actions: {
		insertNumbers: {
			params: {
				first: "number",
				last: "number",
			},
			async handler(ctx) {
				let maximumNumber = ctx.params.last;
				let dbArray = [];
				for (let i = ctx.params.first; i <= maximumNumber; i++) {
					dbArray.push({
						number: i,
						processed: 0,
					});
				}
				await ctx.call("numberTable.insert", {entities: dbArray});
			}
		},
		findOneByProcessed: {
			params: {
				processed: "number"
			},
			cache:false,
			async handler(ctx) {
				let processed = ctx.params.processed;
				return await this.model.findOne({where:{processed}});
			}
		},
		find:{cache:false},
		get:{cache:false}
	},
	methods: {},
	async started() {
	}
};
