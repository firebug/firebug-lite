/* See license.txt for terms of usage */

(function(){
// ************************************************************************************************

// TODO: plugin problem with Dev panel
// TODO: Dev panel doesn't work in persistent mode
// TODO: XHR listener breaks Firebug in Chrome when in persistent mode

// Firebug Lite is already running in persistent mode so we just quit
// TODO: better detection
if (window.Firebug)
    return;

// ************************************************************************************************

var bookmarkletMode = true;

var bookmarkletSkinURL = "https://getfirebug.com/releases/lite/latest/skin/xp/"; // stable
//var bookmarkletSkinURL = "https://getfirebug.com/releases/lite/beta/skin/xp/"; // beta
//var bookmarkletSkinURL = "http://fbug.googlecode.com/svn/lite/branches/firebug1.3/skin/xp/"; // developer


// ************************************************************************************************

//window.FBL = {}; // force exposure in IE global namespace
window.FBDev =
{
    // ********************************************************************************************
    modules:
    [
        // ****************************************************************************************
        // Application Core

        "firebug1.4/lib.js",

        "firebug1.4/i18n.js",

        "firebug1.4/firebug.js",

        "lite/gui.js",
        "firebug1.4/context.js",
        "firebug1.4/chrome.js",
        "lite/chromeSkin.js",

        // firebug1.4 experimental
        //"firebug1.4/chrome2.js",
        "firebug1.4/tabContext.js",
        "firebug1.4/tabWatcher.js",


        // ****************************************************************************************
        // Lite

        "lite/lite.js", // experimental
        "lite/browser.js", // experimental
        "lite/cache.js", // experimental
        "lite/proxy.js", // experimental
        "lite/script.js", // experimental
        "lite/style.js", // experimental


        // ****************************************************************************************
        // Application Classes

        "lite/selector.js",

        "firebug1.4/domplate.js",
        "firebug1.4/reps.js",

        "firebug1.4/editor.js",
        "firebug1.4/inspector.js",

        // ****************************************************************************************
        // Console / CommandLine core

        "firebug1.4/console.js",
        "firebug1.4/consoleInjector.js",

        "firebug1.4/commandLine.js",

        // ****************************************************************************************
        // XHR Watcher

        "lite/xhr.js",
        "firebug1.4/net.js",
        "firebug1.4/spy.js",

        "firebug1.4/jsonViewer.js",
        "firebug1.4/xmlViewer.js",

        // ****************************************************************************************
        // Application Modules/Panels

        "firebug1.4/html.js",

        //"firebug1.4/insideOutBox.js", // HTML experimental
        //"firebug1.4/lib/htmlLib.js", // HTML experimental
        //"firebug1.4/html3.js", // HTML experimental
        //"firebug1.4/html2.js", // HTML experimental

        "firebug1.4/infotip.js", // experimental

        "firebug1.4/css.js",

        //"firebug1.4/script.js",

        "firebug1.4/sourceCache.js", // experimental
        "firebug1.4/sourceFile.js", // experimental
        "firebug1.4/sourceBox.js", // experimental
        "firebug1.4/debugger.js", // experimental


        "firebug1.4/dom.js",

        //"firebug1.4/helloWorld.js",

        // ****************************************************************************************
        // Trace Module/Panel

        "firebug1.4/trace.js",
        "firebug1.4/tracePanel.js",

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
        // FireRainbow


        "firerainbow/chrome/content/codemirror.js",
        "firerainbow/chrome/content/firerainbow.js",
        /**/

        // ****************************************************************************************
        // Plugin

        "lite/plugin.js", // must be the last module loaded

        // ****************************************************************************************
        // Bootstrap
        "lite/boot.js"
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
};

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

    var useDocWrite = true;
    //var useDocWrite = isIE || isSafari;

    var moduleURL, script;
    var scriptTags = [];

    /*
    if (top != window)
    {
        var xhr = getXHRObject();
        var html = "";
        for (var i=0, module; module=FBDev.modules[i]; i++)
        {
            var moduleURL = sourceURL + module + sufix;

            xhr.open("get", moduleURL, false);
            xhr.send();
            html = xhr.responseText;

            script = document.createElement("script");
            script.text = html;
            document.getElementsByTagName("head")[0].appendChild(script);
        }
        return;
    }
    /**/

    // new module loader
    /*
    var length = FBDev.modules.length;
    var loadModule = function(index){
        if (index == length) return;

        var module = FBDev.modules[index];
        var moduleURL = sourceURL + module + sufix;
        var script = document.createElement("script");
        script.src = moduleURL;

        script.onload = function() {
            if ( !script.onloadDone ) {
                script.onloadDone = true;
                loadModule(index+1);
            }
        };
        script.onreadystatechange = function() {
            if ( ( "loaded" === script.readyState || "complete" === script.readyState ) && !script.onloadDone ) {
                script.onloadDone = true;
                loadModule(index+1);
            }
        }

        document.getElementsByTagName("head")[0].appendChild(script);
    };
    loadModule(0);
    /**/


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
    /**/

    waitFirebugLoad();
};

var waitFirebugLoad = function()
{
    if (window && "Firebug" in window)
    {
        try
        {
            loadDevPanel();
        }
        catch (E)
        {
        }
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

            this.panelNode.appendChild(out);
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

            this.selfDebugButton = new Button({
                caption: "Self debug",
                title: "Run Firebug Lite inside Firebug Lite",
                owner: FBDev,
                onClick: function()
                {
                    //Firebug.chrome.window.location = "javascript:(function(F,i,r,e,b,u,g,L,I,T,E){if(F.getElementById(b))return;E=F[i+'NS']&&F.documentElement.namespaceURI;E=E?F[i+'NS'](E,'script'):F[i]('script');E[r]('id',b);E[r]('src',I+g+T);E[r](b,u);(F[e]('head')[0]||F[e]('body')[0]).appendChild(E);E=new Image;E[r]('src',I+L);})(document,'createElement','setAttribute','getElementsByTagName','FirebugLite','4','content/firebug-lite-dev.js','skin/xp/sprite.png','" +
                    //    FBL.Env.Location.baseDir + "','#startOpened');";
                    Firebug.chrome.eval( "(function(F,i,r,e,b,u,g,L,I,T,E){if(F.getElementById(b))return;E=F[i+'NS']&&F.documentElement.namespaceURI;E=E?F[i+'NS'](E,'script'):F[i]('script');E[r]('id',b);E[r]('src',I+g+T);E[r](b,u);(F[e]('head')[0]||F[e]('body')[0]).appendChild(E);E=new Image;E[r]('src',I+L);})(document,'createElement','setAttribute','getElementsByTagName','FirebugLite','4','content/firebug-lite-dev.js','skin/xp/sprite.png','" +
                        FBL.Env.Location.baseDir + "','#startOpened,startInNewWindow,showIconWhenHidden=false');" );

                    Firebug.chrome.eval( "setTimeout(function(){console.info('Have fun!')},2000)" );
                }
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
            this.outputNode = this.panelNode.firstChild;

            this.buildSourceButton.initialize();
            this.buildSkinButton.initialize();
            this.selfDebugButton.initialize();
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

var getXHRObject = function()
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
};

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
})();