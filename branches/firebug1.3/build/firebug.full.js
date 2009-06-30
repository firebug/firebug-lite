var FBL = {};

(function() {
// ************************************************************************************************

// ************************************************************************************************
// Namespaces

var namespaces = [];

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

this.ns = function(fn)
{
    var ns = {};
    namespaces.push(fn, ns);
    return ns;
};

this.initialize = function()
{
    //if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("FBL.initialize BEGIN "+namespaces.length+" namespaces\n");
    
    initializeApplication();
    
    for (var i = 0; i < namespaces.length; i += 2)
    {
        var fn = namespaces[i];
        var ns = namespaces[i+1];
        fn.apply(ns);
    }
    
    waitForInit();

    //if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("FBL.initialize END "+namespaces.length+" namespaces\n");
};

var waitForInit = function waitForInit()
{
    if (document.body)
    {
        if (FBL.application.isPersistentMode && FBL.application.isChromeContext)
        {
            if (FBL.isIE6)
                fixIE6BackgroundImageCache();
            
            // initialize the chrome application
            FBL.Firebug.initialize();
            
            // Destroy the main application
            window.FirebugApplication.destroy();
            
            if (FBL.isIE)
                window.FirebugApplication = null;
            else
                delete window.FirebugApplication;
        }
        else
        {
            createApplication();
        }
    }
    else
        setTimeout(waitForInit, 50);
};

// ************************************************************************************************
// Application

this.application = {
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    // Application preferences
    isBookmarletMode: false, //TODO!!
    isPersistentMode: false, //TODO!!
    skin: "xp",
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    // Application States
    isDevelopmentMode: false,
    isChromeContext: false, // TODO: change to isChromeContext
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    // Application References
    global: null,
    chrome: null  
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var initializeApplication = function initializeApplication()
{
    // isPersistentMode, isChromeContext
    if (FBL.application.isPersistentMode && typeof window.FirebugApplication == "object")
    {
        FBL.application = window.FirebugApplication;
        FBL.application.isChromeContext = true;
    }
    // Global application
    else
    {
        // TODO: get preferences here...
        FBL.application.global = window;
        FBL.application.destroy = destroyApplication;
    }
};

var createApplication = function createApplication()
{
    findLocation();
    
    var options = FBL.extend({}, WindowDefaultOptions);
    
    FBL.createChrome(FBL.application.global, options, onChromeLoad);
};

var destroyApplication = function destroyApplication()
{
    setTimeout(function()
    {
        FBL = null;
    }, 100);
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Chrome loading

var onChromeLoad = function onChromeLoad(chrome)
{
    FBL.application.chrome = chrome;
    
    if (FBL.application.isPersistentMode)
    {
        chrome.window.FirebugApplication = FBL.application;
    
        if (FBL.application.isDevelopmentMode)
        {
            FBDev.loadChromeApplication(chrome);
        }
        else
        {
            var doc = chrome.document;
            var script = doc.createElement("script");
            script.src = application.location.app;
            doc.getElementsByTagName("head")[0].appendChild(script);
        }
    }
    else
        // initialize the chrome application
        setTimeout(function(){
            FBL.Firebug.initialize();
        },100);
};


// ************************************************************************************************
// Application Chromes

var WindowDefaultOptions = 
{
    type: "frame"
};

var FrameDefaultOptions = 
{
    id: "FirebugChrome",
    height: 250
};

var PopupDefaultOptions = 
{
    id: "FirebugChromePopup",
    height: 250
};

// ************************************************************************************************
// Library location

this.application.location = {
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
    var head = document.getElementsByTagName("head")[0];
    var path = null;
    
    for(var i=0, c=head.childNodes, ci; ci=c[i]; i++)
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
        var loc = FBL.application.location; 
        loc.source = path;
        loc.base = path.substr(0, path.length - m[1].length - 1);
        loc.skin = loc.base + "skin/" + FBL.application.skin + "/firebug.html";
        loc.app = path + fileName;
        
        if (fileName == "firebug.dev.js")
            FBL.application.isDevelopmentMode = true;

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
    r = r || {};
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
        if (FBL.application.isPersistentMode)
            return document.getElementById(id);
        else
            return FBL.application.chrome.document.getElementById(id);
    }
};

this.$$ = function(selector, doc)
{
    if (doc)
        return FBL.Firebug.Selector(selector, doc);
    else
    {
        return FBL.Firebug.Selector(selector, FBL.Firebug.chrome.document)
    }
};

this.createElement = function(tagName, options)
{
    options = options || {};
    var doc = options.document || FBL.Firebug.chrome.document;
    
    var element = doc.createElement(tagName);
    
    if (options.id)
    {
        element.id = options.id;
    }
    
    if (options.className)
    {
        element.className = options.className;
    }
    
    if (options.content)
    {
        element.innerHTML = options.content;
    }
    
    return element;
}

// ************************************************************************************************
// Event

this.bind = function(object, fn)
{
    return function(){return fn.apply(object, arguments);};
}

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

this.addGlobalEvent = function(name, handler)
{
    var doc = FBL.Firebug.browser.document;
    var frames = FBL.Firebug.browser.window.frames;
    
    FBL.addEvent(doc, name, handler);
  
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

this.dispatch = function(listeners, name, args)
{
    //if (FBTrace.DBG_DISPATCH) FBTrace.sysout("FBL.dispatch "+name+" to "+listeners.length+" listeners\n"); /*@explore*/
    //                                                                                                       /*@explore*/
    try {
        for (var i = 0; i < listeners.length; ++i)
        {
            var listener = listeners[i];
            if ( listener.hasOwnProperty(name) )
                listener[name].apply(listener, args);
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

// ************************************************************************************************
// class Names

this.hasClass = function(object, name) {
    return (' '+object.className+' ').indexOf(' '+name+' ') != -1;
}

this.addClass = function(object, name) {
    if ((' '+object.className+' ').indexOf(' '+name+' ') == -1)
        object.className = object.className ? object.className + ' ' + name : name; 
}

this.removeClass = function(object, name) {
    object.className = (' ' + object.className + ' ').
        replace(new RegExp('(\\S*)\\s+'+name+'\\s+(\\S*)', 'g'), '$1 $2').
        replace(/^\s*|\s*$/g, '');
}

this.toggleClass = function(object, name) {
    if ((' '+object.className+' ').indexOf(' '+name+' ') >= 0)
        this.removeClass(object, name)
    else
        this.addClass(object, name);
}


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
     * @param {Object}   options               Opções da requisição.  
     * @param {String}   options.url           URL a ser requisitada.
     * @param {String}   options.type          Tipo de requisição ("get" ou "post"). O padrão é "get".
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
    try {
        doc.execCommand("BackgroundImageCache", false, true);
    } catch(err) {}
};



// ************************************************************************************************
}).apply(FBL);

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// Globals

FBL.version = "FirebugLite-1.3.0a";

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

FBL.cacheID = "___FBL_";
FBL.documentCache = {};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Internals

var modules = [];
var panelTypes = [];

var panelTypeMap = {};


// ************************************************************************************************
// Firebug

FBL.Firebug =  
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    modules: modules,
    panelTypes: panelTypes,
    
    cache: {},
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Initialization
    
    initialize: function()
    {
        Firebug.browser = new Context(application.global);
        Firebug.context = Firebug.browser;
        
        Firebug.chrome = new FirebugChrome(application.chrome);
        Firebug.chrome.initialize();
        
        Firebug.cacheDocument();
        
        dispatch(modules, "initialize", []);
    },
  
    shutdown: function()
    {
        documentCache = {};
        
        dispatch(modules, "shutdown", []);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Registration

    registerModule: function()
    {
        modules.push.apply(modules, arguments);

        //for (var i = 0; i < arguments.length; ++i)
        //    TabWatcher.addListener(arguments[i]);
        
        //                                                                                          /*@explore*/
        //if (FBTrace.DBG_INITIALIZE) FBTrace.dumpProperties("registerModule", arguments);          /*@explore*/
    },

    registerPanel: function()
    {
        panelTypes.push.apply(panelTypes, arguments);

        for (var i = 0; i < arguments.length; ++i)
            panelTypeMap[arguments[i].prototype.name] = arguments[i];
        
        //                                                                                          /*@explore*/
        //if (FBTrace.DBG_INITIALIZE)                                                               /*@explore*/
        //    for (var i = 0; i < arguments.length; ++i)                                            /*@explore*/
        //        FBTrace.sysout("registerPanel "+arguments[i].prototype.name+"\n");                /*@explore*/
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Other methods
    
    cacheDocument: function()
    {
        var els = Firebug.browser.document.getElementsByTagName("*");
        for (var i=0, l=els.length, el; i<l; i++)
        {
            el = els[i];
            el[cacheID] = i;
            documentCache[i] = el;
        }
    }
};

// ************************************************************************************************
// Controller

Firebug.Controller = {
        
    _controllers: null,
        
    initialize: function(node)
    {
        this._controllers = [];
        this.node = this.node || node;
    },
    
    shutdown: function()
    {
        this.removeControllers();
    },
    
    /**
     * 
     */
    addController: function()
    {
        for (var i=0, arg; arg=arguments[i]; i++)
        {
            // If the first argument is a string, make a selector query 
            // within the controller node context
            if (typeof arg[0] == "string")
            {
                arg[0] = $$(arg[0], this.node);
            }
            
            // bind the handler to the proper context
            var handler = arg[2];
            arg[2] = bind(this, handler);
            // save the original handler as an extra-argument, so we can
            // look for it later, when removing a particular controller            
            arg[3] = handler;
            
            this._controllers.push(arg);
            addEvent.apply(this, arg);
        }
    },
    
    removeController: function()
    {
        for (var i=0, arg; arg=arguments[i]; i++)
        {
            for (var j=0, c; c=this._controllers[j]; j++)
            {
                if (arg[0] == c[0] && arg[1] == c[1] && arg[2] == c[3])
                    removeEvent.apply(this, c);
            }
        }
    },
    
    removeControllers: function()
    {
        for (var i=0, c; c=this._controllers[i]; i++)
        {
            removeEvent.apply(this, c);
        }
    }
};


// ************************************************************************************************
// Module

Firebug.Module =
{
    /**
     * Called when the window is opened.
     */
    initialize: function()
    {
    },
  
    /**
     * Called when the window is closed.
     */
    shutdown: function()
    {
    },
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  
    /**
     * Called when a new context is created but before the page is loaded.
     */
    initContext: function(context)
    {
    },
  
    /**
     * Called after a context is detached to a separate window;
     */
    reattachContext: function(browser, context)
    {
    },
  
    /**
     * Called when a context is destroyed. Module may store info on persistedState for reloaded pages.
     */
    destroyContext: function(context, persistedState)
    {
    },
  
    // Called when a FF tab is create or activated (user changes FF tab)
    // Called after context is created or with context == null (to abort?)
    showContext: function(browser, context)
    {
    },
  
    /**
     * Called after a context's page gets DOMContentLoaded
     */
    loadedContext: function(context)
    {
    },
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  
    showPanel: function(browser, panel)
    {
    },
  
    showSidePanel: function(browser, panel)
    {
    },
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  
    updateOption: function(name, value)
    {
    },
  
    getObjectByURL: function(context, url)
    {
    }
};

// ************************************************************************************************
// Panel

Firebug.Panel =
{
    name: "HelloWorld",
    title: "Hello World!",
    parentPanel: null,
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    options: {
        hasCommandLine: false,
        hasSidePanel: false,
        hasStatusBar: false,
        hasToolButtons: false,
        
        // Pre-rendered panels are those included in the skin file (firebug.html)
        isPreRendered: false,
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // To be used by external extensions
        panelHTML: "",
        panelCSS: "",
        
        toolButtonsHTML: ""
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    tabNode: null,
    panelNode: null,
    sidePanelNode: null,
    statusBarNode: null,
    toolButtonsNode: null,

    panelBarNode: null,
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    panelBar: null,
    
    commandLine: null,
    
    toolButtons: null,
    statusBar: null,

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    searchable: false,
    editable: true,
    order: 2147483647,
    statusSeparator: "<",

    initialize: function(context, doc)
    {
        var options = this.options = extend(Firebug.Panel.options, this.options);
        var panelId = "fb" + this.name;
        
        if (options.isPreRendered)
        {
            this.panelNode = $(panelId);
            
            this.tabNode = $(panelId + "Tab");
            this.tabNode.style.display = "block";
            
            if (options.hasSidePanel)
            {
                //this.sidePanelNode = $(panelId + "StatusBar");
            }
            
            if (options.hasStatusBar)
            {
                this.statusBarBox = $("fbStatusBarBox");
                this.statusBarNode = $(panelId + "StatusBar");
            }
            
            if (options.hasToolButtons)
            {
                this.toolButtonsNode = $(panelId + "Buttons");
            }
            
        }
        else
        {
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // Create Panel
            var panelNode = this.panelNode = createElement("div", {
                id: panelId,
                className: "fbPanel",
                content: "woo hoo!"
            });

            $("fbPanel1").appendChild(panelNode);
            
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // Create Panel Tab
            var tabContent = '<span class="fbTabL"></span><span class="fbTabText">' +
                    this.name + '</span><span class="fbTabR"></span>';            
            
            var tabNode = this.tabNode = createElement("a", {
                id: panelId + "Tab",
                className: "fbTab",
                content: tabContent
            });
            
            if (isIE6)
            {
                tabNode.href = "javascript:void(0)";
            }
            
            $("fbPanelBar1").appendChild(tabNode);
            this.tabNode.style.display = "block";
            
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // create Panel SideBar
            
        }
        
        /*
        this.context = context;
        this.document = doc;

        this.panelNode = doc.createElement("div");
        this.panelNode.ownerPanel = this;

        setClass(this.panelNode, "panelNode panelNode-"+this.name+" contextUID="+context.uid);
        doc.body.appendChild(this.panelNode);

        if (FBTrace.DBG_INITIALIZE)
            FBTrace.sysout("firebug.initialize panelNode for "+this.name+"\n");

        this.initializeNode(this.panelNode);
        /**/
    },

    destroy: function(state) // Panel may store info on state
    {
        if (FBTrace.DBG_INITIALIZE)
            FBTrace.sysout("firebug.destroy panelNode for "+this.name+"\n");

        if (this.panelNode)
            delete this.panelNode.ownerPanel;

        this.destroyNode();
    },

    detach: function(oldChrome, newChrome)
    {
        this.lastScrollTop = this.panelNode.scrollTop;
    },

    reattach: function(doc)
    {
        this.document = doc;

        if (this.panelNode)
        {
            this.panelNode = doc.adoptNode(this.panelNode, true);
            this.panelNode.ownerPanel = this;
            doc.body.appendChild(this.panelNode);
            this.panelNode.scrollTop = this.lastScrollTop;
            delete this.lastScrollTop;
        }
    },

    show: function(state)
    {
        var options = this.options;
        
        this.panelNode.style.display = "block";
        
        if (options.hasSidePanel)
        {
            //this.sidePanelNode = $(panelId + "StatusBar");
        }
        
        if (options.hasStatusBar)
        {
            this.statusBarBox.style.display = "inline";
            this.statusBarNode.style.display = "inline";
        }
        
        if (options.hasToolButtons)
        {
            this.toolButtonsNode.style.display = "inline";
        }
        
        Firebug.chrome.layout(options);
    },

    hide: function(state)
    {
        var options = this.options;
        
        this.panelNode.style.display = "none";
        
        if (options.hasSidePanel)
        {
            //this.sidePanelNode = $(panelId + "StatusBar");
        }
        
        if (options.hasStatusBar)
        {
            this.statusBarBox.style.display = "none";
            this.statusBarNode.style.display = "none";
        }
        
        if (options.hasToolButtons)
        {
            this.toolButtonsNode.style.display = "none";
        }
    },

    watchWindow: function(win)
    {
    },

    unwatchWindow: function(win)
    {
    },

    updateOption: function(name, value)
    {
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    /**
     * Toolbar helpers
     */
    showToolbarButtons: function(buttonsId, show)
    {
        try
        {
            if (!this.context.browser) // XXXjjb this is bug. Somehow the panel context is not FirebugContext.
            {
              if (FBTrace.DBG_ERRORS)
                FBTrace.sysout("firebug.Panel showToolbarButtons this.context has no browser, this:", this)
                return;
            }
            var buttons = this.context.browser.chrome.$(buttonsId);
            if (buttons)
                collapse(buttons, show ? "false" : "true");
        }
        catch (exc)
        {
            if (FBTrace.DBG_ERRORS)
            {
                FBTrace.dumpProperties("firebug.Panel showToolbarButtons FAILS", exc);
                if (!this.context.browser)FBTrace.dumpStack("firebug.Panel showToolbarButtons no browser");
            }
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    /**
     * Returns a number indicating the view's ability to inspect the object.
     *
     * Zero means not supported, and higher numbers indicate specificity.
     */
    supportsObject: function(object)
    {
        return 0;
    },

    refresh: function()
    {

    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    startInspecting: function()
    {
    },

    stopInspecting: function(object, cancelled)
    {
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    search: function(text)
    {
    }

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


};

// ************************************************************************************************
// PanelBar

Firebug.PanelBar = 
{
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    selectedPanel: null,
    
    panelBarNode: null,
    context: null,
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    initialize: function()
    {
        this.panels = [];
        this.panelMap = {};
        
        //this.panelBarNode = panelBarNode;    
    },
    
    shutdown: function()
    {
    
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    addPanel: function(panelName, parentPanel)
    {
        var PanelType = panelTypeMap[panelName];
        var panel = new PanelType();
        panel.initialize();
        
        this.panels.push(panel);
        this.panelMap[panelName] = panel;
    },
    
    removePanel: function(panelName)
    {
        
    },
    
    selectPanel: function(panelName)
    {
        var selectedPanel = this.selectedPanel;
        var panel = this.panelMap[panelName];
        
        if (panel && selectedPanel != panel)
        {
            if (selectedPanel)
            {
                removeClass(selectedPanel.tabNode, "fbSelectedTab");
                selectedPanel.hide();
            }
            
            this.selectedPanel = panel;
            
            addClass(panel.tabNode, "fbSelectedTab");
            panel.show();
        }
    },
    
    getSelectedPanel: function()
    {
        return this.selectedPanel;
    }    
   
};


// ************************************************************************************************
// ************************************************************************************************
// ************************************************************************************************


/*

From Honza Tutorial
----------------------------------------------------
FBL.ns(function() { with (FBL) {
var panelName = "HelloWorld";
Firebug.HelloWorldModel = extend(Firebug.Module,
{
    showPanel: function(browser, panel) {
        var isHwPanel = panel && panel.name == panelName;
        var hwButtons = browser.chrome.$("fbHelloWorldButtons");
        collapse(hwButtons, !isHwPanel);
    },
    onMyButton: function(context) {
        alert("Hello World!");
    }
});

function HelloWorldPanel() {}
HelloWorldPanel.prototype = extend(Firebug.Panel,
{
    name: panelName,
    title: "Hello World!",

    initialize: function() {
        Firebug.Panel.initialize.apply(this, arguments);
    }
});

Firebug.registerModule(Firebug.HelloWorldModel);
Firebug.registerPanel(HelloWorldPanel);

}});
----------------------------------------------------

/**/  
  



// ************************************************************************************************
}});

// Problems in IE
// FIXED - eval return
// FIXED - addEventListener problem in IE
// FIXED doc.createRange?
//
// class reserved word
// test all honza examples in IE6 and IE7


/* See license.txt for terms of usage */

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

function DomplateTag(tagName)
{
    this.tagName = tagName;
}

function DomplateEmbed()
{
}

function DomplateLoop()
{
}

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

(function() {

var womb = null;

domplate = function()
{
    var lastSubject;
    for (var i = 0; i < arguments.length; ++i)
        lastSubject = lastSubject ? copyObject(lastSubject, arguments[i]) : arguments[i];

    for (var name in lastSubject)
    {
        var val = lastSubject[name];
        if (isTag(val))
            val.tag.subject = lastSubject;
    }

    return lastSubject;
};

domplate.context = function(context, fn)
{
    var lastContext = domplate.lastContext;
    domplate.topContext = context;
    fn.apply(context);
    domplate.topContext = lastContext;
};

FBL.TAG = function()
{
    var embed = new DomplateEmbed();
    return embed.merge(arguments);
};

FBL.FOR = function()
{
    var loop = new DomplateLoop();
    return loop.merge(arguments);
};

DomplateTag.prototype =
{
    merge: function(args, oldTag)
    {
        if (oldTag)
            this.tagName = oldTag.tagName;

        this.context = oldTag ? oldTag.context : null;
        this.subject = oldTag ? oldTag.subject : null;
        this.attrs = oldTag ? copyObject(oldTag.attrs) : {};
        this.classes = oldTag ? copyObject(oldTag.classes) : {};
        this.props = oldTag ? copyObject(oldTag.props) : null;
        this.listeners = oldTag ? copyArray(oldTag.listeners) : null;
        this.children = oldTag ? copyArray(oldTag.children) : [];
        this.vars = oldTag ? copyArray(oldTag.vars) : [];

        var attrs = args.length ? args[0] : null;
        var hasAttrs = typeof(attrs) == "object" && !isTag(attrs);

        this.children = [];

        if (domplate.topContext)
            this.context = domplate.topContext;

        if (args.length)
            parseChildren(args, hasAttrs ? 1 : 0, this.vars, this.children);

        if (hasAttrs)
            this.parseAttrs(attrs);

        return creator(this, DomplateTag);
    },

    parseAttrs: function(args)
    {
        for (var name in args)
        {
            var val = parseValue(args[name]);
            readPartNames(val, this.vars);

            if (name.indexOf("on") == 0)
            {
                var eventName = name.substr(2);
                if (!this.listeners)
                    this.listeners = [];
                this.listeners.push(eventName, val);
            }
            else if (name.indexOf("_") == 0)
            {
                var propName = name.substr(1);
                if (!this.props)
                    this.props = {};
                this.props[propName] = val;
            }
            else if (name.indexOf("$") == 0)
            {
                var className = name.substr(1);
                if (!this.classes)
                    this.classes = {};
                this.classes[className] = val;
            }
            else
            {
                if (name == "class" && this.attrs.hasOwnProperty(name) )
                    this.attrs[name] += " " + val;
                else
                    this.attrs[name] = val;
            }
        }
    },

    compile: function()
    {
        if (this.renderMarkup)
            return;

        this.compileMarkup();
        this.compileDOM();

        //if (FBTrace.DBG_DOM) FBTrace.sysout("domplate renderMarkup: ", this.renderMarkup);
        //if (FBTrace.DBG_DOM) FBTrace.sysout("domplate renderDOM:", this.renderDOM);
        //if (FBTrace.DBG_DOM) FBTrace.sysout("domplate domArgs:", this.domArgs);
    },

    compileMarkup: function()
    {
        this.markupArgs = [];
        var topBlock = [], topOuts = [], blocks = [], info = {args: this.markupArgs, argIndex: 0};
         
        this.generateMarkup(topBlock, topOuts, blocks, info);
        this.addCode(topBlock, topOuts, blocks);

        var fnBlock = ['r=(function (__code__, __context__, __in__, __out__'];
        for (var i = 0; i < info.argIndex; ++i)
            fnBlock.push(', s', i);
        fnBlock.push(') {');

        if (this.subject)
            fnBlock.push('with (this) {');
        if (this.context)
            fnBlock.push('with (__context__) {');
        fnBlock.push('with (__in__) {');

        fnBlock.push.apply(fnBlock, blocks);

        if (this.subject)
            fnBlock.push('}');
        if (this.context)
            fnBlock.push('}');

        fnBlock.push('}})');

        function __link__(tag, code, outputs, args)
        {
            if (!tag || !tag.tag)
                return;

            tag.tag.compile();

            var tagOutputs = [];
            var markupArgs = [code, tag.tag.context, args, tagOutputs];
            markupArgs.push.apply(markupArgs, tag.tag.markupArgs);
            tag.tag.renderMarkup.apply(tag.tag.subject, markupArgs);

            outputs.push(tag);
            outputs.push(tagOutputs);
        }

        function __escape__(value)
        {
            function replaceChars(ch)
            {
                switch (ch)
                {
                    case "<":
                        return "&lt;";
                    case ">":
                        return "&gt;";
                    case "&":
                        return "&amp;";
                    case "'":
                        return "&#39;";
                    case '"':
                        return "&quot;";
                }
                return "?";
            };
            return String(value).replace(/[<>&"']/g, replaceChars);
        }

        function __loop__(iter, outputs, fn)
        {
            var iterOuts = [];
            outputs.push(iterOuts);

            if (iter instanceof Array)
                iter = new ArrayIterator(iter);

            try
            {
                while (1)
                {
                    var value = iter.next();
                    var itemOuts = [0,0];
                    iterOuts.push(itemOuts);
                    fn.apply(this, [value, itemOuts]);
                }
            }
            catch (exc)
            {
                if (exc != StopIteration)
                    throw exc;
            }
        }

        var js = fnBlock.join("");
        var r = null;
        eval(js)
        this.renderMarkup = r;
    },

    getVarNames: function(args)
    {
        if (this.vars)
            args.push.apply(args, this.vars);

        for (var i = 0; i < this.children.length; ++i)
        {
            var child = this.children[i];
            if (isTag(child))
                child.tag.getVarNames(args);
            else if (child instanceof Parts)
            {
                for (var i = 0; i < child.parts.length; ++i)
                {
                    if (child.parts[i] instanceof Variable)
                    {
                        var name = child.parts[i].name;
                        var names = name.split(".");
                        args.push(names[0]);
                    }
                }
            }
        }
    },

    generateMarkup: function(topBlock, topOuts, blocks, info)
    {
        topBlock.push(',"<', this.tagName, '"');

        for (var name in this.attrs)
        {
            if (name != "class")
            {
                var val = this.attrs[name];
                topBlock.push(', " ', name, '=\\""');
                addParts(val, ',', topBlock, info, true);
                topBlock.push(', "\\""');
            }
        }

        if (this.listeners)
        {
            for (var i = 0; i < this.listeners.length; i += 2)
                readPartNames(this.listeners[i+1], topOuts);
        }

        if (this.props)
        {
            for (var name in this.props)
                readPartNames(this.props[name], topOuts);
        }

        if ( this.attrs.hasOwnProperty("class") || this.classes)
        {
            topBlock.push(', " class=\\""');
            if (this.attrs.hasOwnProperty("class"))
                addParts(this.attrs["class"], ',', topBlock, info, true);
              topBlock.push(', " "');
            for (var name in this.classes)
            {
                topBlock.push(', (');
                addParts(this.classes[name], '', topBlock, info);
                topBlock.push(' ? "', name, '" + " " : "")');
            }
            topBlock.push(', "\\""');
        }
        topBlock.push(',">"');

        this.generateChildMarkup(topBlock, topOuts, blocks, info);
        topBlock.push(',"</', this.tagName, '>"');
    },

    generateChildMarkup: function(topBlock, topOuts, blocks, info)
    {
        for (var i = 0; i < this.children.length; ++i)
        {
            var child = this.children[i];
            if (isTag(child))
                child.tag.generateMarkup(topBlock, topOuts, blocks, info);
            else
                addParts(child, ',', topBlock, info, true);
        }
    },

    addCode: function(topBlock, topOuts, blocks)
    {
        if (topBlock.length)
            blocks.push('__code__.push(""', topBlock.join(""), ');');
        if (topOuts.length)
            blocks.push('__out__.push(', topOuts.join(","), ');');
        topBlock.splice(0, topBlock.length);
        topOuts.splice(0, topOuts.length);
    },

    addLocals: function(blocks)
    {
        var varNames = [];
        this.getVarNames(varNames);

        var map = {};
        for (var i = 0; i < varNames.length; ++i)
        {
            var name = varNames[i];
            if ( map.hasOwnProperty(name) )
                continue;

            map[name] = 1;
            var names = name.split(".");
            blocks.push('var ', names[0] + ' = ' + '__in__.' + names[0] + ';');
        }
    },

    compileDOM: function()
    {
        var path = [];
        var blocks = [];
        this.domArgs = [];
        path.embedIndex = 0;
        path.loopIndex = 0;
        path.staticIndex = 0;
        path.renderIndex = 0;
        var nodeCount = this.generateDOM(path, blocks, this.domArgs);

        var fnBlock = ['r=(function (root, context, o'];

        for (var i = 0; i < path.staticIndex; ++i)
            fnBlock.push(', ', 's'+i);

        for (var i = 0; i < path.renderIndex; ++i)
            fnBlock.push(', ', 'd'+i);

        fnBlock.push(') {');
        for (var i = 0; i < path.loopIndex; ++i)
            fnBlock.push('var l', i, ' = 0;');
        for (var i = 0; i < path.embedIndex; ++i)
            fnBlock.push('var e', i, ' = 0;');

        if (this.subject)
            fnBlock.push('with (this) {');
        if (this.context)
            fnBlock.push('with (context) {');

        fnBlock.push(blocks.join(""));

        if (this.subject)
            fnBlock.push('}');
        if (this.context)
            fnBlock.push('}');

        fnBlock.push('return ', nodeCount, ';');
        fnBlock.push('})');

        function __bind__(object, fn)
        {
            return function(event) { return fn.apply(object, [event]); }
        }

        function __link__(node, tag, args)
        {
            if (!tag || !tag.tag)
                return;

            tag.tag.compile();

            var domArgs = [node, tag.tag.context, 0];
            domArgs.push.apply(domArgs, tag.tag.domArgs);
            domArgs.push.apply(domArgs, args);
            //if (FBTrace.DBG_DOM) FBTrace.dumpProperties("domplate__link__ domArgs:", domArgs);
            return tag.tag.renderDOM.apply(tag.tag.subject, domArgs);
        }

        var self = this;
        function __loop__(iter, fn)
        {
            var nodeCount = 0;
            for (var i = 0; i < iter.length; ++i)
            {
                iter[i][0] = i;
                iter[i][1] = nodeCount;
                nodeCount += fn.apply(this, iter[i]);
                //if (FBTrace.DBG_DOM) FBTrace.sysout("nodeCount", nodeCount);
            }
            return nodeCount;
        }

        function __path__(parent, offset)
        {
            //if (FBTrace.DBG_DOM) FBTrace.sysout("domplate __path__ offset: "+ offset+"\n");
            var root = parent;

            for (var i = 2; i < arguments.length; ++i)
            {
                var index = arguments[i];
                if (i == 3)
                    index += offset;

                if (index == -1)
                    parent = parent.parentNode;
                else
                    parent = parent.childNodes[index];
            }

            //if (FBTrace.DBG_DOM) FBTrace.sysout("domplate: "+arguments[2]+", root: "+ root+", parent: "+ parent+"\n");
            return parent;
        }

        var js = fnBlock.join("");
        //if (FBTrace.DBG_DOM) FBTrace.sysout(js.replace(/(\;|\{)/g, "$1\n"));
        var r = null;
        eval(js)
        this.renderDOM = r;
    },

    generateDOM: function(path, blocks, args)
    {
        if (this.listeners || this.props)
            this.generateNodePath(path, blocks);

        if (this.listeners)
        {
            for (var i = 0; i < this.listeners.length; i += 2)
            {
                var val = this.listeners[i+1];
                var arg = generateArg(val, path, args);
                //blocks.push('node.addEventListener("', this.listeners[i], '", __bind__(this, ', arg, '), false);');
                blocks.push('addEvent(node, "', this.listeners[i], '", __bind__(this, ', arg, '), false);');
            }
        }

        if (this.props)
        {
            for (var name in this.props)
            {
                var val = this.props[name];
                var arg = generateArg(val, path, args);
                blocks.push('node.', name, ' = ', arg, ';');
            }
        }

        this.generateChildDOM(path, blocks, args);
        return 1;
    },

    generateNodePath: function(path, blocks)
    {
        blocks.push("node = __path__(root, o");
        for (var i = 0; i < path.length; ++i)
            blocks.push(",", path[i]);
        blocks.push(");");
    },

    generateChildDOM: function(path, blocks, args)
    {
        path.push(0);
        for (var i = 0; i < this.children.length; ++i)
        {
            var child = this.children[i];
            if (isTag(child))
                path[path.length-1] += '+' + child.tag.generateDOM(path, blocks, args);
            else
                path[path.length-1] += '+1';
        }
        path.pop();
    }
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

DomplateEmbed.prototype = copyObject(DomplateTag.prototype,
{
    merge: function(args, oldTag)
    {
        this.value = oldTag ? oldTag.value : parseValue(args[0]);
        this.attrs = oldTag ? oldTag.attrs : {};
        this.vars = oldTag ? copyArray(oldTag.vars) : [];

        var attrs = args[1];
        for (var name in attrs)
        {
            var val = parseValue(attrs[name]);
            this.attrs[name] = val;
            readPartNames(val, this.vars);
        }

        return creator(this, DomplateEmbed);
    },

    getVarNames: function(names)
    {
        if (this.value instanceof Parts)
            names.push(this.value.parts[0].name);

        if (this.vars)
            names.push.apply(names, this.vars);
    },

    generateMarkup: function(topBlock, topOuts, blocks, info)
    {
        this.addCode(topBlock, topOuts, blocks);

        blocks.push('__link__(');
        addParts(this.value, '', blocks, info);
        blocks.push(', __code__, __out__, {');

        var lastName = null;
        for (var name in this.attrs)
        {
            if (lastName)
                blocks.push(',');
            lastName = name;

            var val = this.attrs[name];
            blocks.push('"', name, '":');
            addParts(val, '', blocks, info);
        }

        blocks.push('});');
        //this.generateChildMarkup(topBlock, topOuts, blocks, info);
    },

    generateDOM: function(path, blocks, args)
    {
        var embedName = 'e'+path.embedIndex++;

        this.generateNodePath(path, blocks);

        var valueName = 'd' + path.renderIndex++;
        var argsName = 'd' + path.renderIndex++;
        blocks.push(embedName + ' = __link__(node, ', valueName, ', ', argsName, ');');

        return embedName;
    }
});

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

DomplateLoop.prototype = copyObject(DomplateTag.prototype,
{
    merge: function(args, oldTag)
    {
        this.varName = oldTag ? oldTag.varName : args[0];
        this.iter = oldTag ? oldTag.iter : parseValue(args[1]);
        this.vars = [];

        this.children = oldTag ? copyArray(oldTag.children) : [];

        var offset = Math.min(args.length, 2);
        parseChildren(args, offset, this.vars, this.children);

        return creator(this, DomplateLoop);
    },

    getVarNames: function(names)
    {
        if (this.iter instanceof Parts)
            names.push(this.iter.parts[0].name);

        DomplateTag.prototype.getVarNames.apply(this, [names]);
    },

    generateMarkup: function(topBlock, topOuts, blocks, info)
    {
        this.addCode(topBlock, topOuts, blocks);

        var iterName;
        if (this.iter instanceof Parts)
        {
            var part = this.iter.parts[0];
            iterName = part.name;

            if (part.format)
            {
                for (var i = 0; i < part.format.length; ++i)
                    iterName = part.format[i] + "(" + iterName + ")";
            }
        }
        else
            iterName = this.iter;

        blocks.push('__loop__.apply(this, [', iterName, ', __out__, function(', this.varName, ', __out__) {');
        this.generateChildMarkup(topBlock, topOuts, blocks, info);
        this.addCode(topBlock, topOuts, blocks);
        blocks.push('}]);');
    },

    generateDOM: function(path, blocks, args)
    {
        var iterName = 'd'+path.renderIndex++;
        var counterName = 'i'+path.loopIndex;
        var loopName = 'l'+path.loopIndex++;

        if (!path.length)
            path.push(-1, 0);

        var preIndex = path.renderIndex;
        path.renderIndex = 0;

        var nodeCount = 0;

        var subBlocks = [];
        var basePath = path[path.length-1];
        for (var i = 0; i < this.children.length; ++i)
        {
            path[path.length-1] = basePath+'+'+loopName+'+'+nodeCount;

            var child = this.children[i];
            if (isTag(child))
                nodeCount += '+' + child.tag.generateDOM(path, subBlocks, args);
            else
                nodeCount += '+1';
        }

        path[path.length-1] = basePath+'+'+loopName;

        blocks.push(loopName,' = __loop__.apply(this, [', iterName, ', function(', counterName,',',loopName);
        for (var i = 0; i < path.renderIndex; ++i)
            blocks.push(',d'+i);
        blocks.push(') {');
        blocks.push(subBlocks.join(""));
        blocks.push('return ', nodeCount, ';');
        blocks.push('}]);');

        path.renderIndex = preIndex;

        return loopName;
    }
});

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

function Variable(name, format)
{
    this.name = name;
    this.format = format;
}

function Parts(parts)
{
    this.parts = parts;
}

// ************************************************************************************************

function parseParts(str)
{
    var re = /\$([_A-Za-z][_A-Za-z0-9.|]*)/g;
    var index = 0;
    var parts = [];

    var m;
    while (m = re.exec(str))
    {
        var pre = str.substr(index, (re.lastIndex-m[0].length)-index);
        if (pre)
            parts.push(pre);

        var expr = m[1].split("|");
        parts.push(new Variable(expr[0], expr.slice(1)));
        index = re.lastIndex;
    }

    if (!index)
        return str;

    var post = str.substr(index);
    if (post)
        parts.push(post);

    return new Parts(parts);
}

function parseValue(val)
{
    return typeof(val) == 'string' ? parseParts(val) : val;
}

function parseChildren(args, offset, vars, children)
{
    for (var i = offset; i < args.length; ++i)
    {
        var val = parseValue(args[i]);
        children.push(val);
        readPartNames(val, vars);
    }
}

function readPartNames(val, vars)
{
    if (val instanceof Parts)
    {
        for (var i = 0; i < val.parts.length; ++i)
        {
            var part = val.parts[i];
            if (part instanceof Variable)
                vars.push(part.name);
        }
    }
}

function generateArg(val, path, args)
{
    if (val instanceof Parts)
    {
        var vals = [];
        for (var i = 0; i < val.parts.length; ++i)
        {
            var part = val.parts[i];
            if (part instanceof Variable)
            {
                var varName = 'd'+path.renderIndex++;
                if (part.format)
                {
                    for (var j = 0; j < part.format.length; ++j)
                        varName = part.format[j] + '(' + varName + ')';
                }

                vals.push(varName);
            }
            else
                vals.push('"'+part.replace(/"/g, '\\"')+'"');
        }

        return vals.join('+');
    }
    else
    {
        args.push(val);
        return 's' + path.staticIndex++;
    }
}

function addParts(val, delim, block, info, escapeIt)
{
    var vals = [];
    if (val instanceof Parts)
    {
        for (var i = 0; i < val.parts.length; ++i)
        {
            var part = val.parts[i];
            if (part instanceof Variable)
            {
                var partName = part.name;
                if (part.format)
                {
                    for (var j = 0; j < part.format.length; ++j)
                        partName = part.format[j] + "(" + partName + ")";
                }

                if (escapeIt)
                    vals.push("__escape__(" + partName + ")");
                else
                    vals.push(partName);
            }
            else
                vals.push('"'+ part + '"');
        }
    }
    else if (isTag(val))
    {
        info.args.push(val);
        vals.push('s'+info.argIndex++);
    }
    else
        vals.push('"'+ val + '"');

    var parts = vals.join(delim);
    if (parts)
        block.push(delim, parts);
}

function isTag(obj)
{
    return (typeof(obj) == "function" || obj instanceof Function) && !!obj.tag;
}

function creator(tag, cons)
{
    var fn = new Function(
        "var tag = arguments.callee.tag;" +
        "var cons = arguments.callee.cons;" +
        "var newTag = new cons();" +
        "return newTag.merge(arguments, tag);");

    fn.tag = tag;
    fn.cons = cons;
    extend(fn, Renderer);

    return fn;
}

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

function copyArray(oldArray)
{
    var ary = [];
    if (oldArray)
        for (var i = 0; i < oldArray.length; ++i)
            ary.push(oldArray[i]);
   return ary;
}

function copyObject(l, r)
{
    var m = {};
    extend(m, l);
    extend(m, r);
    return m;
}

function extend(l, r)
{
    for (var n in r)
        l[n] = r[n];
}

function addEvent(object, name, handler)
{
    if (document.all)
        object.attachEvent("on"+name, handler);
    else
        object.addEventListener(name, handler, false);
}

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

function ArrayIterator(array)
{
    var index = -1;

    this.next = function()
    {
        if (++index >= array.length)
            throw StopIteration;

        return array[index];
    };
}

function StopIteration() {}

FBL.$break = function()
{
    throw StopIteration;
};

// ************************************************************************************************

var Renderer =
{
    renderHTML: function(args, outputs, self)
    {
        var code = [];
        var markupArgs = [code, this.tag.context, args, outputs];
        markupArgs.push.apply(markupArgs, this.tag.markupArgs);
        this.tag.renderMarkup.apply(self ? self : this.tag.subject, markupArgs);
        return code.join("");
    },

    insertRows: function(args, before, self)
    {
        this.tag.compile();

        var outputs = [];
        var html = this.renderHTML(args, outputs, self);

        var doc = before.ownerDocument;
        var table = doc.createElement("table");
        table.innerHTML = html;

        var tbody = table.firstChild;
        var parent = before.tagName == "TR" ? before.parentNode : before;
        var after = before.tagName == "TR" ? before.nextSibling : null;

        var firstRow = tbody.firstChild, lastRow;
        while (tbody.firstChild)
        {
            lastRow = tbody.firstChild;
            if (after)
                parent.insertBefore(lastRow, after);
            else
                parent.appendChild(lastRow);
        }

        var offset = 0;
        if (before.tagName == "TR")
        {
            var node = firstRow.parentNode.firstChild;
            for (; node && node != firstRow; node = node.nextSibling)
                ++offset;
        }

        var domArgs = [firstRow, this.tag.context, offset];
        domArgs.push.apply(domArgs, this.tag.domArgs);
        domArgs.push.apply(domArgs, outputs);

        this.tag.renderDOM.apply(self ? self : this.tag.subject, domArgs);
        return [firstRow, lastRow];
    },

    insertAfter: function(args, before, self)
    {
        this.tag.compile();

        var outputs = [];
        var html = this.renderHTML(args, outputs, self);

        var doc = before.ownerDocument;
        if (!womb || womb.ownerDocument != doc)
            womb = doc.createElement("div");
        
        womb.innerHTML = html;
  
        root = womb.firstChild;
        while (womb.firstChild)
            if (before.nextSibling)
                before.parentNode.insertBefore(womb.firstChild, before.nextSibling);
            else
                before.parentNode.appendChild(womb.firstChild);
        
        var domArgs = [root, this.tag.context, 0];
        domArgs.push.apply(domArgs, this.tag.domArgs);
        domArgs.push.apply(domArgs, outputs);

        this.tag.renderDOM.apply(self ? self : (this.tag.subject ? this.tag.subject : null),
            domArgs);

        return root;
    },

    replace: function(args, parent, self)
    {
        this.tag.compile();

        var outputs = [];
        var html = this.renderHTML(args, outputs, self);

        var root;
        if (parent.nodeType == 1)
        {
            parent.innerHTML = html;
            root = parent.firstChild;
        }
        else
        {
            if (!parent || parent.nodeType != 9)
                parent = document;

            if (!womb || womb.ownerDocument != parent)
                womb = parent.createElement("div");
            womb.innerHTML = html;

            root = womb.firstChild;
            //womb.removeChild(root);
        }

        var domArgs = [root, this.tag.context, 0];
        domArgs.push.apply(domArgs, this.tag.domArgs);
        domArgs.push.apply(domArgs, outputs);
        this.tag.renderDOM.apply(self ? self : this.tag.subject, domArgs);

        return root;
    },

    append: function(args, parent, self)
    {
        this.tag.compile();

        var outputs = [];
        var html = this.renderHTML(args, outputs, self);
        //if (FBTrace.DBG_DOM) FBTrace.sysout("domplate.append html: "+html+"\n");
        
        if (!womb || womb.ownerDocument != parent.ownerDocument)
            womb = parent.ownerDocument.createElement("div");
        womb.innerHTML = html;

        root = womb.firstChild;
        while (womb.firstChild)
            parent.appendChild(womb.firstChild);

        var domArgs = [root, this.tag.context, 0];
        domArgs.push.apply(domArgs, this.tag.domArgs);
        domArgs.push.apply(domArgs, outputs);
        
        //if (FBTrace.DBG_DOM) FBTrace.dumpProperties("domplate append domArgs:", domArgs);
        this.tag.renderDOM.apply(self ? self : this.tag.subject, domArgs);

        return root;
    }
};

// ************************************************************************************************

function defineTags()
{
    for (var i = 0; i < arguments.length; ++i)
    {
        var tagName = arguments[i];
        var fn = new Function("var newTag = new DomplateTag('"+tagName+"'); return newTag.merge(arguments);");

        var fnName = tagName.toUpperCase();
        FBL[fnName] = fn;
    }
}

defineTags(
    "a", "button", "br", "canvas", "col", "colgroup", "div", "fieldset", "form", "h1", "h2", "h3", "hr",
     "img", "input", "label", "legend", "li", "ol", "optgroup", "option", "p", "pre", "select",
    "span", "strong", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "tr", "tt", "ul", "iframe"
);

})();


FBL.ns(function() { with (FBL) {
// ************************************************************************************************

append(FBL, {

    appendText: function(object, html)
    {
        html.push(escapeHTML(objectToString(object)));
    },
    
    appendNull: function(object, html)
    {
        html.push('<span class="objectBox-null">', escapeHTML(objectToString(object)), '</span>');
    },
    
    appendString: function(object, html)
    {
        html.push('<span class="objectBox-string">&quot;', escapeHTML(objectToString(object)),
            '&quot;</span>');
    },
    
    appendInteger: function(object, html)
    {
        html.push('<span class="objectBox-number">', escapeHTML(objectToString(object)), '</span>');
    },
    
    appendFloat: function(object, html)
    {
        html.push('<span class="objectBox-number">', escapeHTML(objectToString(object)), '</span>');
    },
    
    appendFunction: function(object, html)
    {
        var reName = /function ?(.*?)\(/;
        var m = reName.exec(objectToString(object));
        var name = m && m[1] ? m[1] : "function";
        html.push('<span class="objectBox-function">', escapeHTML(name), '()</span>');
    },
    
    appendObject: function(object, html)
    {
        try
        {
            if (object == undefined)
                appendNull("undefined", html);
            else if (object == null)
                appendNull("null", html);
            else if (typeof object == "string")
                appendString(object, html);
            else if (typeof object == "number")
                appendInteger(object, html);
            else if (typeof object == "boolean")
                appendInteger(object, html);
            else if (typeof object == "function")
                appendFunction(object, html);
            else if (object.nodeType == 1)
                appendSelector(object, html);
            else if (typeof object == "object")
            {
                if (typeof object.length != "undefined")
                    appendArray(object, html);
                else
                    appendObjectFormatted(object, html);
            }
            else
                appendText(object, html);
        }
        catch (exc)
        {
        }
    },
        
    appendObjectFormatted: function(object, html)
    {
        var text = objectToString(object);
        var reObject = /\[object (.*?)\]/;
    
        var m = reObject.exec(text);
        html.push('<span class="objectBox-object">', m ? m[1] : text, '</span>')
    },
    
    appendSelector: function(object, html)
    {
        var uid = object[cacheID];
        var uidString = uid ? [cacheID, '="', uid, '" id="', uid, '"'].join("") : "";
                        
        html.push('<span class="objectBox-selector"', uidString, '>');
    
        html.push('<span class="selectorTag">', escapeHTML(object.nodeName.toLowerCase()), '</span>');
        if (object.id)
            html.push('<span class="selectorId">#', escapeHTML(object.id), '</span>');
        if (object.className)
            html.push('<span class="selectorClass">.', escapeHTML(object.className), '</span>');
    
        html.push('</span>');
    },
    
    appendNode: function(node, html)
    {
        if (node.nodeType == 1)
        {
            var uid = node[cacheID];
            var uidString = uid ? [cacheID, '="', uid, '" id="', uid, '"'].join("") : "";                
            
            html.push(
                '<div class="objectBox-element"', uidString, '">',
                    '&lt;<span class="nodeTag">', node.nodeName.toLowerCase(), '</span>');
    
            for (var i = 0; i < node.attributes.length; ++i)
            {
                var attr = node.attributes[i];
                if (!attr.specified)
                    continue;
                
                html.push('&nbsp;<span class="nodeName">', attr.nodeName.toLowerCase(),
                    '</span>=&quot;<span class="nodeValue">', escapeHTML(attr.nodeValue),
                    '</span>&quot;')
            }
    
            if (node.firstChild)
            {
                html.push('&gt;</div><div class="nodeChildren">');
    
                for (var child = node.firstChild; child; child = child.nextSibling)
                    appendNode(child, html);
                    
                html.push('</div><div class="objectBox-element">&lt;/<span class="nodeTag">', 
                    node.nodeName.toLowerCase(), '&gt;</span></div>');
            }
            else
                html.push('/&gt;</div>');
        }
        else if (node.nodeType == 3)
        {
            html.push('<div class="nodeText">', escapeHTML(node.nodeValue),
                '</div>');
        }
    },
    
    appendArray: function(object, html)
    {
        html.push('<span class="objectBox-array"><b>[</b> ');
        
        for (var i = 0, l = object.length, obj; i < l; ++i)
        {
            appendObject(object[i], html);
            
            if (i < l-1)
            html.push(', ');
        }
    
        html.push(' <b>]</b></span>');
    }

});



/*
From firebug


    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Reps

    registerRep: function()
    {
        reps.push.apply(reps, arguments);
    },

    setDefaultRep: function(rep)
    {
        defaultRep = rep;
    },


    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Reps

    getRep: function(object)
    {
        var type = typeof(object);
        for (var i = 0; i < reps.length; ++i)
        {
            var rep = reps[i];
            try
            {
                if (rep.supportsObject(object, type))
                    return rep;
            }
            catch (exc)
            {
                if (FBTrace.dumpProperties)
                {
                    FBTrace.dumpProperties("firebug.getRep FAILS at i/reps.length: "+i+"/"+reps.length+" type:"+type+" exc:", exc);
                    FBTrace.dumpProperties("firebug.getRep reps[i]", reps[i]);
                    FBTrace.dumpStack("firebug.getRep");
                }
            }
        }

        return defaultRep;
    },

    getRepObject: function(node)
    {
        var target = null;
        for (var child = node; child; child = child.parentNode)
        {
            if (hasClass(child, "repTarget"))
                target = child;

            if (child.repObject)
            {
                if (!target && hasClass(child, "repIgnore"))
                    break;
                else
                    return child.repObject;
            }
        }
    },

    getRepNode: function(node)
    {
        for (var child = node; child; child = child.parentNode)
        {
            if (child.repObject)
                return child;
        }
    },

    getElementByRepObject: function(element, object)
    {
        for (var child = element.firstChild; child; child = child.nextSibling)
        {
            if (child.repObject == object)
                return child;
        }
    },
/**/


// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************


// ************************************************************************************************
// Console

var ConsoleAPI = 
{
    firebug: FBL.version,

    log: function()
    {
        return logFormatted(arguments, "");
    },
    
    debug: function()
    {
        return logFormatted(arguments, "debug");
    },
    
    info: function()
    {
        return logFormatted(arguments, "info");
    },
    
    warn: function()
    {
        return logFormatted(arguments, "warning");
    },
    
    error: function()
    {
        return logFormatted(arguments, "error");
    },
    
    assert: function(truth, message)
    {
        if (!truth)
        {
            var args = [];
            for (var i = 1; i < arguments.length; ++i)
                args.push(arguments[i]);
            
            logFormatted(args.length ? args : ["Assertion Failure"], "error");
            throw message ? message : "Assertion Failure";
        }
        
        return Firebug.Console.LOG_COMMAND;        
    },
    
    dir: function(object)
    {
        var html = [];
                    
        var pairs = [];
        for (var name in object)
        {
            try
            {
                pairs.push([name, object[name]]);
            }
            catch (exc)
            {
            }
        }
        
        pairs.sort(function(a, b) { return a[0] < b[0] ? -1 : 1; });
        
        html.push('<div class="log-object">');
        for (var i = 0; i < pairs.length; ++i)
        {
            var name = pairs[i][0], value = pairs[i][1];
            
            html.push('<div class="property">', 
                '<div class="propertyValueCell"><span class="propertyValue">');
                
            appendObject(value, html);
            
            html.push('</span></div><div class="propertyNameCell"><span class="propertyName">',
                escapeHTML(name), '</span></div>'); 
            
            html.push('</div>');
        }
        html.push('</div>');
        
        return logRow(html, "dir");
    },
    
    dirxml: function(node)
    {
        var html = [];
        
        appendNode(node, html);
        return logRow(html, "dirxml");
    },
    
    group: function()
    {
        return logRow(arguments, "group", pushGroup);
    },
    
    groupEnd: function()
    {
        return logRow(arguments, "", popGroup);
    },
    
    time: function(name)
    {
        timeMap[name] = (new Date()).getTime();
        return Firebug.Console.LOG_COMMAND;
    },
    
    timeEnd: function(name)
    {
        if (name in timeMap)
        {
            var delta = (new Date()).getTime() - timeMap[name];
            logFormatted([name+ ":", delta+"ms"]);
            delete timeMap[name];
        }
        return Firebug.Console.LOG_COMMAND;
    },
    
    count: function()
    {
        return this.warn(["count() not supported."]);
    },
    
    trace: function()
    {
        return this.warn(["trace() not supported."]);
    },
    
    profile: function()
    {
        return this.warn(["profile() not supported."]);
    },
    
    profileEnd: function()
    {
        return Firebug.Console.LOG_COMMAND;
    },
    
    clear: function()
    {
        fbConsole.innerHTML = "";
        return Firebug.Console.LOG_COMMAND;
    },

    open: function()
    {
        toggleConsole(true);
        return Firebug.Console.LOG_COMMAND;
    },
    
    close: function()
    {
        if (frameVisible)
            toggleConsole();
        return Firebug.Console.LOG_COMMAND;
    }
};


// ************************************************************************************************
// Console Module

var ConsoleModule = extend(Firebug.Module, ConsoleAPI);

Firebug.Console = extend(ConsoleModule,
{

    LOG_COMMAND: {},

    initialize: function(){
        fbConsole = $("fbConsole");
        fbPanel1 =  $("fbPanel1");
    },
    
    shutdown: function()
    {
        fbConsole = null;
        fbPanel1 =  null;
    },
    
    returnDir: function(object)
    {
        var html = [];
                    
        var pairs = [];
        for (var name in object)
        {
            try
            {
                pairs.push([name, object[name]]);
            }
            catch (exc)
            {
            }
        }
        
        pairs.sort(function(a, b) { return a[0] < b[0] ? -1 : 1; });
        
        html.push('<table>');
        for (var i = 0; i < pairs.length; ++i)
        {
            var name = pairs[i][0], value = pairs[i][1];
            
            html.push('<tr>', 
            '<td class="propertyNameCell"><span class="propertyName">',
                escapeHTML(name), '</span></td>', '<td><span class="propertyValue">');
                
            appendObject(value, html);
            html.push('</span></td></tr>');
        }
        html.push('</table>');
        
        return html;
    }
});

Firebug.registerModule(Firebug.Console);


// ************************************************************************************************
// Console Panel

function ConsolePanel(){};

ConsolePanel.prototype = extend(Firebug.Panel,
{
    name: "Console",
    title: "Console",
    
    options: {
        hasCommandLine: true,
        hasToolButtons: true,
        isPreRendered: true
    },
    
    initialize: function(){
        Firebug.Panel.initialize.apply(this, arguments);
        
        fbConsole = $("fbConsole");
        fbPanel1 =  $("fbPanel1");  
    },
    
    shutdown: function()
    {
        fbConsole = null;
        fbPanel1 =  null;
    }
    
});

Firebug.registerPanel(ConsolePanel);

// ********************************************************************************************

var fbConsole = null;
var fbPanel1 = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

Firebug.cache.messageQueue = [];
var groupStack = [];
var timeMap = {};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *



// ********************************************************************************************

FBL.logRow = function(message, className, handler)
{
    if (fbConsole)
        writeMessage(message, className, handler);
    else
    {
        Firebug.cache.messageQueue.push([message, className, handler]);
    }
    
    return Firebug.Console.LOG_COMMAND;
};

FBL.flush = function()
{
    var queue = Firebug.cache.messageQueue;
    Firebug.cache.messageQueue = [];
    
    for (var i = 0; i < queue.length; ++i)
        writeMessage(queue[i][0], queue[i][1], queue[i][2]);
};

FBL.writeMessage = function(message, className, handler)
{
    var isScrolledToBottom =
        fbPanel1.scrollTop + fbPanel1.offsetHeight >= fbPanel1.scrollHeight;

    if (!handler)
        handler = writeRow;
    
    handler(message, className);
    
    if (isScrolledToBottom)
        fbPanel1.scrollTop = fbPanel1.scrollHeight - fbPanel1.offsetHeight;
};

FBL.appendRow = function(row)
{
    var container = groupStack.length ? groupStack[groupStack.length-1] : fbConsole;
    container.appendChild(row);
};

FBL.writeRow = function(message, className)
{
    var row = fbConsole.ownerDocument.createElement("div");
    row.className = "logRow" + (className ? " logRow-"+className : "");
    row.innerHTML = message.join("");
    appendRow(row);
};

FBL.pushGroup = function(message, className)
{
    logFormatted(message, className);

    var groupRow = fbConsole.ownerDocument.createElement("div");
    groupRow.className = "logGroup";
    var groupRowBox = fbConsole.ownerDocument.createElement("div");
    groupRowBox.className = "logGroupBox";
    groupRow.appendChild(groupRowBox);
    appendRow(groupRowBox);
    groupStack.push(groupRowBox);
};

FBL.popGroup = function()
{
    groupStack.pop();
};

// ********************************************************************************************

FBL.logFormatted = function(objects, className)
{
    var html = [];

    var format = objects[0];
    var objIndex = 0;

    if (typeof(format) != "string")
    {
        format = "";
        objIndex = -1;
    }

    var parts = parseFormat(format);
    for (var i = 0; i < parts.length; ++i)
    {
        var part = parts[i];
        if (part && typeof(part) == "object")
        {
            var object = objects[++objIndex];
            part.appender(object, html);
        }
        else
            appendText(part, html);
    }

    for (var i = objIndex+1; i < objects.length; ++i)
    {
        appendText(" ", html);
        
        var object = objects[i];
        if (typeof(object) == "string")
            appendText(object, html);
        else
            appendObject(object, html);
    }
    
    return logRow(html, className);    
};

FBL.parseFormat = function(format)
{
    var parts = [];

    var reg = /((^%|[^\\]%)(\d+)?(\.)([a-zA-Z]))|((^%|[^\\]%)([a-zA-Z]))/;    
    var appenderMap = {s: appendText, d: appendInteger, i: appendInteger, f: appendFloat};

    for (var m = reg.exec(format); m; m = reg.exec(format))
    {
        var type = m[8] ? m[8] : m[5];
        var appender = type in appenderMap ? appenderMap[type] : appendObject;
        var precision = m[3] ? parseInt(m[3]) : (m[4] == "." ? -1 : 0);

        parts.push(format.substr(0, m[0][0] == "%" ? m.index : m.index+1));
        parts.push({appender: appender, precision: precision});

        format = format.substr(m.index+m[0].length);
    }

    parts.push(format);

    return parts;
};

FBL.objectToString = function(object)
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

// ********************************************************************************************
FBL.onError = function(msg, href, lineNo)
{
    var html = [];
    
    var lastSlash = href.lastIndexOf("/");
    var fileName = lastSlash == -1 ? href : href.substr(lastSlash+1);
    
    html.push(
        '<span class="errorMessage">', msg, '</span>', 
        '<div class="objectBox-sourceLink">', fileName, ' (line ', lineNo, ')</div>'
    );
    
    logRow(html, "error");
};


// ********************************************************************************************
// Register console API

var alternateNS = "FB";
var consoleNS = "console";
var namespace = isFirefox ? alternateNS : consoleNS;
application.global[namespace] = ConsoleAPI;


// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************


// ************************************************************************************************
// Context
  
FBL.Context = function(win){
    this.window = win.window;
    this.document = win.document;
    
    // Some windows in IE, like iframe, doesn't have the eval() method
    if (isIE && !this.window.eval)
    {
        // But after executing the following line the method magically appears!
        this.window.execScript("null");
        // Just to make sure the "magic" really happened
        if (!this.window.eval)
            throw new Error("Firebug Error: eval() method not found in this window");
    }
    
    // Create a new "black-box" eval() method that runs in the global namespace
    // of the context window, without exposing the local variables declared
    // by the function that calls it
    this.eval = this.window.eval("new Function('" +
            "try{ return window.eval.apply(window,arguments) }catch(E){ E."+evalError+"=true; return E }" +
        "')");
};

FBL.Context.prototype =
{  
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Evalutation Method
    
    /**
     * Evaluates an expression in the current context window.
     * 
     * @param {String}   expr           expression to be evaluated
     * 
     * @param {String}   context        string indicating the global location
     *                                  of the object that will be used as the
     *                                  context. The context is referred in
     *                                  the expression as the "this" keyword.
     *                                  If no context is informed, the "window"
     *                                  context is used.
     *                                  
     * @param {String}   api            string indicating the global location
     *                                  of the object that will be used as the
     *                                  api of the evaluation.
     *                                  
     * @param {Function} errorHandler(message) error handler to be called
     *                                         if the evaluation fails.
     */
    evaluate: function(expr, context, api, errorHandler)
    {
        context = context || "window";

        var cmd = api ?
            "(function(arguments){ with("+api+"){ return "+expr+" } }).call("+context+",undefined)" :
            "(function(arguments){ return "+expr+" }).call("+context+",undefined)" ;
        
        var r = this.eval(cmd);
        if (r && r[evalError])
        {
            cmd = api ?
                "(function(arguments){ with("+api+"){ "+expr+" } }).call("+context+",undefined)" :
                "(function(arguments){ "+expr+" }).call("+context+",undefined)" ;
                
            r = this.eval(cmd);
            if (r && r[evalError])
            {
                if (errorHandler)
                    r = errorHandler(r.message || r)
                else
                    r = r.message || r;
            }
        }
        
        return r;
    },
    

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Window Methods
    
    getWindowSize: function()
    {
        var width=0, height=0, el;
        
        if (typeof this.window.innerWidth == "number")
        {
            width = this.window.innerWidth;
            height = this.window.innerHeight;
        }
        else if ((el=this.document.documentElement) && (el.clientHeight || el.clientWidth))
        {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        else if ((el=this.document.body) && (el.clientHeight || el.clientWidth))
        {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        
        return {width: width, height: height};
    },
    
    getWindowScrollSize: function()
    {
        var width=0, height=0, el;

        if (!isIEQuiksMode && (el=this.document.documentElement) && 
           (el.scrollHeight || el.scrollWidth))
        {
            width = el.scrollWidth;
            height = el.scrollHeight;
        }
        else if ((el=this.document.body) && (el.scrollHeight || el.scrollWidth))
        {
            width = el.scrollWidth;
            height = el.scrollHeight;
        }
        
        return {width: width, height: height};
    },
    
    getWindowScrollPosition: function()
    {
        var top=0, left=0, el;
        
        if(typeof this.window.pageYOffset == "number")
        {
            top = this.window.pageYOffset;
            left = this.window.pageXOffset;
        }
        else if((el=this.document.body) && (el.scrollTop || el.scrollLeft))
        {
            top = el.scrollTop;
            left = el.scrollLeft;
        }
        else if((el=this.document.documentElement) && (el.scrollTop || el.scrollLeft))
        {
            top = el.scrollTop;
            left = el.scrollLeft;
        }
        
        return {top:top, left:left};
    },
    

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Element Methods

    getElementFromPoint: function(x, y)
    {
        if (isOpera || isSafari)
        {
            var scroll = this.getWindowScrollPosition();
            return this.document.elementFromPoint(x + scroll.left, y + scroll.top);
        }
        else
            return this.document.elementFromPoint(x, y);
    },
    
    getElementPosition: function(el)
    {
        var left = 0
        var top = 0;
        
        if (el.offsetParent)
        {
            do
            {
                left += el.offsetLeft;
                top += el.offsetTop;
            }
            while (el = el.offsetParent);
        }
        return {left:left, top:top};      
    },
    
    getElementBox: function(el)
    {
        var result = {};
        
        if (el.getBoundingClientRect)
        {
            var rect = el.getBoundingClientRect();
            
            // fix IE problem with offset when not in fullscreen mode
            var offset = isIE ? this.document.body.clientTop || this.document.documentElement.clientTop: 0;
            
            var scroll = this.getWindowScrollPosition();
            
            result.top = Math.round(rect.top - offset + scroll.top);
            result.left = Math.round(rect.left - offset + scroll.left);
            result.height = Math.round(rect.bottom - rect.top);
            result.width = Math.round(rect.right - rect.left);
        }
        else 
        {
            var position = this.getElementPosition(el);
            
            result.top = position.top;
            result.left = position.left;
            result.height = el.offsetHeight;
            result.width = el.offsetWidth;
        }
        
        return result;
    },
    

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Measurement Methods
    
    getMeasurement: function(el, name)
    {
        var result = {value: 0, unit: "px"};
        
        var cssValue = this.getCSS(el, name);
        if (!cssValue) return result;
        if (cssValue.toLowerCase() == "auto") return result;
        
        var reMeasure = /(\d+\.?\d*)(.*)/;
        var m = cssValue.match(reMeasure);
        
        if (m)
        {
            result.value = m[1]-0;
            result.unit = m[2].toLowerCase();
        }
        
        return result;        
    },
    
    getMeasurementInPixels: function(el, name)
    {
        if (!el) return null;
        
        var m = this.getMeasurement(el, name);
        var value = m.value;
        var unit = m.unit;
        
        if (unit == "px")
            return value;
          
        else if (unit == "pt")
            return this.pointsToPixels(name, value);
          
        if (unit == "em")
            return this.emToPixels(el, value);
          
        else if (unit == "%")
            return this.percentToPixels(el, value);
    },

    getMeasurementBox: function(el, name)
    {
        var sufixes = ["Top", "Left", "Bottom", "Right"];
        var result = [];
        
        for(var i=0, sufix; sufix=sufixes[i]; i++)
            result[i] = Math.round(this.getMeasurementInPixels(el, name + sufix));
        
        return {top:result[0], left:result[1], bottom:result[2], right:result[3]};
    }, 
    
    getFontSizeInPixels: function(el)
    {
        var size = this.getMeasurement(el, "fontSize");
        
        if (size.unit == "px") return size.value;
        
        // get font size, the dirty way
        var computeDirtyFontSize = function(el, calibration)
        {
            var div = this.document.createElement("div");
            var divStyle = offscreenStyle;

            if (calibration)
                divStyle +=  " font-size:"+calibration+"px;";
            
            div.style.cssText = divStyle;
            div.innerHTML = "A";
            el.appendChild(div);
            
            var value = div.offsetHeight;
            el.removeChild(div);
            return value;
        }
        
        // Calibration fails in some environments, so we're using a static value
        // based in the test case result.
        var rate = 200 / 225;
        //var calibrationBase = 200;
        //var calibrationValue = computeDirtyFontSize(el, calibrationBase);
        //var rate = calibrationBase / calibrationValue;
        
        var value = computeDirtyFontSize(el);

        return value * rate;
    },
    
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Unit Funtions
  
    pointsToPixels: function(name, value)
    {
        var axis = /Top$|Bottom$/.test(name) ? "y" : "x";
        
        var result = value * pixelsPerInch[axis] / 72;
        
        return returnFloat ? result : Math.round(result);
    },
    
    emToPixels: function(el, value)
    {
        if (!el) return null;
        
        var fontSize = this.getFontSizeInPixels(el);
        
        return Math.round(value * fontSize);
    },
    
    exToPixels: function(el, value)
    {
        if (!el) return null;
        
        // get ex value, the dirty way
        var div = this.document.createElement("div");
        div.style.cssText = offscreenStyle + "width:"+value + "ex;";
        
        el.appendChild(div);
        var value = div.offsetWidth;
        el.removeChild(div);
        
        return value;
    },
      
    percentToPixels: function(el, value)
    {
        if (!el) return null;
        
        // get % value, the dirty way
        var div = this.document.createElement("div");
        div.style.cssText = offscreenStyle + "width:"+value + "%;";
        
        el.appendChild(div);
        var value = div.offsetWidth;
        el.removeChild(div);
        
        return value;
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    getCSS: this.isIE ? function(el, name)
    {
        return el.currentStyle[name] || el.style[name] || undefined;
    }
    : function(el, name)
    {
        return this.document.defaultView.getComputedStyle(el,null)[name] 
            || el.style[name] || undefined;
    }

};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Internal variables

var evalError = "___firebug_evaluation_error___";
var pixelsPerInch;

// ************************************************************************************************
// Measurement Functions

var calculatePixelsPerInch = function calculatePixelsPerInch()
{
    var inch = this.document.createElement("div");
    inch.style.cssText = resetStyle + "width:1in; height:1in; position:absolute; top:-1234px; left:-1234px;";
    this.document.body.appendChild(inch);
    
    pixelsPerInch = {
        x: inch.offsetWidth,
        y: inch.offsetHeight
    };
    
    this.document.body.removeChild(inch);
};


// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************


// ************************************************************************************************
// Chrome Window Options

var ChromeDefaultOptions = 
{
    type: "frame",
    id: "FirebugChrome",
    height: 250
};

// ************************************************************************************************
// Chrome Window Creation

FBL.createChrome = function(context, options, onChromeLoad)
{
    options = options || {};
    options = extend(ChromeDefaultOptions, options);
    
    var chrome = {};
    
    chrome.type = options.type;
    
    var isChromeFrame = chrome.type == "frame";
    var isBookmarletMode = application.isBookmarletMode;
    var url = isBookmarletMode ? "" : application.location.skin;
    
    if (isChromeFrame)
    {
        // Create the Chrome Frame
        var node = chrome.node = context.document.createElement("iframe");
        
        node.setAttribute("id", options.id);
        node.setAttribute("frameBorder", "0");
        node.setAttribute("allowTransparency", "true");
        node.style.border = "0";
        node.style.visibility = "hidden";
        node.style.zIndex = "2147483647"; // MAX z-index = 2147483647
        node.style.position = isIE6 ? "absolute" : "fixed";
        node.style.width = "100%"; // "102%"; IE auto margin bug
        node.style.left = "0";
        node.style.bottom = isIE6 ? "-1px" : "0";
        node.style.height = options.height + "px";
        
        var isBookmarletMode = application.isBookmarletMode;
        if (!isBookmarletMode)
            node.setAttribute("src", application.location.skin);
        
        context.document.body.appendChild(node);
    }
    else
    {
        // Create the Chrome Popup
        var height = options.height;
        var options = [
                "true,top=",
                Math.max(screen.height - height, 0),
                ",left=0,height=",
                height,
                ",width=",
                screen.width-10, // Opera opens popup in a new tab if it's too big!
                ",resizable"          
            ].join("");
        
        var node = chrome.node = Firebug.browser.window.open(
            url, 
            "popup", 
            options
          );
    }
    
    if (isBookmarletMode)
    {
        var tpl = getChromeTemplate();
        var doc = isChromeFrame ? node.contentWindow.document : node.document;
        doc.write(tpl);
        doc.close();
    }
    
    var win;
    var waitForChrome = function()
    {
        if ( // Frame loaded... OR
             isChromeFrame && (win=node.contentWindow) &&
             node.contentWindow.document.getElementById("fbCommandLine") ||
             
             // Popup loaded
             !isChromeFrame && (win=node.window) && node.document &&
             node.document.getElementById("fbCommandLine") )
        {
            chrome.window = win.window;
            chrome.document = win.document;
            
            if (onChromeLoad)
                onChromeLoad(chrome);
        }
        else
            setTimeout(waitForChrome, 20);
    }
    
    waitForChrome();    
};

var getChromeTemplate = function()
{
    var tpl = FirebugChrome.injected; 
    var r = [], i = -1;
    
    r[++i] = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/DTD/strict.dtd">';
    r[++i] = '<head><style>';
    r[++i] = tpl.CSS;
    r[++i] = (isIE6 && tpl.IE6CSS) ? tpl.IE6CSS : '';
    r[++i] = '</style>';
    r[++i] = '</head><body>';
    r[++i] = tpl.HTML;
    r[++i] = '</body>';
    
    return r.join("");
};

// ************************************************************************************************
// FirebugChrome Class
    
FBL.FirebugChrome = function(chrome)
{
    var Base = chrome.type == "frame" ? ChromeFrameBase : ChromePopupBase; 
    
    append(this, chrome); // inherit chrome window properties
    append(this, Base);   // inherit chrome class properties (ChromeFrameBase or ChromePopupBase)
    
    return this;
};

// ************************************************************************************************
// ChromeBase

var ChromeBase = extend(Firebug.Controller, Firebug.PanelBar);
var ChromeBase = extend(ChromeBase, {
    
    destroy: function()
    {
        this.shutdown();
    },
    
    initialize: function()
    {
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // create the interface elements cache
        
        fbTop = $("fbTop");
        fbContent = $("fbContent");
        fbContentStyle = fbContent.style;
        fbBottom = $("fbBottom");
        fbBtnInspect = $("fbBtnInspect");
        
        fbToolbar = $("fbToolbar");
      
        fbPanelBox1 = $("fbPanelBox1");
        fbPanelBox1Style = fbPanelBox1.style;
        fbPanelBox2 = $("fbPanelBox2");
        fbPanelBox2Style = fbPanelBox2.style;
        fbPanelBar2Box = $("fbPanelBar2Box");
        fbPanelBar2BoxStyle = fbPanelBar2Box.style;
      
        fbHSplitter = $("fbHSplitter");
        fbVSplitter = $("fbVSplitter");
        fbVSplitterStyle = fbVSplitter.style;
      
        fbPanel1 = $("fbPanel1");
        fbPanel1Style = fbPanel1.style;
        fbPanel2 = $("fbPanel2");
      
        fbConsole = $("fbConsole");
        fbConsoleStyle = fbConsole.style;
        fbHTML = $("fbHTML");
      
        fbCommandLine = $("fbCommandLine");
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // static values cache
        
        topHeight = fbTop.offsetHeight;
        topPartialHeight = fbToolbar.offsetHeight;
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        
        commandLineVisible = true;
        sidePanelVisible = false;
        sidePanelWidth = 300;
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // initialize inherited classes
        Firebug.Controller.initialize.call(this);
        Firebug.PanelBar.initialize.call(this);
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // create a new instance of the CommandLine class
        commandLine = new Firebug.CommandLine(fbCommandLine);
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // initialize all panels
        var panels = Firebug.panelTypes;
        for (var i=0, p; p=panels[i]; i++)
        {
            if (!p.parentPanel)
            {
                this.addPanel(p.prototype.name);
            }
        }
        
        // Select the first registered panel
        this.selectPanel(panels[0].prototype.name);
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Remove the "javascript:void(0)" href attributes used to make the hover effect in IE6
        if (!isIE6)
        {
           var as = $$("a");
           for (var i=0, a; a=as[i]; i++)
           {
               if (a.href == "javascript:void(0)")
               {
                   a.removeAttribute("href");
               }
           }
        }
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        flush();
        
        if (!isSafari)
            this.draw();
        
    },
    
    shutdown: function()
    {
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Remove the interface elements cache
        
        fbTop = null;
        fbContent = null;
        fbContentStyle = null;
        fbBottom = null;
        fbBtnInspect = null;
        
        fbToolbar = null;

        fbPanelBox1 = null;
        fbPanelBox1Style = null;
        fbPanelBox2 = null;
        fbPanelBox2Style = null;
        fbPanelBar2Box = null;
        fbPanelBar2BoxStyle = null;
  
        fbHSplitter = null;
        fbVSplitter = null;
        fbVSplitterStyle = null;
  
        fbPanel1 = null;
        fbPanel1Style = null;
        fbPanel2 = null;
  
        fbConsole = null;
        fbConsoleStyle = null;
        fbHTML = null;
  
        fbCommandLine = null;
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // static values cache
        
        topHeight = null;
        topPartialHeight = null;
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        
        commandLineVisible = null;
        sidePanelVisible = null;
        sidePanelWidth = 300;
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // shutdown inherited classes
        Firebug.Controller.shutdown.call(this);
        Firebug.PanelBar.shutdown.call(this);
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

        // destroy the instance of the CommandLine class
        commandLine.destroy();
        
        // shutdown the chrome instance
        Firebug.chrome.shutdown();
    },
    
    
    draw: function()
    {
        var size = Firebug.chrome.getWindowSize();
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Height related drawings
        var chromeHeight = size.height;
        var commandLineHeight = commandLineVisible ? fbCommandLine.offsetHeight : 0;
        var fixedHeight = topHeight + commandLineHeight;
        var y = Math.max(chromeHeight, topHeight);
        
        //fbContentStyle.height = Math.max(y - fixedHeight, 0)+ "px";
        fbPanel1Style.height = Math.max(y - fixedHeight, 0)+ "px";
        fbPanelBox1.height = Math.max(y - fixedHeight, 0)+ "px";
        
        if (isIE || isOpera)
        {
            // Fix IE and Opera problems with auto resizing the verticall splitter
            fbVSplitterStyle.height = Math.max(y - topPartialHeight - commandLineHeight, 0) + "px";
        }
        else if (isFirefox)
        {
            // Fix Firefox problem with table rows with 100% height (fit height)
            fbContentStyle.maxHeight = Math.max(y - fixedHeight, 0)+ "px";
        }
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Width related drawings
        var chromeWidth = size.width /* window borders */;
        var sideWidth = sidePanelVisible ? sidePanelWidth : 0;
        
        fbPanelBox1Style.width = Math.max(chromeWidth - sideWidth, 0) + "px";
        fbPanel1Style.width = Math.max(chromeWidth - sideWidth, 0) + "px";                
        
        if (sidePanelVisible)
        {
            fbPanelBox2Style.width = sideWidth + "px";
            fbPanelBar2BoxStyle.width = Math.max(sideWidth, 0) + "px";
            fbVSplitterStyle.right = Math.max(sideWidth - 6, 0) + "px";
        }
    },
    
    layout: function(options)
    {
        changeCommandLineVisibility(options.hasCommandLine);
        changeSidePanelVisibility(options.hasSidePanel);
    }
    
});

// ************************************************************************************************
// ChromeFrameBase

var ChromeContext = extend(ChromeBase, Context.prototype); 

var ChromeFrameBase = extend(ChromeContext, {
    
    initialize: function()
    {
        ChromeBase.initialize.call(this)
        
        this.addController(
                [Firebug.browser.window, "resize", this.draw],
                [Firebug.browser.window, "unload", this.destroy]
            );
        
        if (isIE6)
        {
            this.addController(
                    [Firebug.browser.window, "resize", this.fixPosition],
                    [Firebug.browser.window, "scroll", this.fixPosition]
                );
        }
        
        fbVSplitter.onmousedown = onVSplitterMouseDown;
        fbHSplitter.onmousedown = onHSplitterMouseDown;
        
        /*        
        toggleCommandLine();
        toggleRightPanel();
        /**/
        
        // TODO: Check visibility preferences here
        this.node.style.visibility = "visible";
        
        this.draw();
    },
    
    show: function()
    {
        
    },
    
    hide: function()
    {
        var chrome = Firebug.chrome;
        var node = chrome.node;
        node.style.height = "27px";
        node.style.width = "100px";
        node.style.left = "";        
        node.style.right = 0;

        if (isIE6)
            chrome.fixPosition();
        
        var main = $("fbChrome");
        main.style.display = "none";

        chrome.document.body.style.backgroundColor = "transparent";
        
        var mini = $("fbMiniChrome");
        mini.style.display = "block";
    },
    
    shutdown: function()
    {
        Firebug.Controller.shutdown.apply(this);
    },
    
    fixPosition: function()
    {
        // fix IE problem with offset when not in fullscreen mode
        var offset = isIE ? this.document.body.clientTop || this.document.documentElement.clientTop: 0;
        
        var size = Firebug.Inspector.getWindowSize();
        var scroll = Firebug.Inspector.getWindowScrollPosition();
        var maxHeight = size.height;
        var height = Firebug.chrome.node.offsetHeight;
        
        Firebug.chrome.node.style.top = maxHeight - height + scroll.top + "px";
    }

});


// ************************************************************************************************
// ChromePopupBase

var ChromePopupBase = extend(ChromeContext, {
    
    initialize: function()
    {
        ChromeBase.initialize.call(this)
        
        this.addController(
                [Firebug.browser.window, "resize", this.draw],
                [Firebug.browser.window, "unload", this.destroy]
            );
    },
    
    shutdown: function()
    {
        Firebug.Controller.shutdown.apply(this);
    }

});


// ************************************************************************************************
// Internals


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
var commandLine = null;


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Interface Elements Cache

var fbTop = null;
var fbContent = null;
var fbContentStyle = null;
var fbBottom = null;
var fbBtnInspect = null;

var fbToolbar = null;

var fbPanelBox1 = null;
var fbPanelBox1Style = null;
var fbPanelBox2 = null;
var fbPanelBox2Style = null;
var fbPanelBar2Box = null;
var fbPanelBar2BoxStyle = null;

var fbHSplitter = null;
var fbVSplitter = null;
var fbVSplitterStyle = null;

var fbPanel1 = null;
var fbPanel1Style = null;
var fbPanel2 = null;

var fbConsole = null;
var fbConsoleStyle = null;
var fbHTML = null;

var fbCommandLine = null;

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var topHeight = null;
var topPartialHeight = null;

var commandLineVisible = true;
var sidePanelVisible = false;
var sidePanelWidth = 300;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var chromeRedrawSkipRate = isIE ? 30 : isOpera ? 50 : 25;


//************************************************************************************************
// UI helpers

var changeCommandLineVisibility = function changeCommandLineVisibility(visibility)
{
    var last = commandLineVisible;
    commandLineVisible = typeof visibility == "boolean" ? visibility : !commandLineVisible;
    
    if (commandLineVisible != last)
    {
        fbBottom.className = commandLineVisible ? "" : "hide";
    }
};

var changeSidePanelVisibility = function changeSidePanelVisibility(visibility)
{
    var last = sidePanelVisible;
    sidePanelVisible = typeof visibility == "boolean" ? visibility : !sidePanelVisible;
    
    if (sidePanelVisible != last)
    {
        fbPanelBox2.className = sidePanelVisible ? "" : "hide"; 
        fbPanelBar2Box.className = sidePanelVisible ? "" : "hide";
    }
};


// ************************************************************************************************
// Horizontal Splitter Handling

var onHSplitterMouseDown = function onHSplitterMouseDown(event)
{
    addGlobalEvent("mousemove", onHSplitterMouseMove);
    addGlobalEvent("mouseup", onHSplitterMouseUp);
    
    fbHSplitter.className = "fbOnMovingHSplitter";
    
    return false;
};

var lastHSplitterMouseMove = 0;

var onHSplitterMouseMove = function onHSplitterMouseMove(event)
{
    cancelEvent(event, true);
    
    if (new Date().getTime() - lastHSplitterMouseMove > chromeRedrawSkipRate)
    {
        var clientY = event.clientY;
        var win = document.all
            ? event.srcElement.ownerDocument.parentWindow
            : event.target.ownerDocument && event.target.ownerDocument.defaultView;
      
        if (!win)
            return;
        
        if (win != win.parent)
            clientY += win.frameElement ? win.frameElement.offsetTop : 0;

        var size = Firebug.browser.getWindowSize();
        var chrome = Firebug.chrome.node;
        var height = (isIE && win == top) ? size.height : chrome.offsetTop + chrome.clientHeight; 
        
        var commandLineHeight = commandLineVisible ? fbCommandLine.offsetHeight : 0;
        var fixedHeight = topHeight + commandLineHeight + 1;
        var y = Math.max(height - clientY + 7, fixedHeight);
            y = Math.min(y, size.height);
          
        chrome.style.height = y + "px";
        
        if (isIE6)
          Firebug.chrome.fixPosition();
        
        Firebug.chrome.draw();
        
        lastHSplitterMouseMove = new Date().getTime();
    }
    
    return false;
};

var onHSplitterMouseUp = function onHSplitterMouseUp(event)
{
    removeGlobalEvent("mousemove", onHSplitterMouseMove);
    removeGlobalEvent("mouseup", onHSplitterMouseUp);
    
    fbHSplitter.className = "";
    
    Firebug.chrome.draw();
};


// ************************************************************************************************
// Vertical Splitter Handling

var onVSplitterMouseDown = function onVSplitterMouseDown(event)
{
    addGlobalEvent("mousemove", onVSplitterMouseMove);
    addGlobalEvent("mouseup", onVSplitterMouseUp);
    
    return false;
};

var lastVSplitterMouseMove = 0;

var onVSplitterMouseMove = function onVSplitterMouseMove(event)
{
    if (new Date().getTime() - lastVSplitterMouseMove > chromeRedrawSkipRate)
    {
        var clientX = event.clientX;
        var win = document.all
            ? event.srcElement.ownerDocument.parentWindow
            : event.target.ownerDocument.defaultView;
      
        if (win != win.parent)
            clientX += win.frameElement ? win.frameElement.offsetLeft : 0;
        
        var size = Firebug.chrome.getWindowSize();
        var x = Math.max(size.width - clientX + 3, 6);
        
        sidePanelWidth = x;
        Firebug.chrome.draw();
        
        lastVSplitterMouseMove = new Date().getTime();
    }
    
    cancelEvent(event, true);
    return false;
};

var onVSplitterMouseUp = function onVSplitterMouseUp(event)
{
    removeGlobalEvent("mousemove", onVSplitterMouseMove);
    removeGlobalEvent("mouseup", onVSplitterMouseUp);
    
    Firebug.chrome.draw();
};


// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

//----------------------------------------------------------------------------
// Injected Chrome
//----------------------------------------------------------------------------
FirebugChrome.injected = 
{
    CSS: '.fbBtnInspectActive{background:#aaa;color:#fff !important;}html,body{margin:0;padding:0;overflow:hidden;background:#fff;font-family:Lucida Grande,Tahoma,sans-serif;font-size:11px;}.clear{clear:both;}#fbChrome{position:fixed;overflow:hidden;height:100%;width:100%;border-collapse:collapse;background:#fff;}#fbTop{height:50px;}#fbToolbar{position:absolute;z-index:5;width:100%;top:0;background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) #d4d0c8 0 0;height:28px;font-size:11px;}#fbPanelBarBox{top:28px;position:absolute;z-index:8;width:100%;background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) #c5c1ba 0 -28px;height:22px;}#fbContent{height:100%;vertical-align:top;}#fbBottom{height:18px;background:#fff;}#fbToolbarIcon{float:left;padding:6px 5px 0;}#fbToolbarIcon a{display:block;height:20px;width:20px;background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) 0 -135px;text-decoration:none;cursor:default;}#fbToolbarButtons{float:left;padding:6px 2px 0 5px;}#fbToolbarButtons span{margin:0;padding:0;}#fbToolbarButtons a{text-decoration:none;display:block;float:left;color:#000;padding:4px 8px 4px;cursor:default;}#fbToolbarButtons a:hover{color:#333;padding:3px 7px 3px;border:1px solid #fff;border-bottom:1px solid #bbb;border-right:1px solid #bbb;}#fbStatusBarBox{float:left;padding:10px 0 0;}.fbToolbarSeparator{overflow:hidden;border:1px solid;border-color:transparent #fff transparent #777;_border-color:#d4d0c8 #fff #d4d0c8 #777;height:7px;margin:2px 6px 0 0;float:left;}.fbStatusBar span{color:#808080;cursor:default;padding:0 4px 0 0;}.fbStatusBar span a{text-decoration:none;color:black;cursor:default;}.fbStatusBar span a:hover{color:blue;cursor:pointer;}#mainButtons{position:absolute;right:4px;top:8px;z-index:11;}#fbPanelBar1{width:255px; z-index:8;left:0;white-space:nowrap;background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) #c5c1ba 0 -28px;position:absolute;left:4px;}#fbPanelBar2Box{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) #c5c1ba 0 -28px;position:absolute;height:22px;width:300px; z-index:9;right:0;}#fbPanelBar2{position:absolute;width:290px; height:22px;padding-left:10px;}#fbPanelBox1,#fbPanelBox2{max-height:inherit;height:100%;font-size:11px;}#fbPanelBox2{background:#fff;}#fbPanelBox2{width:300px;background:#fff;}* html #fbPanel1{position:absolute;}#fbPanel2{padding-left:6px;background:#fff;}.hide{overflow:hidden !important;position:fixed !important;display:none !important;visibility:hidden !important;}#fbCommand{height:18px;}#fbCommandBox{position:absolute;width:100%;height:18px;bottom:0;overflow:hidden;z-index:9;background:#fff;border:0;border-top:1px solid #ccc;}#fbCommandIcon{position:absolute;color:#00f;top:2px;left:7px;display:inline;font:11px Monaco,monospace;z-index:10;}#fbCommandLine{position:absolute;width:100%;top:0;left:0;border:0;margin:0;padding:2px 0 2px 32px;font:11px Monaco,monospace;z-index:9;}#fbBottom[fixFirefox]{position:fixed;bottom:0;left:0;width:100%;z-index:10;}#fbBottom[fixFirefox] #fbCommand{display:block;}div.fbFitHeight{padding:0 1px;max-height:inherit;height:100%;overflow:auto;}#mainButtons a{font-size:1px;width:16px;height:16px;display:block;float:left;text-decoration:none;cursor:default;}#close{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) 0 -119px;}#close:hover{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) -16px -119px;}#detach{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) -32px -119px;}#detach:hover{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) -48px -119px;}.tab{text-decoration:none;display:block;float:left;width:auto;float:left;cursor:default;font-family:Lucida Grande,Tahoma,sans-serif;font-size:11px;font-weight:bold;height:22px;color:#565656;}.fbPanelBar span{display:block;float:left;}.fbPanelBar .tabL,.fbPanelBar .tabR{height:22px;width:8px;}.fbPanelBar .tabText{padding:4px 1px 0;}.tab:hover{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) 0 -73px;}.tab:hover .tabL{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) -16px -96px;}.tab:hover .tabR{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) -24px -96px;}.selectedTab{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) #d4d0c8 0 -50px !important;color:#000;}.selectedTab .tabL{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) 0 -96px !important;}.selectedTab .tabR{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) -8px -96px !important;}#fbHSplitter{position:absolute;left:0;top:0;width:100%;height:5px;overflow:hidden;cursor:n-resize !important;background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/pixel_transparent.gif);z-index:9;}.fbVSplitter{background:#eee;color:#000;border:1px solid #777;border-width:0 1px;width:4px;cursor:e-resize;overflow:hidden;right:294px;text-decoration:none;z-index:9;position:absolute;height:100%;top:28px;}div.lineNo{font:11px Monaco,monospace;float:left;display:inline;position:relative;margin:0;padding:0 5px 0 20px;background:#eee;color:#888;border-right:1px solid #ccc;text-align:right;}pre.nodeCode{font:11px Monaco,monospace;margin:0;padding-left:10px;overflow:hidden;}.nodeControl{margin-top:3px;margin-left:-14px;float:left;width:9px;height:9px;overflow:hidden;cursor:default;background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/tree_open.gif);}div.nodeMaximized{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/tree_close.gif);}div.objectBox-element{padding:1px 3px;}.objectBox-selector{cursor:default;}.selectedElement{background:highlight;color:#fff !important;}.selectedElement span{color:#fff !important;}@media screen and (-webkit-min-device-pixel-ratio:0){.selectedElement{background:#316AC5;color:#fff !important;}}.logRow *{font-size:11px;}.logRow{position:relative;border-bottom:1px solid #D7D7D7;padding:2px 4px 1px 6px;background-color:#FFFFFF;}.logRow-command{font-family:Monaco,monospace;color:blue;}.objectBox-string,.objectBox-text,.objectBox-number,.objectBox-function,.objectLink-element,.objectLink-textNode,.objectLink-function,.objectBox-stackTrace,.objectLink-profile{font-family:Monaco,monospace;}.objectBox-null{padding:0 2px;border:1px solid #666666;background-color:#888888;color:#FFFFFF;}.objectBox-string{color:red;white-space:pre;}.objectBox-number{color:#000088;}.objectBox-function{color:DarkGreen;}.objectBox-object{color:DarkGreen;font-weight:bold;font-family:Lucida Grande,sans-serif;}.objectBox-array{color:#000;}.logRow-info,.logRow-error,.logRow-warning{background:#fff no-repeat 2px 2px;padding-left:20px;padding-bottom:3px;}.logRow-info{background-image:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/infoIcon.png);}.logRow-warning{background-color:cyan;background-image:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/warningIcon.png);}.logRow-error{background-color:LightYellow;background-image:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/errorIcon.png);color:#f00;}.errorMessage{vertical-align:top;color:#f00;}.objectBox-sourceLink{position:absolute;right:4px;top:2px;padding-left:8px;font-family:Lucida Grande,sans-serif;font-weight:bold;color:#0000FF;}.logRow-group{background:#EEEEEE;border-bottom:none;}.logGroup{background:#EEEEEE;}.logGroupBox{margin-left:24px;border-top:1px solid #D7D7D7;border-left:1px solid #D7D7D7;}.selectorTag,.selectorId,.selectorClass{font-family:Monaco,monospace;font-weight:normal;}.selectorTag{color:#0000FF;}.selectorId{color:DarkBlue;}.selectorClass{color:red;}.objectBox-element{font-family:Monaco,monospace;color:#000088;}.nodeChildren{padding-left:26px;}.nodeTag{color:blue;cursor:pointer;}.nodeValue{color:#FF0000;font-weight:normal;}.nodeText,.nodeComment{margin:0 2px;vertical-align:top;}.nodeText{color:#333333;}.nodeComment{color:DarkGreen;}.log-object{}.property{position:relative;clear:both;height:15px;}.propertyNameCell{vertical-align:top;float:left;width:28%;position:absolute;left:0;z-index:0;}.propertyValueCell{float:right;width:68%;background:#fff;position:absolute;padding-left:5px;display:table-cell;right:0;z-index:1;}.propertyName{font-weight:bold;}.FirebugPopup{height:100% !important;}.FirebugPopup #mainButtons{display:none !important;}.FirebugPopup #mainButtons{display:none !important;}.FirebugPopup #fbHSplitter{display:none !important;}.FirebugPopup #fbCommandBox{height:18px !important;}',
    HTML: '<table id="fbChrome" cellpadding="0" cellspacing="0" border="0"><tbody><tr><td id="fbTop" colspan="2"><div id="mainButtons"><a id="detach" href="javascript:FB.detach()">&nbsp;</a><a id="close" href="javascript:FB.close()">&nbsp;</a></div><div id="fbHSplitter">&nbsp;</div><div id="fbToolbar"><span id="fbToolbarIcon"><a title="Firebug Lite Homepage" href="http://getfirebug.com/lite.html">&nbsp;</a></span><span id="fbToolbarButtons"><span><a id="fbBtnInspect" href="javascript:FB.startInspecting(this)">Inspect</a></span><span id="fbConsoleButtons"><span><a href="javascript:FB.clear()">Clear</a></span></span><span id="fbHTMLButtons"><span><a href="#">Edit</a></span></span></span><span id="fbStatusBarBox"><span class="fbToolbarSeparator"></span><span id="fbHTMLStatusBar" class="fbStatusBar"><span><a href="#"><b>body</b></a></span><span>&lt;</span><span><a href="#">html</a></span></span></span></div><div id="fbPanelBarBox"><div id="fbPanelBar1" class="fbPanelBar"><a id="tc" class="tab selectedTab" href="javascript:FB.showTab(0)"><span class="tabL"></span><span class="tabText">Console</span><span class="tabR"></span></a><a id="th" class="tab" href="javascript:FB.showTab(1)"><span class="tabL"></span><span class="tabText">HTML</span><span class="tabR"></span></a><a class="tab" href="javascript:void(0)"><span class="tabL"></span><span class="tabText">CSS</span><span class="tabR"></span></a><a class="tab" href="javascript:void(0)"><span class="tabL"></span><span class="tabText">Script</span><span class="tabR"></span></a><a class="tab" href="javascript:void(0)"><span class="tabL"></span><span class="tabText">DOM</span><span class="tabR"></span></a></div><div id="fbPanelBar2Box" class="hide"><div id="fbPanelBar2" class="fbPanelBar"><a class="tab selectedTab" href="javascript:void(0);"><span class="tabL"></span><span class="tabText">Style</span><span class="tabR"></span></a><a class="tab" href="javascript:void(0)"><span class="tabL"></span><span class="tabText">Layout</span><span class="tabR"></span></a><a class="tab" href="javascript:void(0)"><span class="tabL"></span><span class="tabText">DOM</span><span class="tabR"></span></a></div></div></div></td></tr><tr id="fbContent"><td id="fbPanelBox1"><div id="fbPanel1" class="fbFitHeight"><div id="fbConsole"></div><div id="fbHTML"></div></div></td><td id="fbPanelBox2" class="hide"><div id="fbVSplitter" class="fbVSplitter">&nbsp;</div><div id="fbPanel2" class="fbFitHeight"><div id="fbHTML_Style"></div><div id="fbHTML_Layout"></div><div id="fbHTML_DOM"></div></div></td></tr><tr id="fbBottom"><td id="fbCommand" colspan="2"><div id="fbCommandBox"><div id="fbCommandIcon">&gt;&gt;&gt;</div><input id="fbCommandLine" name="fbCommandLine" type="text"/></div></td></tr></tbody></table>'
};

// ************************************************************************************************
}});


FBL.ns(function() { with (FBL) {
// ************************************************************************************************

/*
 * Sizzle CSS Selector Engine - v0.9
 *  Copyright 2009, John Resig (http://ejohn.org/)
 *  released under the MIT License
 */

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]+\]|[^[\]]+)+\]|\\.|[^ >+~,(\[]+)+|[>+~])(\s*,\s*)?/g;

var done = 0;

var Sizzle = function(selector, context, results, seed) {
    var doCache = !results;
    results = results || [];
    context = context || document;

    if ( context.nodeType !== 1 && context.nodeType !== 9 )
        return [];
    
    if ( !selector || typeof selector !== "string" ) {
        return results;
    }

    var parts = [], m, set, checkSet, check, mode, extra;
    
    // Reset the position of the chunker regexp (start from head)
    chunker.lastIndex = 0;
    
    while ( (m = chunker.exec(selector)) !== null ) {
        parts.push( m[1] );
        
        if ( m[2] ) {
            extra = RegExp.rightContext;
            break;
        }
    }

    if ( parts.length > 1 && Expr.match.POS.exec( selector ) ) {
        if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
            var later = "", match;

            // Position selectors must be done after the filter
            while ( (match = Expr.match.POS.exec( selector )) ) {
                later += match[0];
                selector = selector.replace( Expr.match.POS, "" );
            }

            set = Sizzle.filter( later, Sizzle( selector, context ) );
        } else {
            set = Expr.relative[ parts[0] ] ?
                [ context ] :
                Sizzle( parts.shift(), context );

            while ( parts.length ) {
                var tmpSet = [];

                selector = parts.shift();
                if ( Expr.relative[ selector ] )
                    selector += parts.shift();

                for ( var i = 0, l = set.length; i < l; i++ ) {
                    Sizzle( selector, set[i], tmpSet );
                }

                set = tmpSet;
            }
        }
    } else {
        var ret = seed ?
            { expr: parts.pop(), set: makeArray(seed) } :
            Sizzle.find( parts.pop(), parts.length === 1 && context.parentNode ? context.parentNode : context );
        set = Sizzle.filter( ret.expr, ret.set );

        if ( parts.length > 0 ) {
            checkSet = makeArray(set);
        }

        while ( parts.length ) {
            var cur = parts.pop(), pop = cur;

            if ( !Expr.relative[ cur ] ) {
                cur = "";
            } else {
                pop = parts.pop();
            }

            if ( pop == null ) {
                pop = context;
            }

            Expr.relative[ cur ]( checkSet, pop );
        }
    }

    if ( !checkSet ) {
        checkSet = set;
    }

    if ( !checkSet ) {
        throw "Syntax error, unrecognized expression: " + (cur || selector);
    }

    if ( checkSet instanceof Array ) {
        if ( context.nodeType === 1 ) {
            for ( var i = 0; checkSet[i] != null; i++ ) {
                if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
                    results.push( set[i] );
                }
            }
        } else {
            for ( var i = 0; checkSet[i] != null; i++ ) {
                if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
                    results.push( set[i] );
                }
            }
        }
    } else {
        makeArray( checkSet, results );
    }

    if ( extra ) {
        Sizzle( extra, context, results );
    }

    return results;
};

Sizzle.matches = function(expr, set){
    return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context){
    var set, match;

    if ( !expr ) {
        return [];
    }

    var later = "", match;

    // Pseudo-selectors could contain other selectors (like :not)
    while ( (match = Expr.match.PSEUDO.exec( expr )) ) {
        var left = RegExp.leftContext;

        if ( left.substr( left.length - 1 ) !== "\\" ) {
            later += match[0];
            expr = expr.replace( Expr.match.PSEUDO, "" );
        } else {
            // TODO: Need a better solution, fails: .class\:foo:realfoo(#id)
            break;
        }
    }

    for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
        var type = Expr.order[i];
        
        if ( (match = Expr.match[ type ].exec( expr )) ) {
            var left = RegExp.leftContext;

            if ( left.substr( left.length - 1 ) !== "\\" ) {
                match[1] = (match[1] || "").replace(/\\/g, "");
                set = Expr.find[ type ]( match, context );

                if ( set != null ) {
                    expr = expr.replace( Expr.match[ type ], "" );
                    break;
                }
            }
        }
    }

    if ( !set ) {
        set = context.getElementsByTagName("*");
    }

    expr += later;

    return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace){
    var old = expr, result = [], curLoop = set, match;

    while ( expr && set.length ) {
        for ( var type in Expr.filter ) {
            if ( (match = Expr.match[ type ].exec( expr )) != null ) {
                var anyFound = false, filter = Expr.filter[ type ], goodArray = null;

                if ( curLoop == result ) {
                    result = [];
                }

                if ( Expr.preFilter[ type ] ) {
                    match = Expr.preFilter[ type ]( match, curLoop );

                    if ( match[0] === true ) {
                        goodArray = [];
                        var last = null, elem;
                        for ( var i = 0; (elem = curLoop[i]) !== undefined; i++ ) {
                            if ( elem && last !== elem ) {
                                goodArray.push( elem );
                                last = elem;
                            }
                        }
                    }

                }

                var goodPos = 0, found, item;

                for ( var i = 0; (item = curLoop[i]) !== undefined; i++ ) {
                    if ( item ) {
                        if ( goodArray && item != goodArray[goodPos] ) {
                            goodPos++;
                        }

                        found = filter( item, match, goodPos, goodArray );
                        if ( inplace && found != null ) {
                            curLoop[i] = found ? curLoop[i] : false;
                            if ( found ) {
                                anyFound = true;
                            }
                        } else if ( found ) {
                            result.push( item );
                            anyFound = true;
                        }
                    }
                }

                if ( found !== undefined ) {
                    if ( !inplace ) {
                        curLoop = result;
                    }

                    expr = expr.replace( Expr.match[ type ], "" );

                    if ( !anyFound ) {
                        return [];
                    }

                    break;
                }
            }
        }


        expr = expr.replace(/\s*,\s*/, "");

        // Improper expression
        if ( expr == old ) {
            throw "Syntax error, unrecognized expression: " + expr;
        }

        old = expr;
    }

    return curLoop;
};

var Expr = Sizzle.selectors = {
    order: [ "ID", "NAME", "TAG" ],
    match: {
        ID: /#((?:[\w\u0128-\uFFFF_-]|\\.)+)/,
        CLASS: /\.((?:[\w\u0128-\uFFFF_-]|\\.)+)/,
        NAME: /\[name=((?:[\w\u0128-\uFFFF_-]|\\.)+)\]/,
        ATTR: /\[((?:[\w\u0128-\uFFFF_-]|\\.)+)\s*(?:(\S{0,1}=)\s*(['"]*)(.*?)\3|)\]/,
        TAG: /^((?:[\w\u0128-\uFFFF\*_-]|\\.)+)/,
        CHILD: /:(only|nth|last|first)-child\(?(even|odd|[\dn+-]*)\)?/,
        POS: /:(nth|eq|gt|lt|first|last|even|odd)\(?(\d*)\)?(?:[^-]|$)/,
        PSEUDO: /:((?:[\w\u0128-\uFFFF_-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
    },
    attrMap: {
        "class": "className"
    },
    relative: {
        "+": function(checkSet, part){
            for ( var i = 0, l = checkSet.length; i < l; i++ ) {
                var elem = checkSet[i];
                if ( elem ) {
                    var cur = elem.previousSibling;
                    while ( cur && cur.nodeType !== 1 ) {
                        cur = cur.previousSibling;
                    }
                    checkSet[i] = typeof part === "string" ?
                        cur || false :
                        cur === part;
                }
            }

            if ( typeof part === "string" ) {
                Sizzle.filter( part, checkSet, true );
            }
        },
        ">": function(checkSet, part){
            if ( typeof part === "string" && !/\W/.test(part) ) {
                part = part.toUpperCase();

                for ( var i = 0, l = checkSet.length; i < l; i++ ) {
                    var elem = checkSet[i];
                    if ( elem ) {
                        var parent = elem.parentNode;
                        checkSet[i] = parent.nodeName === part ? parent : false;
                    }
                }
            } else {
                for ( var i = 0, l = checkSet.length; i < l; i++ ) {
                    var elem = checkSet[i];
                    if ( elem ) {
                        checkSet[i] = typeof part === "string" ?
                            elem.parentNode :
                            elem.parentNode === part;
                    }
                }

                if ( typeof part === "string" ) {
                    Sizzle.filter( part, checkSet, true );
                }
            }
        },
        "": function(checkSet, part){
            var doneName = "done" + (done++), checkFn = dirCheck;

            if ( !part.match(/\W/) ) {
                var nodeCheck = part = part.toUpperCase();
                checkFn = dirNodeCheck;
            }

            checkFn("parentNode", part, doneName, checkSet, nodeCheck);
        },
        "~": function(checkSet, part){
            var doneName = "done" + (done++), checkFn = dirCheck;

            if ( typeof part === "string" && !part.match(/\W/) ) {
                var nodeCheck = part = part.toUpperCase();
                checkFn = dirNodeCheck;
            }

            checkFn("previousSibling", part, doneName, checkSet, nodeCheck);
        }
    },
    find: {
        ID: function(match, context){
            if ( context.getElementById ) {
                var m = context.getElementById(match[1]);
                return m ? [m] : [];
            }
        },
        NAME: function(match, context){
            return context.getElementsByName(match[1]);
        },
        TAG: function(match, context){
            return context.getElementsByTagName(match[1]);
        }
    },
    preFilter: {
        CLASS: function(match){
            return new RegExp( "(?:^|\\s)" + match[1] + "(?:\\s|$)" );
        },
        ID: function(match){
            return match[1];
        },
        TAG: function(match){
            return match[1].toUpperCase();
        },
        CHILD: function(match){
            if ( match[1] == "nth" ) {
                // parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
                var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
                    match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" ||
                    !/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

                // calculate the numbers (first)n+(last) including if they are negative
                match[2] = (test[1] + (test[2] || 1)) - 0;
                match[3] = test[3] - 0;
            }

            // TODO: Move to normal caching system
            match[0] = "done" + (done++);

            return match;
        },
        ATTR: function(match){
            var name = match[1];
            
            if ( Expr.attrMap[name] ) {
                match[1] = Expr.attrMap[name];
            }

            if ( match[2] === "~=" ) {
                match[4] = " " + match[4] + " ";
            }

            return match;
        },
        PSEUDO: function(match){
            if ( match[1] === "not" ) {
                match[3] = match[3].split(/\s*,\s*/);
            }
            
            return match;
        },
        POS: function(match){
            match.unshift( true );
            return match;
        }
    },
    filters: {
        enabled: function(elem){
            return elem.disabled === false && elem.type !== "hidden";
        },
        disabled: function(elem){
            return elem.disabled === true;
        },
        checked: function(elem){
            return elem.checked === true;
        },
        selected: function(elem){
            // Accessing this property makes selected-by-default
            // options in Safari work properly
            elem.parentNode.selectedIndex;
            return elem.selected === true;
        },
        parent: function(elem){
            return !!elem.firstChild;
        },
        empty: function(elem){
            return !elem.firstChild;
        },
        has: function(elem, i, match){
            return !!Sizzle( match[3], elem ).length;
        },
        header: function(elem){
            return /h\d/i.test( elem.nodeName );
        },
        text: function(elem){
            return "text" === elem.type;
        },
        radio: function(elem){
            return "radio" === elem.type;
        },
        checkbox: function(elem){
            return "checkbox" === elem.type;
        },
        file: function(elem){
            return "file" === elem.type;
        },
        password: function(elem){
            return "password" === elem.type;
        },
        submit: function(elem){
            return "submit" === elem.type;
        },
        image: function(elem){
            return "image" === elem.type;
        },
        reset: function(elem){
            return "reset" === elem.type;
        },
        button: function(elem){
            return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
        },
        input: function(elem){
            return /input|select|textarea|button/i.test(elem.nodeName);
        }
    },
    setFilters: {
        first: function(elem, i){
            return i === 0;
        },
        last: function(elem, i, match, array){
            return i === array.length - 1;
        },
        even: function(elem, i){
            return i % 2 === 0;
        },
        odd: function(elem, i){
            return i % 2 === 1;
        },
        lt: function(elem, i, match){
            return i < match[3] - 0;
        },
        gt: function(elem, i, match){
            return i > match[3] - 0;
        },
        nth: function(elem, i, match){
            return match[3] - 0 == i;
        },
        eq: function(elem, i, match){
            return match[3] - 0 == i;
        }
    },
    filter: {
        CHILD: function(elem, match){
            var type = match[1], parent = elem.parentNode;

            var doneName = match[0];
            
            if ( parent && !parent[ doneName ] ) {
                var count = 1;

                for ( var node = parent.firstChild; node; node = node.nextSibling ) {
                    if ( node.nodeType == 1 ) {
                        node.nodeIndex = count++;
                    }
                }

                parent[ doneName ] = count - 1;
            }

            if ( type == "first" ) {
                return elem.nodeIndex == 1;
            } else if ( type == "last" ) {
                return elem.nodeIndex == parent[ doneName ];
            } else if ( type == "only" ) {
                return parent[ doneName ] == 1;
            } else if ( type == "nth" ) {
                var add = false, first = match[2], last = match[3];

                if ( first == 1 && last == 0 ) {
                    return true;
                }

                if ( first == 0 ) {
                    if ( elem.nodeIndex == last ) {
                        add = true;
                    }
                } else if ( (elem.nodeIndex - last) % first == 0 && (elem.nodeIndex - last) / first >= 0 ) {
                    add = true;
                }

                return add;
            }
        },
        PSEUDO: function(elem, match, i, array){
            var name = match[1], filter = Expr.filters[ name ];

            if ( filter ) {
                return filter( elem, i, match, array )
            } else if ( name === "contains" ) {
                return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
            } else if ( name === "not" ) {
                var not = match[3];

                for ( var i = 0, l = not.length; i < l; i++ ) {
                    if ( Sizzle.filter(not[i], [elem]).length > 0 ) {
                        return false;
                    }
                }

                return true;
            }
        },
        ID: function(elem, match){
            return elem.nodeType === 1 && elem.getAttribute("id") === match;
        },
        TAG: function(elem, match){
            return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
        },
        CLASS: function(elem, match){
            return match.test( elem.className );
        },
        ATTR: function(elem, match){
            var result = elem[ match[1] ] || elem.getAttribute( match[1] ), value = result + "", type = match[2], check = match[4];
            return result == null ?
                false :
                type === "=" ?
                value === check :
                type === "*=" ?
                value.indexOf(check) >= 0 :
                type === "~=" ?
                (" " + value + " ").indexOf(check) >= 0 :
                !match[4] ?
                result :
                type === "!=" ?
                value != check :
                type === "^=" ?
                value.indexOf(check) === 0 :
                type === "$=" ?
                value.substr(value.length - check.length) === check :
                type === "|=" ?
                value === check || value.substr(0, check.length + 1) === check + "-" :
                false;
        },
        POS: function(elem, match, i, array){
            var name = match[2], filter = Expr.setFilters[ name ];

            if ( filter ) {
                return filter( elem, i, match, array );
            }
        }
    }
};

var makeArray = function(array, results) {
    array = Array.prototype.slice.call( array );

    if ( results ) {
        results.push.apply( results, array );
        return results;
    }
    
    return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
try {
    Array.prototype.slice.call( document.documentElement.childNodes );

// Provide a fallback method if it does not work
} catch(e){
    makeArray = function(array, results) {
        var ret = results || [];

        if ( array instanceof Array ) {
            Array.prototype.push.apply( ret, array );
        } else {
            if ( typeof array.length === "number" ) {
                for ( var i = 0, l = array.length; i < l; i++ ) {
                    ret.push( array[i] );
                }
            } else {
                for ( var i = 0; array[i]; i++ ) {
                    ret.push( array[i] );
                }
            }
        }

        return ret;
    };
}

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
    // We're going to inject a fake input element with a specified name
    var form = document.createElement("form"),
        id = "script" + (new Date).getTime();
    form.innerHTML = "<input name='" + id + "'/>";

    // Inject it into the root element, check its status, and remove it quickly
    var root = document.documentElement;
    root.insertBefore( form, root.firstChild );

    // The workaround has to do additional checks after a getElementById
    // Which slows things down for other browsers (hence the branching)
    if ( !!document.getElementById( id ) ) {
        Expr.find.ID = function(match, context){
            if ( context.getElementById ) {
                var m = context.getElementById(match[1]);
                return m ? m.id === match[1] || m.getAttributeNode && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
            }
        };

        Expr.filter.ID = function(elem, match){
            var node = elem.getAttributeNode && elem.getAttributeNode("id");
            return elem.nodeType === 1 && node && node.nodeValue === match;
        };
    }

    root.removeChild( form );
})();

// Check to see if the browser returns only elements
// when doing getElementsByTagName("*")
(function(){
    // Create a fake element
    var div = document.createElement("div");
    div.appendChild( document.createComment("") );

    // Make sure no comments are found
    if ( div.getElementsByTagName("*").length > 0 ) {
        Expr.find.TAG = function(match, context){
            var results = context.getElementsByTagName(match[1]);

            // Filter out possible comments
            if ( match[1] === "*" ) {
                var tmp = [];

                for ( var i = 0; results[i]; i++ ) {
                    if ( results[i].nodeType === 1 ) {
                        tmp.push( results[i] );
                    }
                }

                results = tmp;
            }

            return results;
        };
    }
})();

if ( document.querySelectorAll ) (function(){
    var oldSizzle = Sizzle;
    
    Sizzle = function(query, context, extra){
        context = context || document;

        if ( context.nodeType === 9 ) {
            try {
                return makeArray( context.querySelectorAll(query) );
            } catch(e){}
        }
        
        return oldSizzle(query, context, extra);
    };

    Sizzle.find = oldSizzle.find;
    Sizzle.filter = oldSizzle.filter;
    Sizzle.selectors = oldSizzle.selectors;
})();

if ( document.documentElement.getElementsByClassName ) {
    Expr.order.splice(1, 0, "CLASS");
    Expr.find.CLASS = function(match, context) {
        return context.getElementsByClassName(match[1]);
    };
}

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck ) {
    for ( var i = 0, l = checkSet.length; i < l; i++ ) {
        var elem = checkSet[i];
        if ( elem ) {
            elem = elem[dir]
            var match = false;

            while ( elem && elem.nodeType ) {
                var done = elem[doneName];
                if ( done ) {
                    match = checkSet[ done ];
                    break;
                }

                if ( elem.nodeType === 1 )
                    elem[doneName] = i;

                if ( elem.nodeName === cur ) {
                    match = elem;
                    break;
                }

                elem = elem[dir];
            }

            checkSet[i] = match;
        }
    }
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck ) {
    for ( var i = 0, l = checkSet.length; i < l; i++ ) {
        var elem = checkSet[i];
        if ( elem ) {
            elem = elem[dir]
            var match = false;

            while ( elem && elem.nodeType ) {
                if ( elem[doneName] ) {
                    match = checkSet[ elem[doneName] ];
                    break;
                }

                if ( elem.nodeType === 1 ) {
                    elem[doneName] = i;

                    if ( typeof cur !== "string" ) {
                        if ( elem === cur ) {
                            match = true;
                            break;
                        }

                    } else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
                        match = elem;
                        break;
                    }
                }

                elem = elem[dir];
            }

            checkSet[i] = match;
        }
    }
}

var contains = document.compareDocumentPosition ?  function(a, b){
    return a.compareDocumentPosition(b) & 16;
} : function(a, b){
    return a !== b && a.contains(b);
};

// EXPOSE

Firebug.Selector = Sizzle;

// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// Inspector Module

Firebug.Inspector =
{  
  
    initialize: function()
    {
        offlineFragment = document.createDocumentFragment();
        
        calculatePixelsPerInch();
        createBoxModelInspector();
        createOutlineInspector();
    },
    
    onChromeReady: function()
    {
        fbBtnInspect = $U("fbBtnInspect");
    },    
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Inspect functions
    
    startInspecting: function()
    {
        createInspectorFrame();
        
        var size = this.getWindowScrollSize();
        
        fbInspectFrame.style.width = size.width + "px";
        fbInspectFrame.style.height = size.height + "px";

        fbBtnInspect.href = "javascript:FB.stopInspecting(this)";
        fbBtnInspect.className = "fbBtnInspectActive";
        
        addEvent(fbInspectFrame, "mousemove", Firebug.Inspector.onInspecting)
        addEvent(fbInspectFrame, "mousedown", Firebug.Inspector.onInspectingClick)
    },
    
    stopInspecting: function()
    {
        destroyInspectorFrame();
        
        fbBtnInspect.href = "javascript:FB.startInspecting(this)";
        fbBtnInspect.className = "";
        
        if (outlineVisible) this.hideOutline();
        removeEvent(fbInspectFrame, "mousemove", Firebug.Inspector.onInspecting)
        removeEvent(fbInspectFrame, "mousedown", Firebug.Inspector.onInspectingClick)
    },
    
    
    onInspectingClick: function(e)
    {
        fbInspectFrame.style.display = "none";    
        var targ = Firebug.Inspector.getElementFromPoint(e.clientX, e.clientY);
        fbInspectFrame.style.display = "block";    

        // Avoid inspecting the outline, and the FirebugChrome
        var id = targ.id;
        if (id && /^fbOutline\w$/.test(id)) return;
        if (id == "FirebugChrome") return;

        // Avoid looking at text nodes in Opera
        while (targ.nodeType != 1) targ = targ.parentNode;
        
        //Firebug.Console.log(targ);
        Firebug.Inspector.stopInspecting();
    },
    
    onInspecting: function(e)
    {
        if (new Date().getTime() - lastInspecting > 30)
        {
            fbInspectFrame.style.display = "none";
            var targ = Firebug.Inspector.getElementFromPoint(e.clientX, e.clientY);
            fbInspectFrame.style.display = "block";    
    
            // Avoid inspecting the outline, and the FirebugChrome
            var id = targ.id;
            if (id && /^fbOutline\w$/.test(id)) return;
            if (id == "FirebugChrome") return;
            
            // Avoid looking at text nodes in Opera
            while (targ.nodeType != 1) targ = targ.parentNode;
    
            if (targ.nodeName.toLowerCase() == "body") return;
    
            //Firebug.Console.log(e.clientX, e.clientY, targ);
            Firebug.Inspector.drawOutline(targ);
            
            if (targ[cacheID])
                FBL.Firebug.HTML.selectTreeNode(""+targ[cacheID])
            
            lastInspecting = new Date().getTime();
        }
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Inspector Outline
    
    drawOutline: function(el)
    {
        if (!outlineVisible) this.showOutline();
        
        var box = this.getElementBox(el);
        
        var top = box.top;
        var left = box.left;
        var height = box.height;
        var width = box.width;
        
        var border = 2;
        var o = outlineElements;
        
        o.fbOutlineT.style.top = top-border + "px";
        o.fbOutlineT.style.left = left + "px";
        o.fbOutlineT.style.width = width + "px";
  
        o.fbOutlineB.style.top = top+height + "px";
        o.fbOutlineB.style.left = left + "px";
        o.fbOutlineB.style.width = width + "px";
        
        o.fbOutlineL.style.top = top-border + "px";
        o.fbOutlineL.style.left = left-border + "px";
        o.fbOutlineL.style.height = height+2*border + "px";

        o.fbOutlineR.style.top = top-border + "px";
        o.fbOutlineR.style.left = left+width + "px";
        o.fbOutlineR.style.height = height+2*border + "px";
    },
    
    hideOutline: function()
    {
        if (!outlineVisible) return;
        
        for (var name in outline)
            offlineFragment.appendChild(outlineElements[name]);

        outlineVisible = false;
    },
    
    showOutline: function()
    {
        if (outlineVisible) return;
        
        for (var name in outline)
            document.body.appendChild(outlineElements[name]);
        
        outlineVisible = true;
    },
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Box Model
    
    drawBoxModel: function(el)
    {
        if (!boxModelVisible) this.showBoxModel();
        
        var box = this.getElementBox(el);
        
        var top = box.top;
        var left = box.left;
        var height = box.height;
        var width = box.width;
        
        var margin = this.getMeasurementBox(el, "margin");
        var padding = this.getMeasurementBox(el, "padding");

        boxModelStyle.top = top - margin.top + "px";
        boxModelStyle.left = left - margin.left + "px";
        boxModelStyle.height = height + margin.top + margin.bottom + "px";
        boxModelStyle.width = width + margin.left + margin.right + "px";
      
        boxPaddingStyle.top = margin.top + "px";
        boxPaddingStyle.left = margin.left + "px";
        boxPaddingStyle.height = height + "px";
        boxPaddingStyle.width = width + "px";
      
        boxContentStyle.top = margin.top + padding.top + "px";
        boxContentStyle.left = margin.left + padding.left + "px";
        boxContentStyle.height = height - padding.top - padding.bottom + "px";
        boxContentStyle.width = width - padding.left - padding.right + "px";
    },
  
    hideBoxModel: function()
    {  
        offlineFragment.appendChild(boxModel);
        boxModelVisible = false;
    },
    
    showBoxModel: function()
    {
        document.body.appendChild(boxModel);
        boxModelVisible = true;
    },
     
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Measurement Funtions
    
    getMeasurement: function(el, name)
    {
        var result = {value: 0, unit: "px"};
        
        var cssValue = this.getCSS(el, name);
        if (!cssValue) return result;
        if (cssValue.toLowerCase() == "auto") return result;
        
        var reMeasure = /(\d+\.?\d*)(.*)/;
        var m = cssValue.match(reMeasure);
        
        if (m)
        {
            result.value = m[1]-0;
            result.unit = m[2].toLowerCase();
        }
        
        return result;        
    },
    
    getMeasurementInPixels: function(el, name)
    {
        if (!el) return null;
        
        var m = this.getMeasurement(el, name);
        var value = m.value;
        var unit = m.unit;
        
        if (unit == "px")
            return value;
          
        else if (unit == "pt")
            return this.pointsToPixels(name, value);
          
        if (unit == "em")
            return this.emToPixels(el, value);
          
        else if (unit == "%")
            return this.percentToPixels(el, value);
    },

    getElementPosition: function(el)
    {
        var left = 0
        var top = 0;
        
        if (el.offsetParent)
        {
            do
            {
                left += el.offsetLeft;
                top += el.offsetTop;
            }
            while (el = el.offsetParent);
        }
        return {left:left, top:top};      
    },
    
    getWindowSize: function()
    {
        var width=0, height=0, el;
        
        if (typeof window.innerWidth == 'number')
        {
            width = window.innerWidth;
            height = window.innerHeight;
        }
        else if ((el=document.documentElement) && (el.clientHeight || el.clientWidth))
        {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        else if ((el=document.body) && (el.clientHeight || el.clientWidth))
        {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        
        return {width: width, height: height};
    },
    
    getWindowScrollSize: function()
    {
        var width=0, height=0, el;

        if (!isIEQuiksMode && (el=document.documentElement) && 
           (el.scrollHeight || el.scrollWidth))
        {
            width = el.scrollWidth;
            height = el.scrollHeight;
        }
        else if ((el=document.body) && (el.scrollHeight || el.scrollWidth))
        {
            width = el.scrollWidth;
            height = el.scrollHeight;
        }
        
        return {width: width, height: height};
    },
    
    getWindowScrollPosition: function()
    {
        var top=0, left=0, el;
        
        if(typeof window.pageYOffset == 'number')
        {
            top = window.pageYOffset;
            left = window.pageXOffset;
        }
        else if((el=document.body) && (el.scrollTop || el.scrollLeft))
        {
            top = el.scrollTop;
            left = el.scrollLeft;
        }
        else if((el=document.documentElement) && (el.scrollTop || el.scrollLeft))
        {
            top = el.scrollTop;
            left = el.scrollLeft;
        }
        
        return {top:top, left:left};
    },
    
    getElementBox: function(el)
    {
        var result = {};
        
        if (el.getBoundingClientRect)
        {
            var rect = el.getBoundingClientRect();
            
            // fix IE problem with offset when not in fullscreen mode
            var offset = isIE ? document.body.clientTop || document.documentElement.clientTop: 0;
            
            var scroll = this.getWindowScrollPosition();
            
            result.top = Math.round(rect.top - offset + scroll.top);
            result.left = Math.round(rect.left - offset + scroll.left);
            result.height = Math.round(rect.bottom - rect.top);
            result.width = Math.round(rect.right - rect.left);
        }
        else 
        {
            var position = this.getElementPosition(el);
            
            result.top = position.top;
            result.left = position.left;
            result.height = el.offsetHeight;
            result.width = el.offsetWidth;
        }
        
        return result;
    },
    
    getElementFromPoint: function(x, y)
    {
        if (isOpera || isSafari)
        {
            var scroll = this.getWindowScrollPosition();
            return document.elementFromPoint(x + scroll.left, y + scroll.top);
        }
        else
            return document.elementFromPoint(x, y);
    },
    
    getMeasurementBox: function(el, name)
    {
        var sufixes = ["Top", "Left", "Bottom", "Right"];
        var result = [];
        
        for(var i=0, sufix; sufix=sufixes[i]; i++)
            result[i] = Math.round(this.getMeasurementInPixels(el, name + sufix));
        
        return {top:result[0], left:result[1], bottom:result[2], right:result[3]};
    }, 
    
    getFontSizeInPixels: function(el)
    {
        var size = this.getMeasurement(el, "fontSize");
        
        if (size.unit == "px") return size.value;
        
        // get font size, the dirty way
        var computeDirtyFontSize = function(el, calibration)
        {
            var div = document.createElement("div");
            var divStyle = offscreenStyle;

            if (calibration)
                divStyle +=  " font-size:"+calibration+"px;";
            
            div.style.cssText = divStyle;
            div.innerHTML = "A";
            el.appendChild(div);
            
            var value = div.offsetHeight;
            el.removeChild(div);
            return value;
        }
        
        // Calibration fails in some environments, so we're using a static value
        // based in the test case result.
        var rate = 200 / 225;
        //var calibrationBase = 200;
        //var calibrationValue = computeDirtyFontSize(el, calibrationBase);
        //var rate = calibrationBase / calibrationValue;
        
        var value = computeDirtyFontSize(el);

        return value * rate;
    },
    
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Unit Funtions
  
    pointsToPixels: function(name, value)
    {
        var axis = /Top$|Bottom$/.test(name) ? "y" : "x";
        
        var result = value * pixelsPerInch[axis] / 72;
        
        return returnFloat ? result : Math.round(result);
    },
    
    emToPixels: function(el, value)
    {
        if (!el) return null;
        
        var fontSize = this.getFontSizeInPixels(el);
        
        return Math.round(value * fontSize);
    },
    
    exToPixels: function(el, value)
    {
        if (!el) return null;
        
        // get ex value, the dirty way
        var div = document.createElement("div");
        div.style.cssText = offscreenStyle + "width:"+value + "ex;";
        
        el.appendChild(div);
        var value = div.offsetWidth;
        el.removeChild(div);
        
        return value;
    },
      
    percentToPixels: function(el, value)
    {
        if (!el) return null;
        
        // get % value, the dirty way
        var div = document.createElement("div");
        div.style.cssText = offscreenStyle + "width:"+value + "%;";
        
        el.appendChild(div);
        var value = div.offsetWidth;
        el.removeChild(div);
        
        return value;
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    getCSS: isIE ? function(el, name)
    {
        return el.currentStyle[name] || el.style[name] || undefined;
    }
    : function(el, name)
    {
        return document.defaultView.getComputedStyle(el,null)[name] 
            || el.style[name] || undefined;
    }

};

// ************************************************************************************************
// Inspector Internals


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Shared variables



// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Internal variables

var offlineFragment = null;

var boxModelVisible = false;

var pixelsPerInch, boxModel, boxModelStyle, boxMargin, boxMarginStyle, 
boxPadding, boxPaddingStyle, boxContent, boxContentStyle;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var resetStyle = "margin:0; padding:0; border:0; position:absolute; overflow:hidden; display:block;";
var offscreenStyle = resetStyle + "top:-1234px; left:-1234px;";

var inspectStyle = resetStyle + "z-index: 2147483500;";
var inspectFrameStyle = resetStyle + "z-index: 2147483550; top:0; left:0; background:url(http://pedrosimonetti.googlepages.com/pixel_transparent.gif);";
//var inspectFrameStyle = resetStyle + "z-index: 2147483550; top: 0; left: 0; background: #ff0; opacity: 0.1; _filter: alpha(opacity=10);";

var inspectModelStyle = inspectStyle + "opacity:0.8; _filter:alpha(opacity=80);";
var inspectMarginStyle = inspectStyle + "background: #EDFF64; height:100%; width:100%;";
var inspectPaddingStyle = inspectStyle + "background: SlateBlue;";
var inspectContentStyle = inspectStyle + "background: SkyBlue;";


var outlineStyle = { 
    fbHorizontalLine: "background: #3875D7; height: 2px;",
    fbVerticalLine: "background: #3875D7; width: 2px;"
}

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var lastInspecting = 0;
var fbInspectFrame = null;
var fbBtnInspect = null;


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var outlineVisible = false;
var outlineElements = {};
var outline = {
  "fbOutlineT": "fbHorizontalLine",
  "fbOutlineL": "fbVerticalLine",
  "fbOutlineB": "fbHorizontalLine",
  "fbOutlineR": "fbVerticalLine"
};


// ************************************************************************************************
// Measurement Functions

var calculatePixelsPerInch = function calculatePixelsPerInch()
{
    var inch = document.createElement("div");
    inch.style.cssText = resetStyle + "width:1in; height:1in; position:absolute; top:-1234px; left:-1234px;";
    document.body.appendChild(inch);
    
    pixelsPerInch = {
        x: inch.offsetWidth,
        y: inch.offsetHeight
    };
    
    document.body.removeChild(inch);
};


// ************************************************************************************************
// Section

var createInspectorFrame = function createInspectorFrame()
{
    fbInspectFrame = document.createElement("div");
    fbInspectFrame.id = "fbInspectFrame";
    fbInspectFrame.style.cssText = inspectFrameStyle;
    document.body.appendChild(fbInspectFrame);
}

var destroyInspectorFrame = function createInspectorFrame()
{
    document.body.removeChild(fbInspectFrame);
}

var createOutlineInspector = function createOutlineInspector()
{
    for (var name in outline)
    {
        var el = outlineElements[name] = document.createElement("div");
        el.id = name;
        el.style.cssText = inspectStyle + outlineStyle[outline[name]];
        offlineFragment.appendChild(el);
    }
};

var createBoxModelInspector = function createBoxModelInspector()
{
    boxModel = document.createElement("div");
    boxModel.id = "fbBoxModel";
    boxModelStyle = boxModel.style;
    boxModelStyle.cssText = inspectModelStyle;
    
    boxMargin = document.createElement("div");
    boxMargin.id = "fbBoxMargin";
    boxMarginStyle = boxMargin.style;
    boxMarginStyle.cssText = inspectMarginStyle;
    boxModel.appendChild(boxMargin);
    
    boxPadding = document.createElement("div");
    boxPadding.id = "fbBoxPadding";
    boxPaddingStyle = boxPadding.style;
    boxPaddingStyle.cssText = inspectPaddingStyle;
    boxModel.appendChild(boxPadding);
    
    boxContent = document.createElement("div");
    boxContent.id = "fbBoxContent";
    boxContentStyle = boxContent.style;
    boxContentStyle.cssText = inspectContentStyle;
    boxModel.appendChild(boxContent);
    
    offlineFragment.appendChild(boxModel);
};



// ************************************************************************************************
// Section




// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

var Console = Firebug.Console;


// ************************************************************************************************
// CommandLine


Firebug.CommandLine = function(element)
{
    this.element = element;
    
    if (isOpera)
      fixOperaTabKey(this.element);
    
    this.onKeyDown = bind(this, this.onKeyDown);
    addEvent(this.element, "keydown", this.onKeyDown);
    
    //FBL.application.global.onerror = this.onError;
    var self = this
    application.global.onerror = function(){self.onError.apply(self, arguments)};

    //application.global.onerror = this.onError;
    window.onerror = this.onError;
    
    initializeCommandLineAPI();
};

Firebug.CommandLine.prototype = 
{
    element: null,
  
    _buffer: [],
    _bi: -1,
    
    _completing: null,
    _completePrefix: null,
    _completeExpr: null,
    _completeBuffer: null,
    _ci: null,
    
    _completion:
    {
        window:
        [
            "console"
        ],
        
        document:
        [
            "getElementById", 
            "getElementsByTagName"
        ]
    },
  
    _stack: function(command)
    {
        this._buffer.push(command);
        this._bi = this._buffer.length;
    },
    
    initialize: function(doc)
    {
    },
    
    destroy: function()
    {
        removeEvent(this.element, "keydown", this.onKeyDown);
        window.onerror = null;
        this.element = null
    },

    execute: function()
    {
        var cmd = this.element;
        var command = cmd.value;
        
        this._stack(command);
        writeMessage(['<span>&gt;&gt;&gt;</span> ',command], "command");
        
        try
        {
            
            var result = this.evaluate(command);
            // evita que seja repetido o log, caso o comando executado
            // j� seja um log via linha de comando
            if (result != Console.LOG_COMMAND)
            {
                var html = [];
                appendObject(result, html)
                writeMessage(html, "command");
            }
                
        }
        catch (e)
        {
            writeMessage([e.message || e], "error");
        }
        
        cmd.value = "";
    },
    
    evaluate: function(expr)
    {
        // TODO: need to register the API in console.firebug.commandLineAPI
        var api = "FBL.Firebug.CommandLine.API"
            
        //Firebug.context = Firebug.chrome;
        api = null;

        return Firebug.context.evaluate(expr, "window", api, Console.error);
    },
    
    eval: new Function("return window.eval.apply(window, arguments)"),
    
    prevCommand: function()
    {
        var cmd = this.element;
        var buffer = this._buffer;
        
        if (this._bi > 0 && buffer.length > 0)
            cmd.value = buffer[--this._bi];
    },
  
    nextCommand: function()
    {
        var cmd = this.element;
        
        var buffer = this._buffer;
        var limit = buffer.length -1;
        var i = this._bi;
        
        if (i < limit)
          cmd.value = buffer[++this._bi];
          
        else if (i == limit)
        {
            ++this._bi;
            cmd.value = "";
        }
    },
  
    autocomplete: function(reverse)
    {
        var cmd = this.element;
        
        var command = cmd.value;
        var offset = getExpressionOffset(command);

        var valBegin = offset ? command.substr(0, offset) : "";
        var val = command.substr(offset);
        
        var buffer, obj, objName, commandBegin, result, prefix;
        
        // if it is the beginning of the completion
        if(!this._completing)
        {
            
            // group1 - command begin
            // group2 - base object
            // group3 - property prefix
            var reObj = /(.*[^_$\w\d\.])?((?:[_$\w][_$\w\d]*\.)*)([_$\w][_$\w\d]*)?$/;
            var r = reObj.exec(val);
            
            // parse command
            if (r[1] || r[2] || r[3])
            {
                commandBegin = r[1] || "";
                objName = r[2] || "";
                prefix = r[3] || "";
            }
            else if (val == "")
            {
                commandBegin = objName = prefix = "";
            } else
                return;
            
            this._completing = true;
      
            // find base object
            if(objName == "")
                obj = window;
              
            else
            {
                objName = objName.replace(/\.$/, "");
        
                var n = objName.split(".");
                var target = window, o;
                
                for (var i=0, ni; ni = n[i]; i++)
                {
                    if (o = target[ni])
                      target = o;
                      
                    else
                    {
                        target = null;
                        break;
                    }
                }
                obj = target;
            }
            
            // map base object
            if(obj)
            {
                this._completePrefix = prefix;
                this._completeExpr = valBegin + commandBegin + (objName ? objName + "." : "");
                this._ci = -1;
                
                buffer = this._completeBuffer = isIE ?
                    this._completion[objName || "window"] || [] : [];
                
                for(var p in obj)
                    buffer.push(p);
            }
    
        // if it is the continuation of the last completion
        } else
          buffer = this._completeBuffer;
        
        if (buffer)
        {
            prefix = this._completePrefix;
            
            var diff = reverse ? -1 : 1;
            
            for(var i=this._ci+diff, l=buffer.length, bi; i>=0 && i<l; i+=diff)
            {
                bi = buffer[i];
                
                if (bi.indexOf(prefix) == 0)
                {
                    this._ci = i;
                    result = bi;
                    break;
                }
            }
        }
        
        if (result)
            cmd.value = this._completeExpr + result;
    },
    
    onError: function(msg, href, lineNo)
    {
        var html = [];
        
        var lastSlash = href.lastIndexOf("/");
        var fileName = lastSlash == -1 ? href : href.substr(lastSlash+1);
        
        html.push(
            '<span class="errorMessage">', msg, '</span>', 
            '<div class="objectBox-sourceLink">', fileName, ' (line ', lineNo, ')</div>'
          );
        
        writeRow(html, "error");
    },
    
    clear: function()
    {
        this.element.value = "";
    },
    
    onKeyDown: function(e)
    {
        e = e || event;
        
        var code = e.keyCode;
        
        /*tab, shift, control, alt*/
        if (code != 9 && code != 16 && code != 17 && code != 18)
            this._completing = false;
    
        if (code == 13 /* enter */)
            this.execute();

        else if (code == 27 /* ESC */)
            setTimeout(this.clear, 0);
          
        else if (code == 38 /* up */)
            this.prevCommand();
          
        else if (code == 40 /* down */)
            this.nextCommand();
          
        else if (code == 9 /* tab */)
            this.autocomplete(e.shiftKey);
          
        else
            return;
        
        cancelEvent(e, true);
        return false;
    }
};


// ************************************************************************************************
// 

var reOpenBracket = /[\[\(\{]/;
var reCloseBracket = /[\]\)\}]/;

function getExpressionOffset(command)
{
    // XXXjoe This is kind of a poor-man's JavaScript parser - trying
    // to find the start of the expression that the cursor is inside.
    // Not 100% fool proof, but hey...

    var bracketCount = 0;

    var start = command.length-1;
    for (; start >= 0; --start)
    {
        var c = command[start];
        if ((c == "," || c == ";" || c == " ") && !bracketCount)
            break;
        if (reOpenBracket.test(c))
        {
            if (bracketCount)
                --bracketCount;
            else
                break;
        }
        else if (reCloseBracket.test(c))
            ++bracketCount;
    }

    return start + 1;
}

// ************************************************************************************************
// CommandLine API

var CommandLineAPI =
{
    $: function(id)
    {
        return Firebug.browser.document.getElementById(id)
    },

    $$: function(selector)
    {
        return Firebug.Selector(selector, Firebug.browser.document)
    },    
    dir: Firebug.Console.dir,

    dirxml: Firebug.Console.dirxml
}

Firebug.CommandLine.API = {};
var initializeCommandLineAPI = function initializeCommandLineAPI()
{
    for (var m in CommandLineAPI)
        if (!Firebug.browser.window[m])
            Firebug.CommandLine.API[m] = CommandLineAPI[m];
}




// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************


/*============================================================================
  html
*===========================================================================*/
Firebug.HTML =
{

    appendTreeNode: function(nodeArray, html)
    {
        var reTrim = /^\s+|\s+$/g;
      
        if (!nodeArray.length) nodeArray = [nodeArray];
        
        for (var n=0, node; node=nodeArray[n]; n++)
        {
        
            if (node.nodeType == 1)
            {
              
                var uid = node[cacheID];
                var child = node.childNodes;
                var childLength = child.length;
                var hasSingleTextChild = childLength == 1 && node.firstChild.nodeType == 3;
                
                var nodeName = node.nodeName.toLowerCase();
                
                var nodeControl = !hasSingleTextChild && childLength > 0 ? 
                    ('<div class="nodeControl"></div>') : '';

                
                if(isIE && nodeControl)
                  html.push(nodeControl);
              
                if (typeof uid != 'undefined')
                    html.push(
                        '<div class="objectBox-element" ',
                        cacheID, '="', uid,
                        '" id="', uid,                                                                                        
                        '">',
                        !isIE && nodeControl ? nodeControl: "",                        
                        '&lt;<span class="nodeTag">', nodeName, '</span>'
                      );
                else
                    html.push(
                        '<div class="objectBox-element">&lt;<span class="nodeTag">', 
                        nodeName, '</span>'
                      );
            
                for (var i = 0; i < node.attributes.length; ++i)
                {
                    var attr = node.attributes[i];
                    if (!attr.specified || attr.nodeName == cacheID)
                        continue;
                    
                    html.push('&nbsp;<span class="nodeName">', attr.nodeName.toLowerCase(),
                        '</span>=&quot;<span class="nodeValue">', escapeHTML(attr.nodeValue),
                        '</span>&quot;')
                }
            

                /*
                // source code nodes
                if (nodeName == 'script' || nodeName == 'style')
                {
                  
                    if(document.all){
                        var src = node.innerHTML+'\n';
                       
                    }else {
                        var src = '\n'+node.innerHTML+'\n';
                    }
                    
                    var match = src.match(/\n/g);
                    var num = match ? match.length : 0;
                    var s = [], sl = 0;
                    
                    for(var c=1; c<num; c++){
                        s[sl++] = '<div line="'+c+'">' + c + '</div>';
                    }
                    
                    html.push('&gt;</div><div class="nodeGroup"><div class="nodeChildren"><div class="lineNo">',
                            s.join(''),
                            '</div><pre class="nodeCode">',
                            escapeHTML(src),
                            '</pre>',
                            '</div><div class="objectBox-element">&lt;/<span class="nodeTag">',
                            nodeName,
                            '</span>&gt;</div>',
                            '</div>'
                        );
                      
                
                }/**/
                
                
                // Just a single text node child
                if (hasSingleTextChild)
                {
                    var value = child[0].nodeValue.replace(reTrim, '');
                    if(value)
                    {
                        html.push(
                                '&gt;<span class="nodeText">',
                                escapeHTML(value),
                                '</span>&lt;/<span class="nodeTag">',
                                nodeName,
                                '</span>&gt;</div>'
                            );
                    }
                    else
                      html.push('/&gt;</div>'); // blank text, print as childless node
                
                }
                else if (childLength > 0)
                {
                    html.push('&gt;</div>');
                }
                else 
                    html.push('/&gt;</div>');
          
            } 
            else if (node.nodeType == 3)
            {
                var value = node.nodeValue.replace(reTrim, '');
                if (value)
                    html.push('<div class="nodeText">', escapeHTML(value),
                        '</div>');
            }
          
        }
    },
    
    appendTreeChildren: function(treeNode)
    {
        var doc = Firebug.Chrome.document;
        
        var uid = treeNode.attributes[cacheID].value;
        var parentNode = documentCache[uid];
        
        if (parentNode.childNodes.length == 0) return;
        
        var treeNext = treeNode.nextSibling;
        var treeParent = treeNode.parentNode;
        
        var control = isIE ? treeNode.previousSibling : treeNode.firstChild;
        control.className = 'nodeControl nodeMaximized';
        
        var html = [];
        var children = doc.createElement("div");
        children.className = "nodeChildren";
        this.appendTreeNode(parentNode.childNodes, html);
        children.innerHTML = html.join("");
        
        treeParent.insertBefore(children, treeNext);
        
        var closeElement = doc.createElement("div");
        closeElement.className = "objectBox-element";
        closeElement.innerHTML = '&lt;/<span class="nodeTag">' + 
            parentNode.nodeName.toLowerCase() + '&gt;</span>'
        
        treeParent.insertBefore(closeElement, treeNext);
        
    },
    
    removeTreeChildren: function(treeNode)
    {
        var children = treeNode.nextSibling;
        var closeTag = children.nextSibling;
        
        var control = isIE ? treeNode.previousSibling : treeNode.firstChild;
        control.className = 'nodeControl';
        
        children.parentNode.removeChild(children);  
        closeTag.parentNode.removeChild(closeTag);  
    },
    
    isTreeNodeVisible: function(id)
    {
        return $U(id);
    },
    
    selectTreeNode: function(id)
    {
        id = ""+id;
        var node, stack = [];
        while(id && !this.isTreeNodeVisible(id))
        {
            stack.push(id);
            
            var node = documentCache[id].parentNode;

            if (node && typeof node[cacheID] != "undefined")
                id = ""+node[cacheID];
            else
                break;
        }
        
        stack.push(id);
        
        while(stack.length > 0)
        {
            id = stack.pop();
            node = $U(id);
            
            if (stack.length > 0 && documentCache[id].childNodes.length > 0)
              this.appendTreeChildren(node);
        }
        
        selectElement(node);
        
        fbPanel1.scrollTop = Math.round(node.offsetTop - fbPanel1.clientHeight/2);
    }
    
}

var selectedElement = null
function selectElement(e)
{
    if (e != selectedElement)
    {
        if (selectedElement)
            selectedElement.className = "objectBox-element";
            
        
        e.className = e.className + " selectedElement";

        if (FBL.isFirefox)
            e.style.MozBorderRadius = "2px";
        
        else if (FBL.isSafari)
            e.style.WebkitBorderRadius = "2px";
        
        selectedElement = e;
    }
}

// TODO : Refactor
Firebug.HTML.onTreeClick = function (e)
{
    e = e || event;
    var targ;
    
    if (e.target) targ = e.target;
    else if (e.srcElement) targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
        targ = targ.parentNode;
        
    
    if (targ.className.indexOf('nodeControl') != -1 || targ.className == 'nodeTag')
    {
        if(targ.className == 'nodeTag')
        {
            var control = FBL.isIE ? (targ.parentNode.previousSibling || targ) :
                          (targ.previousSibling.previousSibling || targ);

            selectElement(targ.parentNode);
            
            if (control.className.indexOf('nodeControl') == -1)
                return;
            
        } else
            control = targ;
        
        FBL.cancelEvent(e);
        
        var treeNode = FBL.isIE ? control.nextSibling : control.parentNode;
        
        //FBL.Firebug.Console.log(treeNode);
        
        if (control.className.indexOf(' nodeMaximized') != -1) {
            FBL.Firebug.HTML.removeTreeChildren(treeNode);
        } else {
            FBL.Firebug.HTML.appendTreeChildren(treeNode);
        }
    }
    else if (targ.className == 'nodeValue' || targ.className == 'nodeName')
    {
        var input = FBL.Firebug.Chrome.document.getElementById('treeInput');
        
        input.style.display = "block";
        input.style.left = targ.offsetLeft + 'px';
        input.style.top = FBL.topHeight + targ.offsetTop - FBL.fbPanel1.scrollTop + 'px';
        input.style.width = targ.offsetWidth + 6 + 'px';
        input.value = targ.textContent || targ.innerText;
        input.focus(); 
    }
}

// ************************************************************************************************
}});

FBL.initialize();
