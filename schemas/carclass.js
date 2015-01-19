var mongoose = require('mongoose');

var CarClassSchema = new mongoose.Schema({
    pid: {type: String},//父级ID
    ppath: {type: Array},//父级路径
    level: {type: Number},//级
    name: {type: String},//名称
    logo: {type: String},//logo
    initial: {type: String},//首字母
    manufacturer: {type: String},//生产厂商
    status: {type: Number, default: 1},//1-正常-1删除
    createTime: {type: Number},
    updateTime: {type: Number}
});//, {collection: 'carclass'}
CarClassSchema.index({status: 1, pid: 1});
CarClassSchema.index({ppath: 1});

/**
 * 每次存储数据save之前调用
 */
CarClassSchema.pre('save', function (next) {
    if (this.isNew) {
        this.createTime = this.createTime = Date.now()
        this.updateTime = this.updateTime = Date.now()
    } else {
        this.meta.updateAt = Date.now()
    }
    ;
    next();
})


CarClassSchema.statics = {
    fetch: function (cb) {
        return this
            .find({})
            .sort('updateTime')
            .exec(cb)
    },
    findById: function (id, cb) {
        return this
            .findOne({_id: id})
            .sort('updateTime')
            .exec(cb)
    }
};

module.exports = CarClassSchema;