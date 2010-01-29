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
    
    var logXHR = function() 
    {
        var panel = Firebug.chrome.getPanel("Console");
        var container = panel.panelNode;
        
        var row = Firebug.chrome.document.createElement("div");
        row.className = "logRow logRow-spy loading";
        
        spy.logRow = row;
        
        Firebug.Spy.XHR.tag.append({object: spy}, row);
        
        setTimeout(function(){
            container.appendChild(row);
        },0);
    };
    
    var handleStateChange = function()
    {
        //Firebug.Console.log("onreadystatechange");
        
        self.readyState = xhrRequest.readyState;
        
        if (xhrRequest.readyState == 4)
        {
            var duration = new Date().getTime() - reqStartTS;
            var success = xhrRequest.status == 200;
            
            var responseHeadersText = xhrRequest.getAllResponseHeaders();
            var responses = responseHeadersText.split(/[\n\r]/);
            var reHeader = /^(\S+):\s*(.*)/;
            
            for (var i=0, l=responses.length; i<l; i++)
            {
                var text = responses[i];
                var match = text.match(reHeader);
                
                if (match)
                {
                    spy.responseHeaders.push({
                       name: [match[1]],
                       value: [match[2]]
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
                
                    // TODO: xxxpedro xhr - need to check if the chrome document is loaded here
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
            spy.responseText = xhrRequest.responseText;
            
            self.status = xhrRequest.status;
            self.statusText = xhrRequest.statusText;
            self.responseText = xhrRequest.responseText;
            self.responseXML = xhrRequest.responseXML;
            
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
    
    this.open = function(method, url, async)
    {
        //Firebug.Console.log("xhrRequest open");
        
        if (spy.loaded)
            spy = new XHRSpy();
        
        spy.method = method;
        spy.url = url;
        spy.async = async;
        spy.href = url;
        spy.xhrRequest = xhrRequest;
        
        if (!FBL.isIE && async)
            xhrRequest.onreadystatechange = handleStateChange;
        
        xhrRequest.open(method, url, async);
        
        if (FBL.isIE && async)
            xhrRequest.onreadystatechange = handleStateChange;
        
        if (!async)
        {
            Firebug.Console.log("handle sync");
        }
    };
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    this.send = function(data)
    {
        //Firebug.Console.log("xhrRequest send");
        
        logXHR();
        
        reqStartTS = new Date().getTime();
        
        xhrRequest.send(data);
    };
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    this.setRequestHeader = function(header, value)
    {
        spy.requestHeaders.push({name: [header], value: [value]});
        xhrRequest.setRequestHeader(header, value);
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
