(function(){

var bookmarletMode = true;
var bookmarletURL = "http://fbug.googlecode.com/svn/trunk/lite/1.3/build/";
var bookmarletSkinURL = "http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/";

window.FBDev =
{
    modules:
    [ 
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Application Core
        "firebug/lib.js",
        "firebug/firebug.js",
        //"firebug/domplate.js", // not used yet
        "firebug/reps.js",
        "firebug/console.js",
        "firebug/context.js",
        "firebug/chrome.js",
        "firebug/chrome.injected.js",
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Application Classes
        "firebug/selector.js",
        "firebug/inspector.js",
        "firebug/commandLine.js",
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Application Panels
        "firebug/html.js",
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Bootstrap
        "firebug/boot.js"
        /**/
    ],
    
    loadChromeApplication: function(chrome)
    {
        FBDev.buildSource(function(source){
            var doc = chrome.document;
            var script = doc.createElement("script");
            doc.getElementsByTagName("head")[0].appendChild(script);
            script.text = source;
        });
    },

    build: function() {
        var out = document.createElement("textarea");
        
        FBDev.buildSource(function(source){
            out.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%;";
            out.appendChild(document.createTextNode(source));
            document.body.appendChild(out);
        });
    },
    
    buildSource: function(callback)
    {
        var source = [];
        var last = FBDev.modules.length-1;
    
        for (var i=0, module; module=FBDev.modules[i]; i++)
        {
            var moduleURL = sourceURL + module;
            
            FBL.Ajax.request({url: moduleURL, i: i, onComplete: function(r,o)
                {
                    source.push(r);
                    
                    if (o.i == last)
                        callback(source.join(""));
                    else
                        source.push("\n\n");
                }
            });
        }        
    },
    
    compressInterace: function()
    {
        var files = [
            ];
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
    }

}

function findLocation() 
{
    var reFirebugFile = /(firebug(?:\.\w+)?\.js)(#.+)?$/;
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
    
    var m = path.match(/([^\/]+)\/$/);
    
    if (path && m)
    {
        sourceURL = path;
        baseURL = path.substr(0, path.length - m[1].length - 1);
        skinURL = baseURL + "skin/classic/";
        fullURL = path + fileName;
        
        /*        
        if (fileOptions == "#app")
            isApplicationContext = true;
            /**/
    }
    else
    {
        throw "Firebug error: Library path not found";
    }
};

function loadModules() {
    
    findLocation();
    
    publishedURL = bookmarletMode ? bookmarletSkinURL : skinURL;
    
    var sufix = isApplicationContext ? "#app" : "";
    
    var useDocWrite = isIE || isSafari;
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
        }
    }
    
    if(useDocWrite)
    {
        document.write(scriptTags.join(""));
    }
};

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

})();