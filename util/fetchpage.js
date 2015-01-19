var request = require("request");
var cheerio = require('cheerio');//dom解析
var BufferHelper = require('bufferhelper');
var FeedParser = require('feedparser');
var Iconv = require('iconv').Iconv;
var iconv = require('iconv-lite');//流编码


// 品牌logo抓取, 便利pid null 的品牌数据, name匹配
/**抓取网页全文源代码、主要用来抓取新闻正文
 * @param url 需要抓取的url地址
 * @param calback
 */
function fetchContent(url, initial, name, calback) {
    var req = request(url, {timeout: 300000, pool: false});
    req.setMaxListeners(1000);
    req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
    req.setHeader('accept', 'text/html,application/xhtml+xml');

    req.on('error', function (err) {
        console.log(err);
        console.log("on error, initial: " + initial + ", name: " + name);
    });
    req.on('response', function (res) {
        var bufferHelper = new BufferHelper();
        res.on('data', function (chunk) {
            bufferHelper.concat(chunk);
        });
        res.on('end', function () {
            var result = iconv.decode(bufferHelper.toBuffer(), 'GBK');
            calback(result);
        });
    });
}

var pageCache = {};

/**
 * 截取单个新闻的正文，
 * @param url 新闻的url地址
 * @param tag 新闻在web界面开始的标签 如: 新闻正文
 。 content即为tag
 */
function fetchByNameAndInitial(carClass, imgSize, callback) {
    var name = carClass.name;//.replace('·', '');//品牌名
    var initial = carClass.initial.toUpperCase();//品牌首字母

    var resData = function (htmlData) {
        var $ = cheerio.load(htmlData);
        var dt = $('a').filter(function () {
            return $(this).text().trim() == name;
        }).parents('dt');
        var img = $(dt).find('img');
        var logo = $(img).attr("src");
        var imgPathBase = "http://img.autoimg.cn/logo/brand/" + imgSize;
        if (logo) {
            logo = imgPathBase + logo.substr(logo.lastIndexOf('/'))
        }
        carClass.logo = logo;
        callback(carClass);
    };
    var url = "http://www.autohome.com.cn/grade/carhtml/" + initial + ".html";
    console.log(url);

    if (pageCache[initial]) {
        resData(pageCache[initial]);
    } else {
        fetchContent(url, initial, name, function (htmlData) {
            pageCache[initial] = htmlData;
            resData(htmlData);
        });
    }
};

//var zx = ["A","B","C","D","E","F","G","H","J","K","O","M","N","O","P","Q","R","S","T","W","X","W","Z"];

exports.fetchByNameAndInitial = fetchByNameAndInitial;