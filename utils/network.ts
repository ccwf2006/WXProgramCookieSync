import * as URL from './purl.js';

// TODO: 修改 cookieStorage ,改进查找性能

interface IGZCookieStorage{
    getCookieItemsWithURL(url:string):cookieEntity[];
    getCookieItems(domain:string,path:string):cookieEntity[]
    addCookie(url:string,cookieOrigin:string):boolean;
    removeCookie(item:cookieEntity);
}

class cookieEntity{
    domain:string;
    path:string;
    expires:Date;
    secure:boolean;//只有 https 才发送这个 cookie
    httponly:boolean;//没有用
    name:string;
    value:string;
}
      
/**
 * Cookie 管理类
 * 1.不支持使用转义字符(例如:";" "=")
 * 2.暂时不能存储到本地
 * @class GZCookieManager
 * @implements {IGZCookieStorage}
 */
export class GZCookieManager implements IGZCookieStorage{
    public static instance = null;    
    protected cookieStorage:cookieEntity[];
    private defaultCookieLife = 24 * 60 * 60 * 1000;//默认 cookie 有效期 1天
    
    public static newInstance():GZCookieManager{
        if(GZCookieManager.instance == null){
            GZCookieManager.instance = new GZCookieManager();
        }
        return GZCookieManager.instance;
    }
    private constructor(){
        this.cookieStorage = new Array();
    };
    
    /**
     * 获取匹配当前 url 的 cookies
     * 
     * @param {string} url 完整的网络请求
     * @returns {cookieEntity[]} 有效的 cookies
     * @memberof GZCookieStorage
     */
    public getCookieItemsWithURL(url:string):cookieEntity[]{
        let suitableItem:cookieEntity[] = new Array();
        try {
            let requestURL = new GZURL(url);
        } catch (error) {
            let requestURL = new GZURL(url);
        }
        
        suitableItem = this.getCookieItems(requestURL.host,requestURL.pathname,requestURL.protocol);


        

        return suitableItem;
    };

    
    /**
     * 获取匹配当前 url 的 cookies,拼接成字符串
     * 
     * @type {(url:string)} url 完整的网络请求
     * @returns {string} 拼接后的 cookie
     * @memberof GZCookieStorage 
     */
    public getCookieItemsStringWithURL(url:string):string{
        let suitableItems:cookieEntity[] = new Array();
        suitableItems = this.getCookieItemsWithURL(url);
        let cookieStr:string = '';
        for (var item in suitableItems) {
            if (suitableItems.hasOwnProperty(item)) {
                var element = suitableItems[item];
                cookieStr = cookieStr + element.name + '=' + element.value;
                cookieStr = cookieStr + ';';
            }
        }
        if (cookieStr.lastIndexOf(';') > -1 && cookieStr.lastIndexOf(';') == cookieStr.length - 1) {
            cookieStr = cookieStr.substr(0,cookieStr.length - 1);
        }
        return cookieStr;
    };

    public getCookieItems(domain:string,path:string,protocol?:string):cookieEntity[]{
        let suitableItem:cookieEntity[] = new Array();
        if (protocol == null || protocol == undefined) {
            protocol = 'http';
        }
        for (var item in this.cookieStorage) {
            if (this.cookieStorage.hasOwnProperty(item)) {
                var cookieItem = this.cookieStorage[item];
                let isSuit = false;
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
                    }else{
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


    /**
     * 添加 cookie 到 cookie 存储
     * @param {string} url 当前网络请求的 url 
     * @param {string} cookieOrigin cookie 原始数据,从 header 的 Set-Cookie 读取
     * @returns {boolean}  true 添加 cookie 成功
     * @memberof GZCookieStorage
     */
    public addCookie(url:string,cookieOrigin:string):boolean{
        try {
            let requestURL = new GZURL(url);
            
        } catch (error) {
            let requestURL = new webkitURL(url);
            
        }
        let cookieItem:cookieEntity = new cookieEntity();
        let cookieStrs = cookieOrigin.split(';');
        if (cookieStrs.length > 0) {
            let cookiemessage:string = cookieStrs[0];
            let cookieInfo:string[] = cookiemessage.split('=');
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
                let domainStr = element.split('=');
                cookieItem.domain = domainStr[1];
            }
            if (element.toLocaleLowerCase().indexOf('path') > -1) {
                let domainStr = element.split('=');
                cookieItem.path = domainStr[1];
            }
            if (element.toLocaleLowerCase().indexOf('expires') > -1) {
                let domainStr = element.split('=');
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
            this.cookieStorage[cookieItem.name+cookieItem.path+cookieItem.domain+cookieItem.secure+cookieItem.httponly] = cookieItem;
            return true;
        }
        return false;
    };
    public removeCookie(item:cookieEntity){
        this.cookieStorage.splice(this.cookieStorage.indexOf(item),1);
    };

    /**
     * 验证 cookie 有效性
     * @param {string} domain domain
     * @param {string} path path
     * @param {cookieEntity} item 需要验证的 cookie
     * @returns {boolean} true cookie 适用于 domain+path
     * @memberof GZCookieStorage
     */
    protected validCookie(domain:string,path:string,item:cookieEntity):boolean{
        let result:boolean = false;
        if(item.domain.indexOf(domain))

        return false;
    }
}




interface gzRequestParam extends WeApp.RequestParam{
    
}

interface gzNetworkInterface{
    request(param:WeApp.RequestParam):WeApp.RequestTask;
}

class GZNetwork implements gzNetworkInterface{
    public request(param:gzRequestParam){
        let detorator:GZNetworkDetorator = new GZNetworkDetorator();
        return detorator.request(param);
    }
}

export let gzNetwork:GZNetwork = new GZNetwork();

class GZNetworkDetorator implements gzNetworkInterface{
    protected requestParam:gzRequestParam;
    public request(param:gzRequestParam){
        this.requestParam = param;
        let cookieManager:GZCookieManager = GZCookieManager.newInstance();
        let cookieStr:string = cookieManager.getCookieItemsStringWithURL(param.url);
        if (param.header == null) {
            param.header = new Object();
        }
        param.header['Cookie'] = cookieStr;


        let that = this;
        return wx.request({
            url:this.requestParam.url,
            data:this.requestParam.data,
            header:this.requestParam.header,
            method:this.requestParam.method,
            dataType:this.requestParam.dataType,
            success:function(res){
                that.gzSuccess(res);
            },
            fail:function(res){
                that.gzFail(res);
            },
            complete:function(res){
                that.gzComplete(res);
            }
        });
    }

    protected gzSuccess(res?:WeApp.HttpResponse):void{
        if (this.requestParam != null) {
            //解析 Cookie
            let cookieManager:GZCookieManager = GZCookieManager.newInstance();
            let responseHeader = res.header;
            for (var key in responseHeader) {
                if (responseHeader.hasOwnProperty(key)) {
                    var element = responseHeader[key];
                    if (key.toLocaleLowerCase().indexOf('set-cookie') > -1) {
                        cookieManager.addCookie(this.requestParam.url,element);
                    }
                }
            }
            if (this.requestParam.success != null) {
                this.requestParam.success(res);                
            }
        }
    }

    protected gzFail(res?:WeApp.HttpResponse):void{
        if (this.requestParam != null) {
            //解析 Cookie
            let cookieManager:GZCookieManager = GZCookieManager.newInstance();
            let responseHeader = res.header;
            for (var key in responseHeader) {
                if (responseHeader.hasOwnProperty(key)) {
                    var element = responseHeader[key];
                    if (key.toLocaleLowerCase().indexOf('set-cookie') > -1) {
                        cookieManager.addCookie(this.requestParam.url,element);
                    }
                }
            }
            if (this.requestParam.fail != null) {
                this.requestParam.fail(res);   
            }
            
        }
    }

    protected gzComplete(res?:WeApp.HttpResponse):void{
        if (this.requestParam != null) {
            //解析 Cookie
            let cookieManager:GZCookieManager = GZCookieManager.newInstance();
            let responseHeader = res.header;
            for (var key in responseHeader) {
                if (responseHeader.hasOwnProperty(key)) {
                    var element = responseHeader[key];
                    if (key.toLocaleLowerCase().indexOf('set-cookie') > -1) {
                        cookieManager.addCookie(this.requestParam.url,element);
                    }
                }
            }
            if (this.requestParam.complete != null) {
                this.requestParam.complete(res);                
            }
        }
    }
}



// class GZURL implements URL{
class GZURL{
    protected urlStr:string;
    protected url:any;
    constructor(url:string){
        this.urlStr = url;
        this.url = URL(this.urlStr);
    }

    // protected _hash:string = '';
    // get hash(){
    //     // this._hash = this.url.hash();
    //     return this._hash;
    // }
    protected _host:string = '';
    get host(){
        this._host = this.url.attr('host') +':' +this.url.attr('port');
        return this._host;
    }
    protected _hostname:string = '';
    get hostname(){
        this._hostname = this.url.attr('host')
        return this._hostname;
    }
    // protected _href:string = '';
    // get href(){
    //     // this._href = this.url.href();
    //     return this._href;
    // }
    protected _origin:string = '';
    get origin(){
        this._origin = this.urlStr;
        return this._origin;
    }
    // protected _password = '';
    // get password(){
    //     // this._password = this.url.password();
    //     return this._password;
    // }
    protected _pathname:string = '';
    get pathname(){
        this._pathname = this.url.attr('directory');
        return this._pathname;
    }
    protected _port:string = '';
    get port(){
        this._port = this.url.attr('port');
        return this._port;
    }
    protected _protocol:string = '';
    get protocol(){
        this._protocol = this.url.attr('protocol');
        return this._protocol;
    }
    // protected _search:string = '';
    // get search(){
    //     // this._search = this.url.search()
    //     return this._search;
    // }
    // protected _username:string = '';
    // get username(){
    //     // this._username = this.url.username()
    //     return this._username;
    // }

    // public searchParams:any = new Object();
}