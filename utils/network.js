"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var URL = require("./purl.js");
var cookieEntity = (function () {
    function cookieEntity() {
    }
    return cookieEntity;
}());
/**
 * Cookie 管理类
 * 1.不支持使用转义字符(例如:";" "=")
 * 2.暂时不能存储到本地
 * @class GZCookieManager
 * @implements {IGZCookieStorage}
 */
var GZCookieManager = (function () {
    function GZCookieManager() {
        this.defaultCookieLife = 24 * 60 * 60 * 1000; //默认 cookie 有效期 1天
        this.cookieStorage = new Array();
    }
    GZCookieManager.newInstance = function () {
        if (GZCookieManager.instance == null) {
            GZCookieManager.instance = new GZCookieManager();
        }
        return GZCookieManager.instance;
    };
    ;
    /**
     * 获取匹配当前 url 的 cookies
     *
     * @param {string} url 完整的网络请求
     * @returns {cookieEntity[]} 有效的 cookies
     * @memberof GZCookieStorage
     */
    GZCookieManager.prototype.getCookieItemsWithURL = function (url) {
        var suitableItem = new Array();
        try {
            var requestURL = new GZURL(url);
        }
        catch (error) {
            var requestURL = new GZURL(url);
        }
        suitableItem = this.getCookieItems(requestURL.host, requestURL.pathname, requestURL.protocol);
        return suitableItem;
    };
    ;
    /**
     * 获取匹配当前 url 的 cookies,拼接成字符串
     *
     * @type {(url:string)} url 完整的网络请求
     * @returns {string} 拼接后的 cookie
     * @memberof GZCookieStorage
     */
    GZCookieManager.prototype.getCookieItemsStringWithURL = function (url) {
        var suitableItems = new Array();
        suitableItems = this.getCookieItemsWithURL(url);
        var cookieStr = '';
        for (var item in suitableItems) {
            if (suitableItems.hasOwnProperty(item)) {
                var element = suitableItems[item];
                cookieStr = cookieStr + element.name + '=' + element.value;
                cookieStr = cookieStr + ';';
            }
        }
        if (cookieStr.lastIndexOf(';') > -1 && cookieStr.lastIndexOf(';') == cookieStr.length - 1) {
            cookieStr = cookieStr.substr(0, cookieStr.length - 1);
        }
        return cookieStr;
    };
    ;
    GZCookieManager.prototype.getCookieItems = function (domain, path, protocol) {
        var suitableItem = new Array();
        if (protocol == null || protocol == undefined) {
            protocol = 'http';
        }
        for (var item in this.cookieStorage) {
            if (this.cookieStorage.hasOwnProperty(item)) {
                var cookieItem = this.cookieStorage[item];
                var isSuit = false;
                // 判断 domain
                if (cookieItem.domain == domain) {
                    isSuit = true;
                }
                // 判断 path
                if (isSuit == true && path.indexOf(cookieItem.path) < 0) {
                    isSuit = false;
                }
                // secure 保护
                if (isSuit == true && cookieItem.secure == true) {
                    if (protocol == 'https') {
                        isSuit = true;
                    }
                    else {
                        isSuit = false;
                    }
                }
                // 判断是否过期
                if (isSuit == true && cookieItem.expires.valueOf() < new Date().valueOf()) {
                    isSuit = false;
                }
                if (isSuit == true) {
                    suitableItem.push(cookieItem);
                }
            }
        }
        return suitableItem;
    };
    ;
    /**
     * 添加 cookie 到 cookie 存储
     * @param {string} url 当前网络请求的 url
     * @param {string} cookieOrigin cookie 原始数据,从 header 的 Set-Cookie 读取
     * @returns {boolean}  true 添加 cookie 成功
     * @memberof GZCookieStorage
     */
    GZCookieManager.prototype.addCookie = function (url, cookieOrigin) {
        try {
            var requestURL = new GZURL(url);
        }
        catch (error) {
            var requestURL = new webkitURL(url);
        }
        var cookieItem = new cookieEntity();
        var cookieStrs = cookieOrigin.split(';');
        if (cookieStrs.length > 0) {
            var cookiemessage = cookieStrs[0];
            var cookieInfo = cookiemessage.split('=');
            cookieItem.name = cookieInfo[0];
            cookieItem.value = cookieInfo[1];
        }
        cookieItem.domain = requestURL.host;
        cookieItem.path = requestURL.pathname;
        cookieItem.expires = new Date(new Date().valueOf() + this.defaultCookieLife);
        cookieItem.secure = false;
        cookieItem.httponly = false;
        for (var index = 1; index < cookieStrs.length; index++) {
            var element = cookieStrs[index];
            if (element.toLocaleLowerCase().indexOf('domain') > -1) {
                var domainStr = element.split('=');
                cookieItem.domain = domainStr[1];
            }
            if (element.toLocaleLowerCase().indexOf('path') > -1) {
                var domainStr = element.split('=');
                cookieItem.path = domainStr[1];
            }
            if (element.toLocaleLowerCase().indexOf('expires') > -1) {
                var domainStr = element.split('=');
                cookieItem.expires = new Date(Date.parse(domainStr[1]));
            }
            if (element.toLocaleLowerCase().indexOf('secure') > -1) {
                cookieItem.secure = true;
            }
            if (element.toLocaleLowerCase().indexOf('httponly') > -1) {
                cookieItem.httponly = true;
            }
        }
        if (cookieItem.domain != null && cookieItem.domain != undefined && cookieItem.expires != null && cookieItem.expires != undefined) {
            //Cookie 存储中 name 是唯一的
            this.cookieStorage[cookieItem.name + cookieItem.path + cookieItem.domain + cookieItem.secure + cookieItem.httponly] = cookieItem;
            return true;
        }
        return false;
    };
    ;
    GZCookieManager.prototype.removeCookie = function (item) {
        this.cookieStorage.splice(this.cookieStorage.indexOf(item), 1);
    };
    ;
    /**
     * 验证 cookie 有效性
     * @param {string} domain domain
     * @param {string} path path
     * @param {cookieEntity} item 需要验证的 cookie
     * @returns {boolean} true cookie 适用于 domain+path
     * @memberof GZCookieStorage
     */
    GZCookieManager.prototype.validCookie = function (domain, path, item) {
        var result = false;
        if (item.domain.indexOf(domain))
            return false;
    };
    GZCookieManager.instance = null;
    return GZCookieManager;
}());
exports.GZCookieManager = GZCookieManager;
var GZNetwork = (function () {
    function GZNetwork() {
    }
    GZNetwork.prototype.request = function (param) {
        var detorator = new GZNetworkDetorator();
        return detorator.request(param);
    };
    return GZNetwork;
}());
exports.gzNetwork = new GZNetwork();
var GZNetworkDetorator = (function () {
    function GZNetworkDetorator() {
    }
    GZNetworkDetorator.prototype.request = function (param) {
        this.requestParam = param;
        var cookieManager = GZCookieManager.newInstance();
        var cookieStr = cookieManager.getCookieItemsStringWithURL(param.url);
        if (param.header == null) {
            param.header = new Object();
        }
        param.header['Cookie'] = cookieStr;
        var that = this;
        return wx.request({
            url: this.requestParam.url,
            data: this.requestParam.data,
            header: this.requestParam.header,
            method: this.requestParam.method,
            dataType: this.requestParam.dataType,
            success: function (res) {
                that.gzSuccess(res);
            },
            fail: function (res) {
                that.gzFail(res);
            },
            complete: function (res) {
                that.gzComplete(res);
            }
        });
    };
    GZNetworkDetorator.prototype.gzSuccess = function (res) {
        if (this.requestParam != null) {
            //解析 Cookie
            var cookieManager = GZCookieManager.newInstance();
            var responseHeader = res.header;
            for (var key in responseHeader) {
                if (responseHeader.hasOwnProperty(key)) {
                    var element = responseHeader[key];
                    if (key.toLocaleLowerCase().indexOf('set-cookie') > -1) {
                        cookieManager.addCookie(this.requestParam.url, element);
                    }
                }
            }
            if (this.requestParam.success != null) {
                this.requestParam.success(res);
            }
        }
    };
    GZNetworkDetorator.prototype.gzFail = function (res) {
        if (this.requestParam != null) {
            //解析 Cookie
            var cookieManager = GZCookieManager.newInstance();
            var responseHeader = res.header;
            for (var key in responseHeader) {
                if (responseHeader.hasOwnProperty(key)) {
                    var element = responseHeader[key];
                    if (key.toLocaleLowerCase().indexOf('set-cookie') > -1) {
                        cookieManager.addCookie(this.requestParam.url, element);
                    }
                }
            }
            if (this.requestParam.fail != null) {
                this.requestParam.fail(res);
            }
        }
    };
    GZNetworkDetorator.prototype.gzComplete = function (res) {
        if (this.requestParam != null) {
            //解析 Cookie
            var cookieManager = GZCookieManager.newInstance();
            var responseHeader = res.header;
            for (var key in responseHeader) {
                if (responseHeader.hasOwnProperty(key)) {
                    var element = responseHeader[key];
                    if (key.toLocaleLowerCase().indexOf('set-cookie') > -1) {
                        cookieManager.addCookie(this.requestParam.url, element);
                    }
                }
            }
            if (this.requestParam.complete != null) {
                this.requestParam.complete(res);
            }
        }
    };
    return GZNetworkDetorator;
}());
// class GZURL implements URL{
var GZURL = (function () {
    function GZURL(url) {
        // protected _hash:string = '';
        // get hash(){
        //     // this._hash = this.url.hash();
        //     return this._hash;
        // }
        this._host = '';
        this._hostname = '';
        // protected _href:string = '';
        // get href(){
        //     // this._href = this.url.href();
        //     return this._href;
        // }
        this._origin = '';
        // protected _password = '';
        // get password(){
        //     // this._password = this.url.password();
        //     return this._password;
        // }
        this._pathname = '';
        this._port = '';
        this._protocol = '';
        this.urlStr = url;
        this.url = URL(this.urlStr);
    }
    Object.defineProperty(GZURL.prototype, "host", {
        get: function () {
            this._host = this.url.attr('host') + ':' + this.url.attr('port');
            return this._host;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GZURL.prototype, "hostname", {
        get: function () {
            this._hostname = this.url.attr('host');
            return this._hostname;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GZURL.prototype, "origin", {
        get: function () {
            this._origin = this.urlStr;
            return this._origin;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GZURL.prototype, "pathname", {
        get: function () {
            this._pathname = this.url.attr('directory');
            return this._pathname;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GZURL.prototype, "port", {
        get: function () {
            this._port = this.url.attr('port');
            return this._port;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GZURL.prototype, "protocol", {
        get: function () {
            this._protocol = this.url.attr('protocol');
            return this._protocol;
        },
        enumerable: true,
        configurable: true
    });
    return GZURL;
}());
//# sourceMappingURL=network.js.map