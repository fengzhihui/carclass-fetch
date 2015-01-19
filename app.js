var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var mongoose = require('mongoose');
var _ = require('underscore');

var request = require("request");
var iconv = require('iconv-lite');//流编码


var port = process.env.PORT || 3000; //cmd: PORT=4000 node app.js
var app = express();

// Models
var CarClass = require('./models/carclass');

// Util
var fetchpage = require("./util/fetchpage");

// data
var CarData = require('./data/cardata');

// DB cfg
//mongoose.connect('mongodb://localhost/movie');
mongoose.connect('mongodb://root:root@192.168.168.108:27017/cheguanwang');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb connection error ...'));
db.once('open', function callback() {
    console.info("mongodb opened ...");
});

app.set('views', './views/pages');
app.set('view engine', 'jade');
//app.use(bodyParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.locals.moment = require('moment');
app.listen(port);

console.log('movie started on port ' + port);

var fetchFunction = function (params, cb) {
    var options = {
        uri: "http://www.autohome.com.cn/ashx/AjaxIndexCarFind.ashx",
        formData: params,
        encoding: null//编码
    }
    request.post(options, function (error, response, body) {
        if (error)console.log(error);
        if (!error && response.statusCode == 200) {
            var str = iconv.decode(body, 'GBK');
            var jsonData = JSON.parse(str);
            cb(jsonData);
        }
    });
};

//品牌存储
var savePpCarClass = function (data, cb) {
    var _PpCarClass = new CarClass({
        name: data.name,
        initial: data.bfirstletter,
        level: 1,
        //logo: '',//'http://car0.autoimg.cn/logo/brand/100/130131578038733348.jpg',
        status: 1
    });
    _PpCarClass.save(function (err, ppCarClass) {
        cb(ppCarClass, data.id);
    });
};
//系列存储
var saveXlCarClass = function (data, category, ppid, cb) {
    var _xlCarClass = new CarClass({
        pid: ppid,
        ppath: [ppid],
        manufacturer: category,
        name: data.name,
        initial: data.firstletter,
        level: 2,
        //logo: 'http://car0.autoimg.cn/logo/brand/100/130131578038733348.jpg',
        status: 1
    });
    _xlCarClass.save(function (err, xlCarClass) {
        cb(xlCarClass, data.id);
    });
};
//型号存储
var saveXhCarClass = function (data, category, ppids, cb) {
    var _xhCarClass = new CarClass({
        pid: ppids[0],
        ppath: ppids,
        manufacturer: category,
        name: data.name,
        level: 3,
        //logo: 'http://car0.autoimg.cn/logo/brand/100/130131578038733348.jpg',
        status: data.state == 40 ? 0 : 1
    });
    _xhCarClass.save(function (err, xhCarClass) {
        cb(xhCarClass);
    });
};

//汽车品牌: {type: 1}
//汽车系列: {type: 3, value: '品牌id'}
//汽车型号:{type: 5, value: '系列id'}
//车型状态　status: 40 停售=0,20 在售=1

app.get('/fetch/show', function (req, res) {
    fetchFunction({type: 1}, function (resJson) {
        res.json(resJson);
    });
});

app.get('/carclass', function (req, res) {

});

app.get('/carclass/fetch/save', function (req, res) {
    fetchFunction({type: 1}, function (ppJson) {//品牌抓取
        //var ppList = [ppJson.result.branditems[0], ppJson.result.branditems[1]];
        //var ppList = [ppJson.result.branditems[0]];
        var ppList = ppJson.result.branditems;
        for (var i = 0; i < ppList.length; i++) {
            var ppCarClass = ppList[i];
            savePpCarClass(ppCarClass, function (_ppCarClass, ppId) {//品牌存储
                console.log("品牌名称: " + _ppCarClass.name)
                var parentId = _ppCarClass._id.toString();
                fetchFunction({type: 3, value: ppId}, function (xlJson) {//系列抓取
                    var xlCategoryList = xlJson.result.factoryitems;
                    for (var j = 0; j < xlCategoryList.length; j++) {
                        var xlCategory = xlCategoryList[j];
                        console.log("系列分类名称: " + xlCategory.name);
                        var xlCarClassList = xlCategory.seriesitems;
                        for (var jj = 0; jj < xlCarClassList.length; jj++) {
                            var xlCarClass = xlCarClassList[jj];
                            saveXlCarClass(xlCarClass, xlCategory.name, parentId, function (_xlCarClass, xlId) {//系列存储
                                console.log("系列名称: " + _xlCarClass.name);
                                fetchFunction({type: 5, value: xlId}, function (xhJson) {//型号抓取
                                    var xhCategoryList = xhJson.result.yearitems;
                                    for (var l = 0; l < xhCategoryList.length; l++) {
                                        var xhCategory = xhCategoryList[l];
                                        var xhCarClassList = xhCategory.specitems;
                                        for (var ll = 0; ll < xhCarClassList.length; ll++) {
                                            var xhCarClass = xhCarClassList[ll];
                                            saveXhCarClass(xhCarClass, _xlCarClass.name, [_xlCarClass._id.toString(), _ppCarClass._id.toString()], function (_xhCarClass) {
                                                console.log("型号名称: " + _xhCarClass.name);
                                            });
                                        }
                                    }
                                    ;
                                });
                            });
                        }
                    }
                });
            });
        }
        res.send('fetch and save success;');
    });
});

app.get('/tx/car/data', function (req, res) {
    res.json(CarData.data);
});

app.get('/test/logo', function (req, res) {
    fetchpage.fetchByNameAndInitial({name: '阿斯顿·马丁', initial: 'A'}, 100, function (data) {
        res.send(data);
    });
});

//更新logo入库
app.get('/carclass/update/logo', function (req, res) {
    //var q = CarClass.find({pid: null}).sort('initial').limit(1).lean();
    var q = CarClass.find({pid: null}).sort('initial').lean();
    q.exec(function (err, ppCarClassArr) {
        for (var i = 0; i < ppCarClassArr.length; i++) {
            var carClass = ppCarClassArr[i];
            fetchpage.fetchByNameAndInitial(carClass, 50, function (_carClass) {
                CarClass.update({_id: _carClass._id}, {$set: {logo: _carClass.logo}}, function (err, numberAffected, raw) {
                    console.log('The number of updated documents was %d', numberAffected);
                    console.log('The raw response from Mongo was ', raw);
                });
                CarClass.update({ppath: {$in: [_carClass._id.toString()]}}, {$set: {logo: _carClass.logo}},  { multi: true }, function (err, numberAffected, raw) {
                    console.log('The number of updated documents was %d', numberAffected);
                    console.log('The raw response from Mongo was ', raw);
                });

            });
        }
        res.json(ppCarClassArr)
    });
});

app.get('/carclass/remove/empty/logo', function (req, res) {
    CarClass.find({logo: null}).remove(function () {
        console.log('removed!')
    });
    CarClass.find({pid: null, logo: null}, function (err, list) {
        res.json(list);
    });
});

app.get('/', function (req, res) {
    res.render('fetchdata')
});