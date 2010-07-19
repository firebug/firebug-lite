/* See license.txt for terms of usage */

(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// XHRSpy
    
var XHRSpy = function()
{
    this.requestHeaders = [];
    this.responseHeaders = [];
};

XHRSpy.prototype = 
{
    method: null,
    url: null,
    async: null,
    
    xhrRequest: null,
    
    href: null,
    
    loaded: false,
    
    logRow: null,
    
    responseText: null,
    
    requestHeaders: null,
    responseHeaders: null,
    
    sourceLink: null, // {href:"file.html", line: 22}
    
    getURL: function()
    {
        return this.href;
    }
};

// ************************************************************************************************
// XMLHttpRequestWrapper

var XMLHttpRequestWrapper = function(activeXObject)
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // XMLHttpRequestWrapper internal variables
    
    var xhrRequest = typeof activeXObject != "undefined" ?
                activeXObject :
                new _XMLHttpRequest(),
        
        spy = new XHRSpy(),
        
        self = this,
        
        reqType,
        reqUrl,
        reqStartTS;

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // XMLHttpRequestWrapper internal methods
    
    var updateSelfProperties = function()
    {
        var self = self;
        
        for (var propName in xhrRequest)
        {
            try
            {
                var propValue = xhrRequest[propName];
                
                if (!isFunction(propValue))
                    self[propName] = propValue;
            }
            catch(E)
            {
                //console.log(propName, E.message);
            }
        }
    };
    
    var updateXHRProperties = function()
    {
        var self = self;
        
        for (var propName in self)
        {
            try
            {
                var propValue = self[propName];
                
                if (!xhrRequest[propName])
                {
                    xhrRequest[propName] = propValue;
                }
            }
            catch(E)
            {
                //console.log(propName, E.message);
            }
        }
    };
    
    var logXHR = function() 
    {
        var row = Firebug.Console.log(spy, null, "spy", Firebug.Spy.XHR);
        
        if (row)
        {
            setClass(row, "loading");
            spy.logRow = row;
        }
    };
    
    var finishXHR = function() 
    {
        var duration = new Date().getTime() - reqStartTS;
        var success = xhrRequest.status == 200;
        
        var responseHeadersText = xhrRequest.getAllResponseHeaders();
        var responses = responseHeadersText ? responseHeadersText.split(/[\n\r]/) : [];
        var reHeader = /^(\S+):\s*(.*)/;
        
        for (var i=0, l=responses.length; i<l; i++)
        {
            var text = responses[i];
            var match = text.match(reHeader);
            
            if (match)
            {
                var name = match[1];
                var value = match[2];
                
                // update the spy mimeType property so we can detect when to show 
                // custom response viewers (such as HTML, XML or JSON viewer)
                if (name == "Content-Type")
                    spy.mimeType = value;
                
                /*
                if (name == "Last Modified")
                {
                    if (!spy.cacheEntry)
                        spy.cacheEntry = [];
                    
                    spy.cacheEntry.push({
                       name: [name],
                       value: [value]
                    });
                }
                /**/
                
                spy.responseHeaders.push({
                   name: [name],
                   value: [value]
                });
            }
        }
            
        with({
            row: spy.logRow, 
            status: xhrRequest.status + " " + xhrRequest.statusText, 
            time: duration,
            success: success
        })
        {
            setTimeout(function(){
                
                spy.responseText = xhrRequest.responseText;
                
                // update row information to avoid "ethernal spinning gif" bug in IE 
                row = row || spy.logRow;
                
                // if chrome document is not loaded, there will be no row yet, so just ignore
                if (!row) return;
                
                FBL.removeClass(row, "loading");
                
                if (!success)
                    FBL.setClass(row, "error");
                
                var item = FBL.$$(".spyStatus", row)[0];
                item.innerHTML = status;
                
                var item = FBL.$$(".spyTime", row)[0];
                item.innerHTML = time + "ms";
                
            },200);
        }
        
        spy.loaded = true;
        
        self.status = xhrRequest.status;
        self.statusText = xhrRequest.statusText;
        self.responseText = xhrRequest.responseText;
        self.responseXML = xhrRequest.responseXML;
        
        updateSelfProperties();
    };
    
    var handleStateChange = function()
    {
        //Firebug.Console.log("onreadystatechange");
        
        self.readyState = xhrRequest.readyState;
        
        if (xhrRequest.readyState == 4)
        {
            finishXHR();
            
            xhrRequest.onreadystatechange = function(){};
        }
        
        //Firebug.Console.log(spy.url + ": " + xhrRequest.readyState);
        
        self.onreadystatechange();
    };
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // XMLHttpRequestWrapper public properties and handlers
    
    this.readyState = 0;
    
    this.onreadystatechange = function(){};
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // XMLHttpRequestWrapper public methods
    
    this.open = function(method, url, async, user, password)
    {
        //Firebug.Console.log("xhrRequest open");
        
        updateSelfProperties();
        
        if (spy.loaded)
            spy = new XHRSpy();
        
        spy.method = method;
        spy.url = url;
        spy.async = async;
        spy.href = url;
        spy.xhrRequest = xhrRequest;
        spy.urlParams = parseURLParamsArray(url);
        
        if (!FBL.isIE && async)
            xhrRequest.onreadystatechange = handleStateChange;
        
        // xhr.open.apply not available in IE
        if (typeof xhrRequest.open.apply != "undefined")
            xhrRequest.open.apply(xhrRequest, arguments)
        else
            xhrRequest.open(method, url, async, user, password);
        
        if (FBL.isIE && async)
            xhrRequest.onreadystatechange = handleStateChange;
        
    };
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    this.send = function(data)
    {
        //Firebug.Console.log("xhrRequest send");
        
        spy.data = data;
        
        reqStartTS = new Date().getTime();
        
        updateXHRProperties();
        
        try
        {
            xhrRequest.send(data);
        }
        catch(e)
        {
            throw e;
        }
        finally
        {
            logXHR();
            
            if (!spy.async)
            {
                self.readyState = xhrRequest.readyState;
                
                finishXHR();
            }
        }
    };
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    this.setRequestHeader = function(header, value)
    {
        spy.requestHeaders.push({name: [header], value: [value]});
        return xhrRequest.setRequestHeader(header, value);
    };
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    this.getResponseHeader = function(header)
    {
        return xhrRequest.getResponseHeader(header);
    };
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    this.getAllResponseHeaders = function()
    {
        return xhrRequest.getAllResponseHeaders();
    };
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    this.abort = function()
    {
        return xhrRequest.abort();
    };
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Clone XHR object

    var supportsApply = xhrRequest && 
            xhrRequest.open && 
            typeof xhrRequest.open.apply != "undefined";
    
    for (var propName in xhrRequest)
    {
        if (propName == "onreadystatechange")
            continue;
        
        try
        {
            var propValue = xhrRequest[propName];
            
            if (isFunction(propValue))
            {
                if (typeof self[propName] == "undefined")
                {
                    this[propName] = supportsApply ?
                        // if the browser supports apply 
                        function()
                        {
                            return xhrRequest[propName].apply(xhrRequest, arguments)
                        }
                        :
                        function(a,b,c,d,e)
                        {
                            return xhrRequest[propName](a,b,c,d,e)
                        };
                } 
            }
            else
                this[propName] = propValue;
        }
        catch(E)
        {
            //console.log(propName, E.message);
        }
    }
    /**/
    
    return this;
};

// ************************************************************************************************
// ActiveXObject Wrapper (IE6 only)

var _ActiveXObject;
var isIE6 =  /msie 6/i.test(navigator.appVersion);

if (isIE6)
{
    window._ActiveXObject = window.ActiveXObject;
    
    var xhrObjects = " MSXML2.XMLHTTP.5.0 MSXML2.XMLHTTP.4.0 MSXML2.XMLHTTP.3.0 MSXML2.XMLHTTP Microsoft.XMLHTTP ";
    
    window.ActiveXObject = function(name)
    {
        var error = null;
        
        try
        {
            var activeXObject = new window._ActiveXObject(name);
        }
        catch(e)
        {
            error = e;
        }
        finally
        {
            if (!error)
            {
                if (xhrObjects.indexOf(" " + name + " ") != -1)
                    return new XMLHttpRequestWrapper(activeXObject);
                else
                    return activeXObject;
            }
            else
                throw error.message;
        }
    };
}

// ************************************************************************************************

// Register the XMLHttpRequestWrapper for non-IE6 browsers
if (!isIE6)
{
    var _XMLHttpRequest = XMLHttpRequest;
    window.XMLHttpRequest = function()
    {
        return new XMLHttpRequestWrapper();
    }
}

// ************************************************************************************************
}})();
