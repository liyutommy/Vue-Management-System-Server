/**
 * 维护用户ID自增长表
 */
const mongoose = require("mongoose");

const counterSchema = mongoose.Schema({
	_id: String,
	sequence_value: Number,
});

// params: name, schema, collectionName
const CounterModel = mongoose.model("counter", counterSchema, "counters");

module.exports = CounterModel;
