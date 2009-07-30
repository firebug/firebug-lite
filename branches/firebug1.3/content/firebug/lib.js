/*!
 *  Copyright 2009, Firebug Working Group
 *  Released under BSD license.
 *  More information: http://getfirebug.com/lite.html
 */

var FBL = {};

(function() {
// ************************************************************************************************

// ************************************************************************************************
// Namespaces

var namespaces = [];
var FBTrace = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

this.ns = function(fn)
{
    var ns = {};
    namespaces.push(fn, ns);
    return ns;
};

this.initialize = function()
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    // initialize application
    
    FBTrace = FBL.FBTrace;
    if (FBL.Application.isDebugMode) FBTrace.initialize();
    
    var isChromeContext = FBL.Application.isPersistentMode && 
            typeof window.FirebugApplication == "object"; 
    
    if (isChromeContext) // persistent application
    {
        FBL.Application = window.FirebugApplication;
        FBL.Application.isChromeContext = true;
        FBL.FirebugChrome = FBL.Application.FirebugChrome;
    }
    else // non-persistent application
    {
        // TODO: get preferences here...
        FBL.Application.browser = window;
        FBL.Application.destroy = destroyApplication;
    }    
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    // initialize namespaces

    if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("FBL.initialize", namespaces.length/2+" namespaces BEGIN");
    
    for (var i = 0; i < namespaces.length; i += 2)
    {
        var fn = namespaces[i];
        var ns = namespaces[i+1];
        fn.apply(ns);
    }
    
    if (FBTrace.DBG_INITIALIZE) {
        FBTrace.sysout("FBL.initialize", namespaces.length/2+" namespaces END");
        FBTrace.sysout("FBL waitForDocument", "waiting document load");
    }
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    
    if (!isChromeContext)
    {
        FBL.Application.FirebugChrome = FBL.FirebugChrome;
    }
    
    waitForDocument();
};

var waitForDocument = function waitForDocument()
{
    if (document.body)
    {
        onDocumentLoad();
    }
    else
        setTimeout(waitForDocument, 50);
};

var onDocumentLoad = function onDocumentLoad()
{
    if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("FBL onDocumentLoad", "create application chrome");
    
    if (FBL.isIE6)
        fixIE6BackgroundImageCache();
        
    // persistent application - chrome document loaded
    if (FBL.Application.isPersistentMode && FBL.Application.isChromeContext)
    {
        FBL.Firebug.initialize();
        
        window.FirebugApplication.destroy();
        
        if (FBL.isIE)
            window.FirebugApplication = null;
        else
            delete window.FirebugApplication;
    }
    // main document loaded
    else
    {
        findLocation();
        
        FBL.FirebugChrome.create();
    }    
};

// ************************************************************************************************
// Application

this.Application = {
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    // Application preferences
    openAtStartup: true,
    
    isBookmarletMode: true,
    isPersistentMode: false,
    isDebugMode: true,
    skin: "xp",
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    // Application states
    isDevelopmentMode: false,
    isChromeContext: false,
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    // Application references
    browser: null,
    chrome: null
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var destroyApplication = function destroyApplication()
{
    setTimeout(function()
    {
        FBL = null;
    }, 100);
};

// ************************************************************************************************
// Library location

this.Application.location = {
    source: null,
    base: null,
    skin: null,
    app: null
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var findLocation =  function findLocation() 
{
    var reFirebugFile = /(firebug(?:\.\w+)?\.js(?:\.gz)?)(#.+)?$/;
    var rePath = /^(.*\/)/;
    var reProtocol = /^\w+:\/\//;
    //var head = document.getElementsByTagName("head")[0];
    var path = null;
    
    //for(var i=0, c=head.childNodes, ci; ci=c[i]; i++)
    for(var i=0, c=document.getElementsByTagName("script"), ci; ci=c[i]; i++)
    {
        var file = null;
        
        if ( ci.nodeName.toLowerCase() == "script" && 
             (file = reFirebugFile.exec(ci.src)) )
        {
            var fileName = file[1];
            var fileOptions = file[2];
            
            
            if (reProtocol.test(ci.src)) {
                // absolute path
                path = rePath.exec(ci.src)[1];
              
            }
            else
            {
                // relative path
                var r = rePath.exec(ci.src);
                var src = r ? r[1] : ci.src;
                var rel = /^((?:\.\.\/)+)(.*)/.exec(src);
                var lastFolder = /^(.*\/)[^\/]+\/$/;
                path = rePath.exec(location.href)[1];
                
                if (rel)
                {
                    var j = rel[1].length/3;
                    var p;
                    while (j-- > 0)
                        path = lastFolder.exec(path)[1];

                    path += rel[2];
                }
            }
            
            break;
        }
    }
    
    var m = path && path.match(/([^\/]+)\/$/) || null;
    
    if (path && m)
    {
        var loc = FBL.Application.location; 
        loc.source = path;
        loc.base = path.substr(0, path.length - m[1].length - 1);
        loc.skin = loc.base + "skin/" + FBL.Application.skin + "/firebug.html";
        loc.app = path + fileName;
        
        if (fileName == "firebug.dev.js")
            FBL.Application.isDevelopmentMode = true;

        if (fileOptions)
        {
            // TODO:
        }        
    }
    else
    {
        throw new Error("Firebug Error: Library path not found");
    }
};

// ************************************************************************************************
// Basics

this.extend = function(l, r)
{
    var newOb = {};
    for (var n in l)
        newOb[n] = l[n];
    for (var n in r)
        newOb[n] = r[n];
    return newOb;    
};


this.append = function(l, r)
{
    for (var n in r)
        l[n] = r[n];
        
    return l;
};


// ************************************************************************************************
// Browser detection

var userAgent = navigator.userAgent;

this.isFirefox = userAgent.indexOf("Firefox") != -1;
this.isIE      = userAgent.indexOf("MSIE") != -1;
this.isOpera   = userAgent.indexOf("Opera") != -1;
this.isSafari  = userAgent.indexOf("AppleWebKit") != -1;
this.isIE6     = /msie 6/i.test(navigator.appVersion);
this.isIEQuiksMode = document.all ? document.compatMode == "BackCompat" : false;
this.isIEStantandMode = document.all ? document.compatMode == "CSS1Compat" : false;

// ************************************************************************************************
// Util

var HTMLtoEntity =
{
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&#39;",
    '"': "&quot;"
};

function replaceChars(ch)
{
    return HTMLtoEntity[ch];
};

this.escapeHTML = function(value)
{
    return (value+"").replace(/[<>&"']/g, replaceChars);
};

var reTrim = /^\s+|\s+$/g;
this.trim = function(s)
{
    return s.replace(reTrim, "");
};

// ************************************************************************************************
// Empty

this.emptyFn = function(){};



// ************************************************************************************************
// DOM

this.$ = function(id, doc)
{
    if (doc)
        return doc.getElementById(id);
    else
    {
        return FBL.Firebug.chrome.document.getElementById(id);
    }
};

this.$$ = function(selector, doc)
{
    if (doc || !FBL.Firebug.chrome)
        return FBL.Firebug.Selector(selector, doc);
    else
    {
        return FBL.Firebug.Selector(selector, FBL.Firebug.chrome.document)
    }
};

this.createElement = function(tagName, properties)
{
    properties = properties || {};
    var doc = properties.document || FBL.Firebug.chrome.document;
    
    var element = doc.createElement(tagName);
    
    for(var name in properties)
    {
        if (name != "document")
        {
            element[name] = properties[name];
        }
    }
    
    return element;
};

// ************************************************************************************************
// Event

this.bind = function(object, fn)
{
    return function(){return fn.apply(object, arguments);};
};

this.addEvent = function(object, name, handler)
{
    if (document.all)
        object.attachEvent("on"+name, handler);
    else
        object.addEventListener(name, handler, false);
};

this.removeEvent = function(object, name, handler)
{
    if (document.all)
        object.detachEvent("on"+name, handler);
    else
        object.removeEventListener(name, handler, false);
};

this.cancelEvent = function(e, preventDefault)
{
    if (!e) return;
    
    if (preventDefault)
    {
                if (e.preventDefault)
                    e.preventDefault();
                else
                    e.returnValue = false;
    }
    
    if (document.all)
        e.cancelBubble = true;
    else
        e.stopPropagation();
                
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

this.addGlobalEvent = function(name, handler)
{
    var doc = FBL.Firebug.browser.document;
    var frames = FBL.Firebug.browser.window.frames;
    
    FBL.addEvent(doc, name, handler);
    
    if (FBL.Firebug.chrome.type == "popup")
        FBL.addEvent(FBL.Firebug.chrome.document, name, handler);
  
    for (var i = 0, frame; frame = frames[i]; i++)
    {
        try
        {
            FBL.addEvent(frame.document, name, handler);
        }
        catch(E)
        {
            // Avoid acess denied
        }
    }
};

this.removeGlobalEvent = function(name, handler)
{
    var doc = FBL.Firebug.browser.document;
    var frames = FBL.Firebug.browser.window.frames;
    
    FBL.removeEvent(doc, name, handler);
    
    if (FBL.Firebug.chrome.type == "popup")
        FBL.removeEvent(FBL.Firebug.chrome.document, name, handler);
  
    for (var i = 0, frame; frame = frames[i]; i++)
    {
        try
        {
            FBL.removeEvent(frame.document, name, handler);
        }
        catch(E)
        {
            // Avoid acess denied
        }
    }
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

this.dispatch = function(listeners, name, args)
{
    try
    {
        if (typeof listeners.length != "undefined")
        {
            if (FBTrace.DBG_DISPATCH) FBTrace.sysout("FBL.dispatch", name+" to "+listeners.length+" listeners");
    
            for (var i = 0; i < listeners.length; ++i)
            {
                var listener = listeners[i];
                if ( listener.hasOwnProperty(name) )
                    listener[name].apply(listener, args);
            }
        }
        else
        {
            if (FBTrace.DBG_DISPATCH) FBTrace.sysout("FBL.dispatch", name+" to listeners of an object");
            
            for (var prop in listeners)
            {
                var listener = listeners[prop];
                if ( listeners.hasOwnProperty(prop) && listener.hasOwnProperty(name) )
                    listener[name].apply(listener, args);
            }
        }
    }
    catch (exc)
    {
        /*
        if (FBTrace.DBG_ERRORS)
        {
            FBTrace.dumpProperties(" Exception in lib.dispatch "+ name, exc);
            //FBTrace.dumpProperties(" Exception in lib.dispatch listener", listener);
        }
        /**/
    }
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

this.disableTextSelection = function(e)
{
    if (typeof e.onselectstart != "undefined") // IE
        e.onselectstart = function(){ return false };
        
    else // others
        e.onmousedown = function(){ return false };
    
    e.style.cursor = "default";
};

// ************************************************************************************************
// class Names

this.hasClass = function(object, name)
{
    return (' '+object.className+' ').indexOf(' '+name+' ') != -1;
};

this.addClass = function(object, name)
{
    if ((' '+object.className+' ').indexOf(' '+name+' ') == -1)
        object.className = object.className ? object.className + ' ' + name : name; 
};

this.removeClass = function(object, name)
{
    object.className = (' ' + object.className + ' ').
        replace(new RegExp('(\\S*)\\s+'+name+'\\s+(\\S*)', 'g'), '$1 $2').
        replace(/^\s*|\s*$/g, '');
};

this.toggleClass = function(object, name)
{
    if ((' '+object.className+' ').indexOf(' '+name+' ') >= 0)
        this.removeClass(object, name)
    else
        this.addClass(object, name);
};

// ************************************************************************************************

this.objectToString = function(object)
{
    try
    {
        return object+"";
    }
    catch (exc)
    {
        return null;
    }
};

// ************************************************************************************************
// Opera Tab Fix

function onOperaTabBlur(e)
{
    if (this.lastKey == 9)
      this.focus();
};

function onOperaTabKeyDown(e)
{
  this.lastKey = e.keyCode;
};

function onOperaTabFocus(e)
{
    this.lastKey = null;
};

this.fixOperaTabKey = function(el)
{
    el.onfocus = onOperaTabFocus;
    el.onblur = onOperaTabBlur;
    el.onkeydown = onOperaTabKeyDown;
};


// ************************************************************************************************
// Ajax

this.Ajax =
{
  
    requests: [],
    transport: null,
    states: ["Uninitialized","Loading","Loaded","Interactive","Complete"],
  
    initialize: function()
    {
        this.transport = this.getXHRObject();
    },
    
    getXHRObject: function()
    {
        var xhrObj = false;
        try
        {
            xhrObj = new XMLHttpRequest();
        }
        catch(e)
        {
            var progid = [
                    "MSXML2.XMLHTTP.5.0", "MSXML2.XMLHTTP.4.0", 
                    "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"
                ];
              
            for ( var i=0; i < progid.length; ++i ) {
                try
                {
                    xhrObj = new ActiveXObject(progid[i]);
                }
                catch(e)
                {
                    continue;
                }
                break;
            }
        }
        finally
        {
            return xhrObj;
        }
    },
    
    
    /**
     * Realiza uma requisição ajax.
     * 
     * @name request
     * @param {Object}   options               Request options
     * @param {String}   options.url           URL to be requested
     * @param {String}   options.type          Request type ("get" ou "post"). Default is "get".
     * @param {Boolean}  options.async         Indica se a requisição é assíncrona. O padrão é "true".   
     * @param {String}   options.dataType      Dado requisitado ("text", "html", "xml" ou "json"). O padrão é "text".
     * @param {String}   options.contentType   ContentType a ser usado. O padrão é "application/x-www-form-urlencoded".  
     * @param {Function} options.onLoading     Função a ser executada antes da requisição ser enviada.
     * @param {Function} options.onLoaded      Função a ser executada logo que a requisição for enviada.
     * @param {Function} options.onInteractive Função a ser executada durante o recebimento da requisição.
     * @param {Function} options.onComplete    Função a ser executada ao completar a requisição.
     * @param {Function} options.onUpdate      Função a ser executada após completar a requisição.
     * @param {Function} options.onSuccess     Função a ser executada ao completar a requisição com sucesso.
     * @param {Function} options.onError       Função a ser executada ao completar a requisição com erro.
     */      
    request: function(options)
    {
        var o = options || {};
    
        // Configura as opções que não foram definidas para o seu valor padrão
        o.type = o.type && o.type.toLowerCase() || "get";
        o.async = o.async || true;
        o.dataType = o.dataType || "text"; 
        o.contentType = o.contentType || "application/x-www-form-urlencoded";
    
        this.requests.push(o);
    
        var s = this.getState();
        if (s == "Uninitialized" || s == "Complete") 
            this.sendRequest();
    },
    
    serialize: function(data)
    {
        var r = [""], rl = 0;
        if (data) {
            if (typeof data == "string")  r[rl++] = data
              
            else if (data.innerHTML && data.elements) {
                for (var i=0,el,l=(el=data.elements).length; i < l; i++)
                    if (el[i].name) {
                        r[rl++] = encodeURIComponent(el[i].name); 
                        r[rl++] = "=";
                        r[rl++] = encodeURIComponent(el[i].value);
                        r[rl++] = "&";
                    }
                    
            } else 
                for(param in data) {
                    r[rl++] = encodeURIComponent(param); 
                    r[rl++] = "=";
                    r[rl++] = encodeURIComponent(data[param]);
                    r[rl++] = "&";
                }
        }
        return r.join("").replace(/&$/, "");
    },
  
    sendRequest: function()
    {
        var t = FBL.Ajax.transport, r = FBL.Ajax.requests.shift(), data;
    
        // Abre o objeto XMLHttpRequest
        t.open(r.type, r.url, r.async);
    
        //setRequestHeaders();
    
        // Registra o objeto para que o servidor saiba que é uma requisição AJAX
        t.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    
        // Caso tenha sido informado algum dado
        if (data = FBL.Ajax.serialize(r.data))
          t.setRequestHeader("Content-Type", r.contentType);
    
        /** @ignore */
        // Tratamento de evento de mudança de estado
        t.onreadystatechange = function()
        { 
            FBL.Ajax.onStateChange(r); 
        }; 
    
        // Envia a requisição
        t.send(data);
    },
  
    /**
     * Função de tratamento da mudança de estado da requisição ajax.
     */     
    onStateChange: function(options)
    {
        var fn, o = options, t = this.transport;
        var state = this.getState(t); 
    
        if (fn = o["on" + state]) fn(this.getResponse(o), o);
    
        if (state == "Complete")
        {
            var success = t.status == 200, response = this.getResponse(o);
      
            if (fn = o["onUpdate"])
              fn(response, o);
      
            if (fn = o["on" + (success ? "Success" : "Failure")])
              fn(response, o);
      
            t.onreadystatechange = FBL.emptyFn;
      
            if (this.requests.length > 0) 
                setTimeout(this.sendRequest, 10);
        }
    },
  
    /**
     * Retorna a resposta de acordo com o tipo de dado requisitado.
     */  
    getResponse: function(options)
    {
        var t = this.transport, type = options.dataType;
    
        if      (t.status != 200) return t.statusText
        else if (type == "text")  return t.responseText
        else if (type == "html")  return t.responseText
        else if (type == "xml")   return t.responseXML
        else if (type == "json")  return eval("(" + t.responseText + ")");
    },
  
    /**
     * Retorna o atual estado da requisição ajax.
     */     
    getState: function()
    {
        return this.states[this.transport.readyState];
    }
  
};

this.Ajax.initialize();


// ************************************************************************************************
// Cookie, from http://www.quirksmode.org/js/cookies.html

this.createCookie = function(name,value,days)
{
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
};

this.readCookie = function (name)
{
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++)
    {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
};

this.eraseCookie = function(name)
{
    createCookie(name,"",-1);
};


// ************************************************************************************************
// http://www.mister-pixel.com/#Content__state=is_that_simple
var fixIE6BackgroundImageCache = function(doc)
{
    doc = doc || document;
    try
    {
        doc.execCommand("BackgroundImageCache", false, true);
    } 
    catch(E)
    {
        
    }
};


// ************************************************************************************************
}).apply(FBL);