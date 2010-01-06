/* See license.txt for terms of usage */

(function() { with (FBL) {
// ************************************************************************************************

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

var XMLHttpRequestWrapper = function(activeXObject)
{
    var self = this,
        xhrRequest = typeof activeXObject != "undefined" ?
                activeXObject :
                new _XMLHttpRequest(),
        
        spy = new XHRSpy(),
        
        reqType, 
        reqUrl,
        reqStartTS;
    
    
    this.readyState = 0;
    
    this.onreadystatechange = function(){};
    
    var handleStateChange = function()
    {
        //Firebug.Console.log("onreadystatechange");
        
        self.readyState = xhrRequest.readyState;
        
        if (xhrRequest.readyState == 4)
        {
            var duration = new Date().getTime() - reqStartTS;
            var success = xhrRequest.status == 200;
            
            spy.loaded = true;
            spy.responseText = xhrRequest.responseText;
            
            var responseHeadersText = xhrRequest.getAllResponseHeaders();
            
            //Firebug.Console.log(responseHeadersText);
            
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
                
                    FBL.removeClass(row, "loading");
                    
                    if (!success)
                        FBL.setClass(row, "error");
                    
                    var item = FBL.$$(".spyStatus", row)[0];
                    item.innerHTML = status;
                    
                    var item = FBL.$$(".spyTime", row)[0];
                    item.innerHTML = time + "ms";
                    
                },200);
            }
            
            self.statusText = xhrRequest.statusText;
            self.responseText = xhrRequest.responseText;
            self.responseXML = xhrRequest.responseXML;
            self.status = xhrRequest.status;
            
            xhrRequest.onreadystatechange = function(){};
        }
        
        //Firebug.Console.log(spy.url + ": " + xhrRequest.readyState);
        self.onreadystatechange();
    };
    
    var appendRep = function() 
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
        
        //Firebug.Console.log("xhrRequest BEFORE open");
        xhrRequest.open(method, url, async);
        //Firebug.Console.log("xhrRequest AFTER open");
        
        //Firebug.Console.log("xhrRequest BEFORE onreadystatechange SET");
        if (FBL.isIE && async)
            xhrRequest.onreadystatechange = handleStateChange;
        //Firebug.Console.log("xhrRequest AFTER onreadystatechange SET");
        
        if (!async)
        {
            Firebug.Console.log("handle sync");
        }
    };
    
    this.send = function(data)
    {
        //Firebug.Console.log("xhrRequest send");
        
        //Firebug.Console.log("xhrRequest send BEFORE appendRep");
        appendRep();
        //Firebug.Console.log("xhrRequest send AFTER appendRep");
        
        
        //Firebug.Console.log("xhrRequest send BEFORE send");
        reqStartTS = new Date().getTime();
        xhrRequest.send(data);
        //Firebug.Console.log("xhrRequest send AFTER send");
    };
    
    this.setRequestHeader = function(header, value)
    {
        spy.requestHeaders.push({name: [header], value: [value]});
        xhrRequest.setRequestHeader(header, value);
    };
    
    return this;
};

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
