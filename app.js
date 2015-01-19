var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var mongoose = require('mongoose');
var _ = require('underscore');

var request = require("request");
var iconv = require('iconv-lite');//流编码
var cheerio = require('cheerio');//dom解析
var BufferHelper = require('bufferhelper')
    , FeedParser = require('feedparser')
    , Iconv = require('iconv').Iconv;

var port = process.env.PORT || 3000; //cmd: PORT=4000 node app.js
var app = express();

// Models
var CarClass = require('./models/carclass');

// DB cfg
//mongoose.connect('mongodb://localhost/movie');
mongoose.connect('mongodb://root:root@localhost:27017/cheguanwang');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb connection error ...'));
db.once('open', function callback() {
    console.info("mongodb opened ...");
});

app.set('views', './views/pages');
app.set('view engine', 'jade');
app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'public')));
app.locals.moment = require('moment');
app.listen(port);

console.log('movie started on port ' + port);


var fatchUrl = "";


app.get('/fetch/show', function (req, res) {
    var options = {
        uri: "http://www.autohome.com.cn/ashx/AjaxIndexCarFind.ashx?type=1",
        encoding: null//编码
    }
    request.post(options, function (error, response, body) {
        if (error)console.log(error);
        console.log(response);
        if (!error && response.statusCode == 200) {
            var str = iconv.decode(body, 'GBK');
            console.log(str);
            res.json(str)
        }
    })
});

//抓取数据并存储
app.get('/carinfo/fetch', function (req, res) {
    request.post({
        uri: "http://www.autohome.com.cn/ashx/AjaxIndexCarFind.ashx?type=1",
        encoding: null
    }, function (error, response, body) {
        if (error)console.log(error);
        console.log(response);
        if (!error && response.statusCode == 200) {
            var dataStr = iconv.decode(body, 'GBK');
            var jsonData = JSON.parse(dataStr);
            var carsInfo = jsonData.result.branditems;
            var _carsInfo=[];
            for(var i=0;i<carsInfo.length;i++) {
                var carInfo = carsInfo[i];
                var _carInfo = {
                    initial:carInfo.bfirstletter,
                    name: carInfo.name
                }
                _carsInfo.push(_carInfo);
                console.log(_carInfo);
            }
            CarClass.create(_carsInfo);
            res.json(carsInfo)
        }
    })
});