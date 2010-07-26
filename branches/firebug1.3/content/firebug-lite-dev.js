/* See license.txt for terms of usage */

(function(){
// ************************************************************************************************

// ************************************************************************************************
    
var bookmarkletMode = true;

//var bookmarkletSkinURL = "https://getfirebug.com/releases/lite/latest/skin/xp/"; // stable
var bookmarkletSkinURL = "https://getfirebug.com/releases/lite/beta/skin/xp/"; // beta
//var bookmarkletSkinURL = "http://fbug.googlecode.com/svn/lite/branches/firebug1.3/skin/xp/"; // developer


// ************************************************************************************************

window.FBL = {}; // force exposure in IE global namespace
window.FBDev =
{
    // ********************************************************************************************
    modules:
    [ 
        // ****************************************************************************************
        // Application Core
        
        "firebug/lib.js",
        
        "firebug/i18n.js",
        
        "firebug/firebug.js",
        
        "firebug/gui.js",        
        "firebug/context.js",
        "firebug/chrome.js",
        "firebug/chromeSkin.js",
        
        // ****************************************************************************************
        // Application Classes
        
        "firebug/selector.js",
        
        "firebug/domplate.js",
        "firebug/reps.js",
        
        "firebug/editor.js",
        "firebug/inspector.js",
        
        // ****************************************************************************************
        // Console / CommandLine core
        
        "firebug/console.js",
        "firebug/consoleInjector.js",
        
        "firebug/commandLine.js",
        
        // ****************************************************************************************
        // XHR Watcher
        
        "firebug/xhr.js",
        "firebug/net.js",
        "firebug/spy.js",
        
        "firebug/jsonViewer.js",
        "firebug/xmlViewer.js",
        
        // ****************************************************************************************
        // Application Modules/Panels
        
        "firebug/html.js",
        "firebug/css.js",
        "firebug/script.js",
        "firebug/dom.js",
        
        //"firebug/helloWorld.js",
        
        // ****************************************************************************************
        // Trace Module/Panel
        
        "firebug/trace.js",
        "firebug/tracePanel.js",
        
        // ****************************************************************************************
        // Firediff
        
        /*
        "firediff/content/firediff/versionCompat.js",
        "firediff/content/firediff/diff.js",
        "firediff/content/firediff/path.js",
        "firediff/content/firediff/cssModel.js",
        "firediff/content/firediff/events.js",
        "firediff/content/firediff/domEvents.js",
        "firediff/content/firediff/cssEvents.js",
        "firediff/content/firediff/domplate.js",
        "firediff/content/firediff/search.js",
        "firediff/content/firediff/pages.js",
        "firediff/content/firediff/diffModule.js",
        "firediff/content/firediff/diffMonitor.js",
        /**/
        
        // ****************************************************************************************
        // Plugin
        
        "firebug/plugin.js", // must be the last module loaded
        
        // ****************************************************************************************
        // Bootstrap
        "firebug/boot.js"
    ],
    // ********************************************************************************************

    loadChromeApplication: function(chrome)
    {
        FBDev.buildSource(function(source){
            var doc = chrome.document;
            var script = doc.createElement("script");
            doc.getElementsByTagName("head")[0].appendChild(script);
            script.text = source;
        });
    },

    panelBuild: function() {
        var panel = this.getPanel();
        panel.updateOutput("Building Source...");
        
        setTimeout(function(){
            FBDev.buildFullSource(function(source){
                panel.updateOutput(source);
            });
        },0);
    },
    
    panelBuildSkin: function()
    {
        var panel = this.getPanel();
        panel.updateOutput("Building Source...");
        
        setTimeout(function(){
            FBDev.buildSkin(function(source){
                panel.updateOutput(source);
            });
        },0);
    },
    
    build: function() {
        var out = document.createElement("textarea");
        
        FBDev.buildFullSource(function(source){
            out.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%;";
            //out.appendChild(document.createTextNode(source));
            
            out.value = source;
            document.body.appendChild(out);
        });
    },
    
    buildFullSource: function(callback)
    {
        var useClosure = true;
        var source = [];
        
        // remove the boot.js from the list of modules to be included
        // because it will be generated bellow
        var modules = FBDev.modules.slice(0,FBDev.modules.length-1);
        var last = modules.length-1;
        
        if (useClosure)
            source.push("(function(){\n\n");
        
        var htmlUrl = skinURL + "firebug.html",
            cssUrl = skinURL + "firebug.css",
            html,
            css,
            injected;
        
        FBL.Ajax.request({
            url: htmlUrl, 
            onComplete:function(r)
            {
                html = FBDev.compressHTML(r);
            }
        });

        FBL.Ajax.request({
            url: cssUrl, 
            onComplete:function(r)
            {
                css = FBDev.compressCSS(r);
                injected = 
                    "\n\nFBL.ns(function() { with (FBL) {\n" +
                    "// ************************************************************************************************\n\n" +
                    "FirebugChrome.Skin = \n" +
                    "{\n" +
                    "    CSS: '" + css + "',\n" +
                    "    HTML: '" + html + "'\n" +
                    "};\n\n" +
                    "// ************************************************************************************************\n" +
                    "}});\n\n" +
                    "// ************************************************************************************************\n" +
                    "FBL.initialize();\n" +
                    "// ************************************************************************************************\n";
            }
        });
        
        for (var i=0, module; module=modules[i]; i++)
        {
            var moduleURL = sourceURL + module;
            
            if (module.indexOf("chromeSkin") != -1) continue;
            
            FBL.Ajax.request({
                url: moduleURL, 
                i: i, 
                onComplete: function(r,o)
                {
                    source.push(r);
                    
                    if (o.i == last)
                    {
                        //alert("ok")
                        source.push(injected);
                        
                        if (useClosure)
                            source.push("\n})();");

                        callback(source.join(""));
                    }
                    else
                        source.push("\n\n");
                }
            });
        }
    },
    
    buildSource: function(callback)
    {
        var useClosure = true;
        var source = [];
        var last = FBDev.modules.length-1;
        
        if (useClosure)
            source.push("(function(){\n\n");
    
        for (var i=0, module; module=FBDev.modules[i]; i++)
        {
            var moduleURL = sourceURL + module;
            
            FBL.Ajax.request({url: moduleURL, i: i, onComplete: function(r,o)
                {
                    source.push(r);
                    
                    if (o.i == last)
                    {
                        if (useClosure)
                            source.push("\n})();");

                        callback(source.join(""));
                    }
                    else
                        source.push("\n\n");
                }
            });
        }        
    },
    
    buildSkin: function(callback)
    {
        var htmlUrl = skinURL + "firebug.html",
            cssUrl = skinURL + "firebug.css",
            html,
            css,
            injected;
        
        FBL.Ajax.request({
            url: htmlUrl, 
            onComplete:function(r)
            {
                html = FBDev.compressHTML(r);
            }
        });

        FBL.Ajax.request({
            url: cssUrl, 
            onComplete:function(r)
            {
                css = FBDev.compressCSS(r);
                injected = 
                    "/* See license.txt for terms of usage */\n\n" +
                    "FBL.ns(function() { with (FBL) {\n" +
                    "// ************************************************************************************************\n\n" +
                    "FirebugChrome.Skin = \n" +
                    "{\n" +
                    "    HTML: '" + html + "',\n" +
                    "    CSS: '" + css + "'\n" +
                    "};\n\n" +
                    "// ************************************************************************************************\n" +
                    "}});";
                
                callback(injected);
            }
        });
    },
    
    compressSkinHTML: function()
    {
        var url = skinURL + "firebug.html";
        
        var out = document.createElement("textarea");
        
        FBL.Ajax.request({url: url, onComplete:function(r)
            {
                var result = FBDev.compressHTML(r);
                
                out.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%;";
                out.appendChild(document.createTextNode(result));
                document.body.appendChild(out);
            }
        });
    },
    
    compressSkinCSS: function()
    {
        var url = skinURL + "firebug.css";
        
        var out = document.createElement("textarea");
        
        FBL.Ajax.request({url: url, onComplete:function(r)
            {
                var result = FBDev.compressCSS(r);
                
                out.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%;";
                out.appendChild(document.createTextNode(result));
                document.body.appendChild(out);
            }
        });
        
    },
    
    compressHTML: function(html)
    {
        var reHTMLComment = /(<!--([^-]|-(?!->))*-->)/g;
        
        return html.replace(/^[\s\S]*<\s*body.*>\s*|\s*<\s*\/body.*>[\s\S]*$/gm, "").
            replace(reHTMLComment, "").
            replace(/\s\s/gm, "").
            replace(/\s+</gm, "<").
            replace(/<\s+/gm, "<").
            replace(/\s+>/gm, ">").
            replace(/>\s+/gm, ">").
            replace(/\s+\/>/gm, "/>");
    },

    compressCSS: function(css)
    {
        var reComment = /(\/\/.*)\n/g;
        var reMultiComment = /(\/\*([^\*]|\*(?!\/))*\*\/)/g;

        return css.replace(reComment, "").
            replace(reMultiComment, "").
            replace(/url\(/gi, "url("+publishedURL).
            replace(/\s\s/gm, "").
            replace(/\s+\{/gm, "{").
            replace(/\{\s+/gm, "{").
            replace(/\s+\}/gm, "}").
            replace(/\}\s+/gm, "}").
            replace(/\s+\:/gm, ":").            
            replace(/\:\s+/gm, ":").            
            replace(/,\s+/gm, ",");            
    },
    
    getPanel: function()
    {
        return Firebug.chrome.getPanel("Dev");
    }
}

// ************************************************************************************************

function findLocation() 
{
    var reFirebugFile = /(firebug-lite(?:-\w+)?\.js)(#.+)?$/;
    var rePath = /^(.*\/)/;
    var reProtocol = /^\w+:\/\//;
    
    var head = document.getElementsByTagName("head")[0];
    
    var path = null;
    
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
                path = rePath.exec(location.href)[1];
                
                if (rel)
                {
                    var lastFolder = /^(.*\/)[^\/]+\/$/;
                    
                    var j = rel[1].length/3;
                    var p;
                    while (j-- > 0)
                        path = lastFolder.exec(path)[1];

                    path += rel[2];
                }
                else if(src.indexOf("/") != -1)
                {
                    // "./some/path"
                    if(/^\.\/./.test(src))
                    {
                        path += src.substring(2);
                    }
                    // "/some/path"
                    else if(/^\/./.test(src))
                    {
                        var domain = /^(\w+:\/\/[^\/]+)/.exec(path);
                        path = domain[1] + src;
                    }
                    // "some/path"
                    else
                    {
                        path += src;
                    }
                }
            }
            
            break;
        }
    }

    var m = path.match(/([^\/]+)\/$/);
    
    if (path && m)
    {
        sourceURL = path;
        baseURL = path.substr(0, path.length - m[1].length - 1);
        skinURL = baseURL + "skin/xp/";
        fullURL = path + fileName;
    }
    else
    {
        throw "Firebug error: Library path not found";
    }
};

// ************************************************************************************************

function loadModules() {
    
    findLocation();
    
    publishedURL = bookmarkletMode ? bookmarkletSkinURL : skinURL;
    
    var sufix = isApplicationContext ? "#app" : "";
    
    var useDocWrite = isIE || isSafari;
    //var useDocWrite = isIE;
    
    var moduleURL, script;
    var scriptTags = [];
    
    for (var i=0, module; module=FBDev.modules[i]; i++)
    {
        var moduleURL = sourceURL + module + sufix;
        
        if(useDocWrite)
        {
            scriptTags.push("<script src='", moduleURL, "'><\/script>");
        }
        else
        {
            script = document.createElement("script");
            script.src = moduleURL;
            
            document.getElementsByTagName("head")[0].appendChild(script);
            //document.getElementsByTagName("body")[0].appendChild(script);
        }
    }
    
    if(useDocWrite)
    {
        document.write(scriptTags.join(""));
    }
    
    waitFirebugLoad();
};

var waitFirebugLoad = function()
{
    if (window && "Firebug" in window)
    {
        loadDevPanel();
    }
    else
        setTimeout(waitFirebugLoad, 0);
};

// ************************************************************************************************

var loadDevPanel = function() { with(FBL) { 

    // ********************************************************************************************
    // FBTrace Panel
    
    function DevPanel(){};
    
    DevPanel.prototype = extend(Firebug.Panel,
    {
        name: "Dev",
        title: "Dev",
        
        options: {
            hasToolButtons: true,
            innerHTMLSync: true
        },
        
        create: function(){
            Firebug.Panel.create.apply(this, arguments);
            
            var doc = Firebug.chrome.document;
            var out = doc.createElement("textarea");
            out.id = "fbDevOutput";
            out.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; padding: 0;";
            
            this.contentNode.appendChild(out);
            this.outputNode = out;
            
            this.buildSourceButton = new Button({
                caption: "Build Source",
                title: "Build full source code",
                owner: FBDev,
                onClick: FBDev.panelBuild
            });
            
            this.buildSkinButton = new Button({
                caption: "Build Skin",
                title: "Build skin source code",
                owner: FBDev,
                onClick: FBDev.panelBuildSkin
            });
        },
        
        updateOutput: function(output)
        {
            var doc = Firebug.chrome.document;
            
            if (isIE)
                this.outputNode.innerText = output;
            else
                this.outputNode.textContent = output;
        },
        
        initialize: function(){
            Firebug.Panel.initialize.apply(this, arguments);
            
            this.containerNode.style.overflow = "hidden";
            this.outputNode = this.contentNode.firstChild;                
            
            this.buildSourceButton.initialize();
            this.buildSkinButton.initialize();
        },
        
        shutdown: function()
        {
            this.containerNode.style.overflow = "";
        }
        
    });
    
    // ********************************************************************************************
    
    Firebug.registerPanel(DevPanel);
}};

// ************************************************************************************************
var publishedURL = "";
var baseURL = "";
var sourceURL = "";
var skinURL = "";
var fullURL = "";
var isApplicationContext = false;

var isFirefox = navigator.userAgent.indexOf("Firefox") != -1;
var isIE = navigator.userAgent.indexOf("MSIE") != -1;
var isOpera = navigator.userAgent.indexOf("Opera") != -1;
var isSafari = navigator.userAgent.indexOf("AppleWebKit") != -1;

loadModules();
// ************************************************************************************************


// ************************************************************************************************
// ************************************************************************************************
// ************************************************************************************************
var FTrace = function()
{
    var getFuncName = function getFuncName (f)
    {
        if (f.getName instanceof Function)
            return f.getName();
        if (f.name) // in FireFox, Function objects have a name property...
            return f.name;
        
        var name = f.toString().match(/function\s*([_$\w\d]*)/)[1];
        return name || "anonymous";
    };
    
    var wasVisited = function(fn)
    {
        for (var i=0, l=stack.length; i<l; i++)
        {
            if (stack[i] == fn)
                return true;
        }
        
        return false;
    };

    var stack = [];
    
    var traceLabel = "Stack Trace";
    
    console.group(traceLabel);
    
    var xcount = 0;
    
    for (var fn = arguments.callee.caller; fn; fn = fn.caller)
    {
        if (wasVisited(fn)) break;
        
        stack.push(fn);
        
        var html = [ ""+ ++xcount +getFuncName(fn), "(" ];

        for (var i = 0, l = fn.arguments.length; i < l; ++i)
        {
            if (i)
                html.push(", ");
            
            Firebug.Reps.appendObject(fn.arguments[i], html);
        }

        html.push(")");
        //Firebug.Console.logRow(html, "stackTrace");
        Firebug.Console.log(html, Firebug.browser, "stackTrace");
    }
    
    console.groupEnd(traceLabel);
    
    //return Firebug.Console.LOG_COMMAND;
    
    //############################################################################################
    
    try
    {
        (0)();
    }
    catch(e)
    {
        var result = e;
        
        //Firebug.Console.dir(result);
        //Firebug.Console.log(result.type);
        
        var stack = 
            result.stack || // Firefox / Google Chrome 
            result.stacktrace || // Opera
            "";
        
        //stack = stack.replace(/[\n]/g, "\n--------------------\n");
        stack = stack.replace(/\n\r|\r\n/g, "\n"); // normalize line breaks
        var items = stack.split(/[\n\r]/);
        
        // props are:
        // ---------------
        // function name
        // function parameters (Firefox)
        // function location? (Google Chrome, when file is unknown)
        // file URL
        // line number
        // column number (Google Chrome)
        
        
        // Google Chrome
        if (FBL.isSafari)
        {
            //var reChromeStackItem = /^\s+at\s+([^\(]+)\s\((.*)\)$/;
            //var reChromeStackItem = /^\s+at\s+(.*)((?:http|https|ftp|file):\/\/.*)$/;
            var reChromeStackItem = /^\s+at\s+(.*)((?:http|https|ftp|file):\/\/.*)$/;
            
            var reChromeStackItemName = /\s*\($/;
            var reChromeStackItemValue = /^(.+)\:(\d+\:\d+)\)?$/;
            
            var xcount = 0;
            for (var i=3, length=items.length; i<length; i++)
            {
                var item = items[i];
                var match = item.match(reChromeStackItem);
                
                Firebug.Console.log("["+ ++xcount +"]--------------------------");
                Firebug.Console.log(item);
                Firebug.Console.log("................");
                
                if (match)
                {
                    var name = match[1];
                    if (name)
                        name = name.replace(reChromeStackItemName, "");
                    
                    Firebug.Console.log("name: "+name);
                    
                    var value = match[2].match(reChromeStackItemValue);
                    
                    if (value)
                    {
                        Firebug.Console.log("url: "+value[1]);
                        Firebug.Console.log("line: "+value[2]);
                    }
                    else
                        Firebug.Console.log(match[2]);
                    
                }                
            }
        }
        /**/
        
        else if (FBL.isFirefox)
        {
            // Firefox
            var reFirefoxStackItem = /^(.*)@(.*)$/;
            var reFirefoxStackItemValue = /^(.+)\:(\d+)$/;
            
            for (var i=0, length=items.length; i<length; i++)
            {
                var item = items[i];
                var match = item.match(reFirefoxStackItem);
                
                if (match)
                {
                    Firebug.Console.logFormatted([match[1]]);
                    
                    var value = match[2].match(reFirefoxStackItemValue);
                    
                    if (value)
                    {
                        Firebug.Console.logFormatted([value[1]]);
                        Firebug.Console.logFormatted([value[2]]);
                    }
                    else
                        Firebug.Console.logFormatted([match[2]]);
                    
                    Firebug.Console.logFormatted(["--------------------------"]);
                }                
            }
        }
        /**/
        
        else if (FBL.isOpera)
        {
            // Opera
            var reOperaStackItem = /^\s\s(?:\.\.\.\s\s)?Line\s(\d+)\sof\s(.+)$/;
            var reOperaStackItemValue = /^linked\sscript\s(.+)$/;
            
            for (var i=0, length=items.length; i<length; i+=2)
            {
                var item = items[i];
                
                var match = item.match(reOperaStackItem);
                
                if (match)
                {
                    Firebug.Console.log(match[1]);
                    
                    var value = match[2].match(reOperaStackItemValue);
                    
                    if (value)
                    {
                        Firebug.Console.log(value[1]);
                    }
                    else
                        Firebug.Console.log(match[2]);
                    
                    Firebug.Console.log("--------------------------");
                }                
            }
        }
        /**/
        
        Firebug.Console.log(result.stack);
    }
};
// ************************************************************************************************
// ************************************************************************************************
// ************************************************************************************************

// ************************************************************************************************
})();

/*
setTimeout(function timeOut(){
    
    var namespace = 
    {
        fn: function fn()
        {
            namespace.callTrace();
        },
        
        callTrace: function callTrace()
        {
            var extraCall = function extraCall(a,b) {
                console.trace();
            };
            extraCall(1,3);
        }
    }
    
    var onClick = function onClick(){
        namespace.fn();
    };
    
    var obj = {};
    onClick = FBL.bind(onClick, obj);
    
    FBL.addEvent(document.getElementById("build"), "click", onClick);
    
}, 2000)
/**/