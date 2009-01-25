FBL.ns(function() { with (FBL) {
// ************************************************************************************************

FBL.version = "1.2.2Xa";


// ************************************************************************************************
// Firebug

FBL.Firebug = 
{
    firebuglite: FBL.version
};

// ************************************************************************************************
// APIs

FBL.ConsoleAPI = inherit(FBL.Firebug);
 
FBL.ChromeAPI = inherit(FBL.Firebug); 


// ************************************************************************************************
// Internal variables

FBL.cacheID = "___FBL_";
FBL.alternateNS = "console2";
FBL.consoleNS = "console";
FBL.documentCache = {};
FBL.sourceURL = null;
FBL.baseURL = null;
FBL.skinURL = null;


// ************************************************************************************************
// Internal functions

extend(FBL,  
{
    onReady: function()
    {
        cacheDocument();
        findLocation();
        registerPublicNamespaces();
        
        var module;
        for(var name in Firebug)
        {
            module = Firebug[name];
            if(typeof module.onReady == "function")
                module.onReady();
        }
        
        if (isIE6)
            fixIE6BackgroundImageCache();
    },
  
    cacheDocument: function()
    {
        var els = document.getElementsByTagName("*");
        for (var i=0, l=els.length, el; i<l; i++)
        {
            el = els[i];
            el[cacheID] = i;
            documentCache[i] = el;
        }
    },
    
    findLocation: function() 
    {
        var rePath = /^(.*\/)[^\/]+\.\w+.*$/;
        var reProtocol = /^\w+:\/\//;
        var head = document.documentElement.firstChild;
        var path = "";
        
        for(var i=0, c=head.childNodes, ci; ci=c[i]; i++)
        {
            if ( ci.nodeName == "SCRIPT" && 
                 /firebug.*\.js/.test(ci.src) )
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
        
        var m = path.match(/([^\/]+)\/$/);
        
        if (path && m)
        {
            sourceURL = path;
            baseURL = path.substr(0, path.length - m[1].length - 1);
            skinURL = baseURL + "skin/classic/";
        }
        else
        {
            //throw "N�o foi poss�vel encontrar o caminho automaticamente!";
        }
    },
    
    registerPublicNamespaces: function()
    {
        var isFirebugInstalled = isFirefox && window.console && window.console.firebug;
        FBL.NS = isFirebugInstalled ? FBL.alternateNS : "console";
      
        window[NS] = ConsoleAPI;
        FBL.loaded = true;
    }
  
});


// ************************************************************************************************
}});