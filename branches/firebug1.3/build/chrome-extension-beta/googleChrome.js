/* See license.txt for terms of usage */

Firebug.extend(function(FBL) { with (FBL) {
// ************************************************************************************************

if (!Env.isChromeExtension) return;

// ************************************************************************************************
// local variables

var channel;
var channelEvent;
var contextMenuElement;

// ************************************************************************************************
// GoogleChrome Module

Firebug.GoogleChrome = extend(Firebug.Module,
{
    initialize: function()
    {
        var doc = FBL.Env.browser.document;
        
        if (!doc.getElementById("FirebugChannel"))
        {
            channel = doc.createElement("div");
            channel.id = "FirebugChannel";
            channel.firebugIgnore = true;
            channel.style.display = "none";
            doc.documentElement.insertBefore(channel, doc.documentElement.firstChild);
            
            channelEvent = document.createEvent("Event");
            channelEvent.initEvent("FirebugChannelEvent", true, true);
            
            channel.addEventListener("FirebugChannelEvent", onFirebugChannelEvent);
        }
        
        // TODO: remove event listener at window onunload
        Firebug.context.window.addEventListener("contextmenu", onContextMenu);
    },

    dispatch: function(message)
    {
        channel.innerText = message;
        channel.dispatchEvent(channelEvent);
    }
});

// ************************************************************************************************
// internals

var onContextMenu = function(event)
{
    contextMenuElement = event.target;
};

var onFirebugChannelEvent = function()
{
    var name = channel.innerText;
    
    if (name == "FB_contextMenuClick")
    {
        // TODO: if not open, open it first
        
        Firebug.chrome.selectPanel("HTML");
        Firebug.HTML.select(contextMenuElement);
    }
};

// ************************************************************************************************

Firebug.registerModule(Firebug.GoogleChrome);

// ************************************************************************************************
}});