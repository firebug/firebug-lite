/* See license.txt for terms of usage */

FBL.ns(function() { with (FBL) {

// ********************************************************************************************* //
// Constants

var Ci = Components.interfaces;
var Cc = Components.classes;
var Cu = Components.utils;

// Get ModuleLoader implementation (it's Mozilla JS code module)
Components.utils["import"]("resource://firebug/moduleLoader.js");

// ********************************************************************************************* //
// Firebug Panel

var panelName = "HelloModule";

/**
 * Panel implementation
 */
function HelloModulePanel() {}
HelloModulePanel.prototype = extend(Firebug.Panel,
{
    name: panelName,
    title: "Hello Module!",

    initialize: function()
    {
        Firebug.Panel.initialize.apply(this, arguments);

        this.require = (new ModuleLoader(null, {
            context:"resource://hellomodule/",
            baseUrl:"resource://hellomodule/"}
        )).loadDepsThenCallback;
    },

    show: function(state)
    {
        var self = this;
        this.require(["dom-tree.js"], function(module)
        {
            var domTree = new module.DomTree(FBL.unwrapObject(self.context.window));
            domTree.append(self.panelNode);
        });
    }
});

// ********************************************************************************************* //

Firebug.HelloModuleModel = extend(Firebug.Module,
{
    onLoadModules: function(context)
    {
        // Create Module Loader implementation for specific path.
        var require = (new ModuleLoader(null, {
            context:"resource://hellomodule/",
            baseUrl:"resource://hellomodule/"}
        )).loadDepsThenCallback;

        require(["dom-tree.js", "add.js", "subtract.js"],
            function(DomTree, AddModule, SubtractModule)
            {
                try
                {
                    FBTrace.sysout("helloModule; All modules loaded using relative URLs!");
                    FBTrace.sysout("1 + 2 = " + AddModule.add(1, 2));
                    FBTrace.sysout("3 - 1 = " + SubtractModule.subtract(3, 1));
                }
                catch (err)
                {
                    FBTrace.sysout("helloModule; EXCEPTION " + err, err);
                }
            }
        );
    }
});

// ********************************************************************************************* //
// Registration

Firebug.registerPanel(HelloModulePanel);
Firebug.registerModule(Firebug.HelloModuleModel);
Firebug.registerStylesheet("chrome://hellomodule/skin/domTree.css");

// ********************************************************************************************* //
}});
