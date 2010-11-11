var isActive = false;
var isOpen = false;
var extensionURL = null;

// *************************************************************************************************

// restore Firebug Lite state
var loadStateData = function()
{
    var FirebugData = localStorage.getItem("Firebug");

    isActive = false;
    isOpen = false;
    extensionURL = chrome.extension.getURL("");
    
    if (FirebugData)
    {
        FirebugData = FirebugData.split(",");
        isActive = FirebugData[0] == "1";
        isOpen = FirebugData[1] == "1";
    }
}

// *************************************************************************************************

// load Firebug Lite application
var loadFirebug = function()
{
    if (isOpen)
        document.documentElement.setAttribute("debug", "true");
    
    injectScriptText("("+listenConsoleCalls+")()");
    
    // TODO: xxxpedro - change to XHR when Issue 41024 is solved
    // Issue 41024: XHR using file: and chrome-extension: protocols not working.
    // http://code.google.com/p/chromium/issues/detail?id=41024
    injectFirebugScript();
}

// *************************************************************************************************

// inject Firebug Lite script into the page
var injectFirebugScript = function(url)
{
    var script = document.createElement("script");
    
    script.src = extensionURL + "firebug-lite-beta.js";
    script.setAttribute("id", "FirebugLite");
    script.setAttribute("firebugIgnore", "true");
    script.setAttribute("extension", "Chrome");
    document.documentElement.appendChild(script);
    
    script.onload = function() {
        // TODO: xxxpedro remove this files when deploy the new structure
        script = document.createElement("script");
        script.src = extensionURL + "googleChrome.js";
        document.documentElement.appendChild(script);
    };
}

// inject a script into the page
var injectScriptText = function(text)
{
    var script = document.createElement("script");
    var parent = document.documentElement;
    
    script.text = text;
    script.setAttribute("id", "FirebugLite");
    script.setAttribute("firebugIgnore", "true");
    script.setAttribute("extension", "Chrome");
    parent.appendChild(script);
    parent.removeChild(script);
}

// *************************************************************************************************

// listen to console calls before Firebug Lite finishes to load
var listenConsoleCalls = function()
{
    // TODO: xxxpedro add all console functions
    var fns = ["log", "info", "warn", "error"];
    
    var listener = {consoleQueue: ["chromeConsoleQueueHack"]};
    var queue = listener.consoleQueue;
    
    for (var i=0, l=fns.length; i<l; i++)
    {
        var fn = fns[i];
        
        (function(fn){
        
            listener[fn] = function()
            {
                queue.push([fn, arguments]);
            }
        
        })(fn);
    }
    
    window.console = listener;
};

// *************************************************************************************************

var listenKeyboardActivation = function()
{
    // TODO: listen to F12 key. if pressed activate Firebug Lite, and open
    
    // TODO: this function could also listen to CTRL+SHIFT+C, triggering
    // Firebug Lite activation, opening it, and starting the inspection,
    // like in Firebug for Firefox 
    
    // TODO: this function should be called also when Firebug Lite is deactivated
};

var stopListeningKeyboardActivation = function()
{
    // TODO: remove listener when Firebug Lite application is activated/loaded
    
    // TODO: remove listener on window onunload (if not removed already)
};

// *************************************************************************************************

// communication with the background page
chrome.extension.onRequest.addListener
(
    function(request, sender, sendResponse)
    {
        // check if Firebug Lite is active
        if (request.name == "FB_isActive")
        {
            loadStateData();
            sendResponse({value: ""+isActive});
        }
        // load Firebug Lite application
        else if (request.name == "FB_loadFirebug")
        {
            setTimeout(function(){
            
                loadStateData();
                
                loadFirebug();
                
                isActive = true;
                var message = isActive ? "FB_enableIcon" : "FB_disableIcon";
                chrome.extension.sendRequest({name: message});
                
                loadChannel();
                
            },0);
            sendResponse({});
        }
        // handle context menu click by sending "FB_contextMenuClick" message 
        // to Firebug Lite application
        else if (request.name == "FB_contextMenuClick")
        {
            // TODO: if not active, activate first, wait the activation to complete
            // and only then dispatch the event to Firebug Lite application
            
            firebugDispatch("FB_contextMenuClick");
        }
        else
            sendResponse({}); // snub them.
    }
);

// *************************************************************************************************

// communication with the page
var channel = null;
var channelEvent;

var loadChannel = function()
{
    channel = document.getElementById("FirebugChannel");

    if (channel)
    {
        channel.addEventListener("FirebugChannelEvent", function() {
            chrome.extension.sendRequest({name: channel.innerText});
        });
        
        channelEvent = document.createEvent("Event");
        channelEvent.initEvent("FirebugChannelEvent", true, true);
    }
}

var firebugDispatch = function(data)
{
    if (!channel) 
        loadChannel();
    
    channel.innerText = data;
    channel.dispatchEvent(channelEvent);
};

// *************************************************************************************************

// startup Firebug Lite if it is active for the current page
loadStateData();

if (isActive)
{
    loadFirebug();
}
else
{
    listenKeyboardActivation();
}

loadChannel();

// *************************************************************************************************

// adjust the browser icon according Firebug Lite's current state
chrome.extension.sendRequest({name: isActive ? "FB_enableIcon" : "FB_disableIcon"});
