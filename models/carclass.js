var mongoose = require('mongoose');
var CarClassSchema = require('../schemas/carclass');
var CarClass = mongoose.model('CarClass', CarClassSchema);

module.exports = CarClass;