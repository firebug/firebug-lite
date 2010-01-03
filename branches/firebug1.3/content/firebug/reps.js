FBL.ns(function() { with (FBL) {
// ************************************************************************************************

Firebug.Reps = {

    appendText: function(object, html)
    {
        html.push(escapeHTML(objectToString(object)));
    },
    
    appendNull: function(object, html)
    {
        html.push('<span class="objectBox-null">', escapeHTML(objectToString(object)), '</span>');
    },
    
    appendString: function(object, html)
    {
        html.push('<span class="objectBox-string">&quot;', escapeHTML(objectToString(object)),
            '&quot;</span>');
    },
    
    appendInteger: function(object, html)
    {
        html.push('<span class="objectBox-number">', escapeHTML(objectToString(object)), '</span>');
    },
    
    appendFloat: function(object, html)
    {
        html.push('<span class="objectBox-number">', escapeHTML(objectToString(object)), '</span>');
    },
    
    appendFunction: function(object, html)
    {
        var reName = /function ?(.*?)\(/;
        var m = reName.exec(objectToString(object));
        var name = m && m[1] ? m[1] : "function";
        html.push('<span class="objectBox-function">', escapeHTML(name), '()</span>');
    },
    
    appendObject: function(object, html)
    {
        /*
        var rep = Firebug.getRep(object);
        var outputs = [];
        
        rep.tag.tag.compile();
        
        var str = rep.tag.renderHTML({object: object}, outputs);
        html.push(str);
        /**/
        
        try
        {
            if (object == undefined)
                this.appendNull("undefined", html);
            else if (object == null)
                this.appendNull("null", html);
            else if (typeof object == "string")
                this.appendString(object, html);
            else if (typeof object == "number")
                this.appendInteger(object, html);
            else if (typeof object == "boolean")
                this.appendInteger(object, html);
            else if (typeof object == "function")
                this.appendFunction(object, html);
            else if (object.nodeType == 1)
                this.appendSelector(object, html);
            else if (typeof object == "object")
            {
                if (typeof object.length != "undefined")
                    this.appendArray(object, html);
                else
                    this.appendObjectFormatted(object, html);
            }
            else
                this.appendText(object, html);
        }
        catch (exc)
        {
        }
        /**/
    },
        
    appendObjectFormatted: function(object, html)
    {
        var text = objectToString(object);
        var reObject = /\[object (.*?)\]/;
    
        var m = reObject.exec(text);
        html.push('<span class="objectBox-object">', m ? m[1] : text, '</span>')
    },
    
    appendSelector: function(object, html)
    {
        var uid = object[cacheID];
        var uidString = uid ? [cacheID, '="', uid, '"'].join("") : "";
        
        html.push('<span class="objectBox-selector"', uidString, '>');
    
        html.push('<span class="selectorTag">', escapeHTML(object.nodeName.toLowerCase()), '</span>');
        if (object.id)
            html.push('<span class="selectorId">#', escapeHTML(object.id), '</span>');
        if (object.className)
            html.push('<span class="selectorClass">.', escapeHTML(object.className), '</span>');
    
        html.push('</span>');
    },
    
    appendNode: function(node, html)
    {
        if (node.nodeType == 1)
        {
            var uid = node[cacheID];
            var uidString = uid ? [cacheID, '="', uid, '"'].join("") : "";                
            
            html.push(
                '<div class="objectBox-element"', uidString, '">',
                '<span ', cacheID, '="', uid, '" class="nodeBox">',
                '&lt;<span class="nodeTag">', node.nodeName.toLowerCase(), '</span>');
    
            for (var i = 0; i < node.attributes.length; ++i)
            {
                var attr = node.attributes[i];
                if (!attr.specified || attr.nodeName == cacheID)
                    continue;
                
                var name = attr.nodeName.toLowerCase();
                var value = name == "style" ? node.style.cssText : attr.nodeValue;
                
                html.push('&nbsp;<span class="nodeName">', name,
                    '</span>=&quot;<span class="nodeValue">', escapeHTML(value),
                    '</span>&quot;')
            }
    
            if (node.firstChild)
            {
                html.push('&gt;</div><div class="nodeChildren">');
    
                for (var child = node.firstChild; child; child = child.nextSibling)
                    this.appendNode(child, html);
                    
                html.push('</div><div class="objectBox-element">&lt;/<span class="nodeTag">', 
                    node.nodeName.toLowerCase(), '&gt;</span></span></div>');
            }
            else
                html.push('/&gt;</span></div>');
        }
        else if (node.nodeType == 3)
        {
            html.push('<div class="nodeText">', escapeHTML(node.nodeValue),
                '</div>');
        }
    },
    
    appendArray: function(object, html)
    {
        html.push('<span class="objectBox-array"><b>[</b> ');
        
        for (var i = 0, l = object.length, obj; i < l; ++i)
        {
            this.appendObject(object[i], html);
            
            if (i < l-1)
            html.push(', ');
        }
    
        html.push(' <b>]</b></span>');
    }

};



/*
From firebug


    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Reps

    registerRep: function()
    {
        reps.push.apply(reps, arguments);
    },

    setDefaultRep: function(rep)
    {
        defaultRep = rep;
    },


    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Reps

    getRep: function(object)
    {
        var type = typeof(object);
        for (var i = 0; i < reps.length; ++i)
        {
            var rep = reps[i];
            try
            {
                if (rep.supportsObject(object, type))
                    return rep;
            }
            catch (exc)
            {
                if (FBTrace.dumpProperties)
                {
                    FBTrace.dumpProperties("firebug.getRep FAILS at i/reps.length: "+i+"/"+reps.length+" type:"+type+" exc:", exc);
                    FBTrace.dumpProperties("firebug.getRep reps[i]", reps[i]);
                    FBTrace.dumpStack("firebug.getRep");
                }
            }
        }

        return defaultRep;
    },

    getRepObject: function(node)
    {
        var target = null;
        for (var child = node; child; child = child.parentNode)
        {
            if (hasClass(child, "repTarget"))
                target = child;

            if (child.repObject)
            {
                if (!target && hasClass(child, "repIgnore"))
                    break;
                else
                    return child.repObject;
            }
        }
    },

    getRepNode: function(node)
    {
        for (var child = node; child; child = child.parentNode)
        {
            if (child.repObject)
                return child;
        }
    },

    getElementByRepObject: function(element, object)
    {
        for (var child = element.firstChild; child; child = child.nextSibling)
        {
            if (child.repObject == object)
                return child;
        }
    },
/**/


// ************************************************************************************************
}});