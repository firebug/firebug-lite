FBL.ns(function() { with (FBL) {
// ************************************************************************************************

var Chrome = Firebug.Chrome;

//----------------------------------------------------------------------------
// Popup Chrome
//----------------------------------------------------------------------------
Firebug.Chrome.Popup =
{
    element: null,
    viewport: null,
    document: null,
    
    controllers: null,
    
    onReady: function(doc)
    {
        if (isIE6)
            fixIE6BackgroundImageCache(doc);

        var context = Chrome.Popup;
        
        doc.body.className = "FirebugPopup";
        
        context.controllers = [
            [Chrome.win, "resize", Chrome.draw],
            [Chrome.win, "unload", Chrome.destroy]
          ];
    },

    create: function()
    {
        var injectedMode = Chrome.injectedMode;
        
        var url = injectedMode ? "" : (skinURL + Chrome.interfaceFile);
        
        var height = Chrome.chromeHeight;
        var options = [
            "true,top=",
            Math.max(screen.height - height, 0),
            ",left=0,height=",
            height,
            ",width=",
            screen.width-10, // Opera opens popup in a new tab if it's too big
            ",resizable"          
          ].join("");
        
        var popup = Chrome.Popup.element = window.open(
            url, 
            "popup", 
            options
          );
        
        if (injectedMode)
        {
            var doc = popup.document;
            doc.write("<style>"+ Chrome.Injected.CSS + "</style>");
            doc.write(Chrome.Injected.HTML);
            doc.close();
        }
        
        FBL.frame = popup;
        
        if (popup)
            popup.focus();
        else
        {
            Chrome.Popup.element = null;
            alert("Disable the popup blocker to open the console in another window!")
        }
    }
};


Chrome.context = Chrome.Frame;
if (document.documentElement.getAttribute("debug") == "true")
    Chrome.toggle(true);


// ************************************************************************************************
}});