(function(){

var bookmarletMode = true;
var bookmarletURL = "http://pedrosimonetti.googlepages.com/";

var publishedURL = "";
var baseURL = "";
var sourceURL = "";
var skinURL = "";

var modules = 
[
    'lib.js',
    
    'firebug.js',
    
    'firebug/object/reps.js',
    'firebug/object/selector.js',
    'firebug/console.js',
    'firebug/commandLine.js',

    'firebug/chrome.js',
    'firebug/chrome/frame.js',
    'firebug/chrome/popup.js',
    'firebug/chrome/injected.js',
    
    'firebug/object/inspector.js',
    'firebug/object/html.js',
    
    /*
    'firebug/script/tokens.js',
    'firebug/script/parse.js',
    'firebug/script/json2.js',    
    'firebug/script/debugger.js',/**/
    
    'firebug/boot.js'
];


var isFirefox = navigator.userAgent.indexOf('Firefox') != -1;
var isIE = navigator.userAgent.indexOf('MSIE') != -1;
var isOpera = navigator.userAgent.indexOf('Opera') != -1;
var isSafari = navigator.userAgent.indexOf('AppleWebKit') != -1;


var API =
{

    build: function() {
        var s = document.getElementsByTagName("script"); 
        var result = [];
        
        var out = document.createElement("textarea");
        
        //result.push(["(function(){"]);
        
        for(var i=1, l=s.length; i<l-1; i++)
        {
            FBL.Ajax.request({url: s[i].src, i: i, onComplete:function(r,o)
                {
                    result.push(r, o.i < (l-2) ? "\n\n" : "");
                    
                    if(o.i == (l-2))
                    {
                        //result.push(["\n})();"]);
                        if (bookmarletMode)
                            result.push(["FBL.Firebug.Chrome.toggle(true);"]);
                        
                        out.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%;";
                        out.appendChild(document.createTextNode(result.join("")));
                        document.body.appendChild(out);
                    }
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
                var result = FBL.dev.compressHTML(r);
                
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
                var result = FBL.dev.compressCSS(r);
                
                out.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%;";
                out.appendChild(document.createTextNode(result));
                document.body.appendChild(out);
            }
        });
        
    },
    
    compressHTML: function(html)
    {
        return html.replace(/^[\s\S]*<\s*body.*>\s*|\s*<\s*\/body.*>[\s\S]*$/gm, "").
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

function loadModules() {
    findLocation();
    
    publishedURL = bookmarletMode ? bookmarletURL : skinURL;
    
    for (var i=0, module, m=modules; module=m[i]; i++)
        loadScript(sourceURL + module);
        
    waitForFBL();
};

function findLocation() 
{
    var rePath = /^(.*\/)[^\/]+\.\w+.*$/;
    var reProtocol = /^\w+:\/\//;
    var head = document.documentElement.firstChild;
    var path = null;
    
    for(var i=0, c=head.childNodes, ci; ci=c[i]; i++)
    {
        if ( ci.nodeName == 'SCRIPT' && 
            (ci.src.indexOf('devmode.js') != -1) )
        {
          
            if (reProtocol.test(ci.src)) {
                // absolute path
                path = rePath.exec(ci.src)[1];
              
            }
            else
            {
                // relative path
                var r = rePath.exec(ci.src);
                var src = r ? r[1] : ci.src;
                var rel = /^((\.\.\/)+)(.*)/.exec(src);
                var lastFolder = /^(.*\/)\w+\/$/;
                path = rePath.exec(location.href)[1];
                
                if (rel)
                {
                    var j = rel[1].length/3;
                    var p;
                    while (j-- > 0)
                        path = lastFolder.exec(path)[1];

                    path += rel[3];
                }
            }
            
            break;
        }
    }
    
    if (path && /content\/$/.test(path))
    {
        sourceURL = path;
        baseURL = path.substr(0, path.length-8);
        skinURL = baseURL + "skin/classic/";
    }
    else
    {
        throw 'Firebug error: Library path not found';
    }
};

/*
 * Carrega o script dinamicamente.
 */
function loadScript(url)
{
    var agent = navigator.userAgent;

    if (isIE || isSafari)
        document.write('<scr'+'ipt src="' + url + '"><\/scr'+'ipt>');
       
    else
    {
        var script = document.createElement('script');
        script.src = url;
        document.documentElement.firstChild.appendChild(script);
    }
};

function waitForFBL()
{
    if(document.body && window.FBL)
        onReady();
    else
        setTimeout(waitForFBL, 200);
}

function onReady()
{
    FBL.dev = API;
}

loadModules();

})();
