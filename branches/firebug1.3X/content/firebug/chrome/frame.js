FBL.ns(function() { with (FBL) {
// ************************************************************************************************

var Chrome = Firebug.Chrome;

//----------------------------------------------------------------------------
// Frame Chrome
//----------------------------------------------------------------------------
Firebug.Chrome.Frame = inherit(Firebug.Chrome,
{
    element: null,
    viewport: null,
    document: null,
    
    isVisible: false, 
    scrollHandler: null,
    
    onReady: function(doc)
    {
        var context = Chrome.Frame;
        
        context.controllers = [
            [window, "resize", Chrome.draw],
            [window, "unload", Chrome.destroy]
          ];
          
        if (isIE) {
            context.scrollHandler = [window, "scroll", context.fixPosition];
            //addEvent.apply(this, context.scrollHandler);
        }
    
        frame.style.visibility = context.isVisible ? "visible" : "hidden";    
    },

    create: function(){
    
        if (Chrome.Frame.element)
            return;
    
        var injectedMode = Chrome.injectedMode;
        
        frame = Chrome.element = Chrome.Frame.element = document.createElement("iframe");
        
        Chrome.element = Chrome.Frame.element = frame;
        frame.id = "Firebug";
        frame.setAttribute("id", "FirebugChrome");
        frame.setAttribute("frameBorder", "0");
        frame.style.visibility = "hidden";
        frame.style.zIndex = "2147483647"; // MAX z-index = 2147483647
        frame.style.position = document.all ? "absolute" : "fixed";
        frame.style.width = "100%"; // "102%"; IE auto margin bug
        frame.style.left = "0";
        frame.style.bottom = "-1px";
        frame.style.height = Chrome.chromeHeight + "px";
        
        
        if (!injectedMode)
            frame.setAttribute("src", skinURL+"firebug.html");

        document.body.appendChild(frame);
        
        if (injectedMode)
        {
            var doc = frame.contentWindow.document;
            doc.write('<style>'+ Chrome.Injected.CSS + '</style>');
            doc.write(Chrome.Injected.HTML);
            doc.close();
        }
    },
    
    
    fixPosition: function()
    {
        var maxHeight = document.body.clientHeight;
        
        //var height = Chrome._maximized ? maxHeight-1 : Chrome._height;
        var height = Chrome.chromeHeight;
        
        Chrome.elementStyle.top = maxHeight - height + document.body.scrollTop + "px"; 
    }
});

FBL.createFrame = Chrome.Frame.create;

// ************************************************************************************************
}});