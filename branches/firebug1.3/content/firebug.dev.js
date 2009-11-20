(function(){

var bookmarletMode = true;
var bookmarletURL = "http://fbug.googlecode.com/svn/lite/branches/firebug1.3/build/";
var bookmarletSkinURL = "http://fbug.googlecode.com/svn/lite/branches/firebug1.3/skin/xp/";

window.FBDev =
{
    modules:
    [ 
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Application Core
        "firebug/lib.js",
        "firebug/trace.js",
        "firebug/firebug.js",
        "firebug/domplate.js", // not used yet
        "firebug/reps.js",
        "firebug/reps2.js",  // experimental
        "firebug/context.js",
        "firebug/chrome.js",
        "firebug/chrome.injected2.js",
        "firebug/console.js",
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Application Classes
        "firebug/selector.js",
        "firebug/inspector.js",
        "firebug/commandLine.js",
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Application Panels
        "firebug/html.js",
        //"firebug/html2.js", // too experimental
        "firebug/css.js",
        "firebug/script.js",
        "firebug/dom.js", // experimental
        "firebug/tracePanel.js",
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
        var useClosure = false;
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
                
                if(src.indexOf("/") != -1)
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

function loadModules() {
    
    findLocation();
    
    publishedURL = bookmarletMode ? bookmarletSkinURL : skinURL;
    
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