/* See license.txt for terms of usage */

define("Lib/CSS", ["FBL"], function(FBL) {

//***********************************************************************************************//
// CSS

FBL.hasClass = function(node, name) // className, className, ...
{
    if (!node || node.nodeType != 1)
        return false;
    else
    {
        for (var i=1; i<arguments.length; ++i)
        {
            var name = arguments[i];
            //var re = new RegExp("(^|\\s)"+name+"($|\\s)");
            //if (!re.exec(node.getAttribute("class")))
            //    return false;
            var className = node.className;//node.getAttribute("class");
            if (!className || className.indexOf(name + " ") == -1)
                return false;
        }

        return true;
    }
};

FBL.setClass = function(node, name)
{
    if (node && !FBL.hasClass(node, name))
        node.className += " " + name + " ";
};

FBL.removeClass = function(node, name)
{
    if (node && node.className)
    {
        var index = node.className.indexOf(name);
        if (index >= 0)
        {
            var size = name.length;
            node.className = node.className.substr(0,index-1) + node.className.substr(index+size);
        }
    }
};

FBL.toggleClass = function(elt, name)
{
    if (FBL.hasClass(elt, name))
    {
        FBL.removeClass(elt, name);
        return false;
    }
    else
    {
        FBL.setClass(elt, name);
        return true;
    }
};

// ********************************************************************************************* //
// Public

return FBL;

// ********************************************************************************************* //
});
