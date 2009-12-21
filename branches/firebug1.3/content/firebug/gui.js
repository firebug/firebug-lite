FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// Controller

FBL.Controller = {
        
    controllers: null,
    controllerContext: null,
    
    initialize: function(context)
    {
        this.controllers = [];
        this.controllerContext = context || Firebug.chrome;
    },
    
    shutdown: function()
    {
        this.removeControllers();
    },
    
    addController: function()
    {
        for (var i=0, arg; arg=arguments[i]; i++)
        {
            // If the first argument is a string, make a selector query 
            // within the controller node context
            if (typeof arg[0] == "string")
            {
                arg[0] = $$(arg[0], this.controllerContext);
            }
            
            // bind the handler to the proper context
            var handler = arg[2];
            arg[2] = bind(handler, this);
            // save the original handler as an extra-argument, so we can
            // look for it later, when removing a particular controller            
            arg[3] = handler;
            
            this.controllers.push(arg);
            addEvent.apply(this, arg);
        }
    },
    
    removeController: function()
    {
        for (var i=0, arg; arg=arguments[i]; i++)
        {
            for (var j=0, c; c=this.controllers[j]; j++)
            {
                if (arg[0] == c[0] && arg[1] == c[1] && arg[2] == c[3])
                    removeEvent.apply(this, c);
            }
        }
    },
    
    removeControllers: function()
    {
        for (var i=0, c; c=this.controllers[i]; i++)
        {
            removeEvent.apply(this, c);
        }
    }
};


// ************************************************************************************************
// PanelBar

FBL.PanelBar = 
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    selectedPanel: null,
    isSidePanelBar: null,
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    create: function(isSidePanelBar)
    {
        this.panelMap = {};
        this.isSidePanelBar = isSidePanelBar;
        
        var panels = Firebug.panelTypes;
        for (var i=0, p; p=panels[i]; i++)
        {
            if (isSidePanelBar && p.prototype.parentPanel || 
                !isSidePanelBar && !p.prototype.parentPanel)
            {
                this.addPanel(p.prototype.name);
            }
        }
    },
    
    destroy: function()
    {
        PanelBar.shutdown.call(this);
        
        for (var name in this.panelMap)
        {
            this.removePanel(name);
            
            var panel = this.panelMap[name];
            panel.destroy();
            
            this.panelMap[name] = null;
            delete this.panelMap[name];
        }
        
        this.panelMap = null;
    },
    
    initialize: function()
    {
        for(var name in this.panelMap)
        {
            (function(self, name){
                
                // tab click handler
                var onTabClick = function onTabClick()
                { 
                    self.selectPanel(name);
                    return false;
                };
                
                Firebug.chrome.addController([self.panelMap[name].tabNode, "mousedown", onTabClick]);
                
            })(this, name);
        }
    },
    
    shutdown: function()
    {
        var selectedPanel = this.selectedPanel;
        
        if (selectedPanel)
        {
            removeClass(selectedPanel.tabNode, "fbSelectedTab");
            selectedPanel.hide();
            selectedPanel.shutdown();
        }
        
        this.selectedPanel = null;
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    addPanel: function(panelName, parentPanel)
    {
        var PanelType = Firebug.panelTypeMap[panelName];
        var panel = this.panelMap[panelName] = new PanelType();
        
        panel.create();
    },
    
    removePanel: function(panelName)
    {
        var panel = this.panelMap[panelName];
        if (panel.hasOwnProperty(panelName))
            panel.destroy();
    },
    
    selectPanel: function(panelName)
    {
        var selectedPanel = this.selectedPanel;
        var panel = this.panelMap[panelName];
        
        if (panel && selectedPanel != panel)
        {
            if (selectedPanel)
            {
                removeClass(selectedPanel.tabNode, "fbSelectedTab");
                selectedPanel.hide();
                selectedPanel.shutdown();
            }
            
            if (!panel.parentPanel)
                FirebugChrome.selectedPanelName = panelName;
            
            this.selectedPanel = panel;
            
            setClass(panel.tabNode, "fbSelectedTab");
            panel.initialize();
            panel.show();
        }
    },
    
    getPanel: function(panelName)
    {
        var panel = this.panelMap[panelName];
        
        return panel;
    }
   
};

//************************************************************************************************
// Button

FBL.Button = function(options)
{
    options = options || {};
    
    this.state = "unpressed";
    this.display = "unpressed";
    
    this.type = options.type || "normal";
    
    this.onClick = options.onClick;
    this.onPress = options.onPress;
    this.onUnpress = options.onUnpress;
    
    if (options.node)
    {
        this.node = options.node
        this.owner = options.owner;
        this.container = this.node.parentNode;
    }
    else
    {
        var caption = options.caption || "caption";
        var title = options.title || "title";
        
        this.owner = this.module = options.module;
        this.panel = options.panel || this.module.getPanel();
        this.container = this.panel.toolButtonsNode;
    
        this.node = createElement("a", {
            className: "fbButton fbHover",
            title: title,
            innerHTML: caption
        });
        
        this.container.appendChild(this.node);
    }
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

Button.prototype = extend(Controller,
{
    type: null,
    
    node: null,
    owner: null,
    
    module: null,
    
    panel: null,
    container: null,
    
    state: null,
    display: null,
    
    destroy: function()
    {
        this.shutdown();
        
        this.container.removeChild(this.node);
    },
    
    initialize: function()
    {
        Controller.initialize.apply(this);
        var node = this.node;
        
        this.addController([node, "mousedown", this.handlePress]);
        
        if (this.type == "normal")
            this.addController(
                [node, "mouseup", this.handleUnpress],
                [node, "mouseout", this.handleUnpress],
                [node, "click", this.handleClick]
            );
    },
    
    shutdown: function()
    {
        Controller.shutdown.apply(this);
    },
    
    restore: function()
    {
        this.changeState("unpressed");
    },
    
    changeState: function(state)
    {
        this.state = state;
        this.changeDisplay(state);
    },
    
    changeDisplay: function(display)
    {
        if (display != this.display)
        {
            if (display == "pressed")
            {
                setClass(this.node, "fbBtnPressed");
            }
            else if (display == "unpressed")
            {
                removeClass(this.node, "fbBtnPressed");
            }
            this.display = display;
        }
    },
    
    handlePress: function(event)
    {
        cancelEvent(event, true);
        
        if (this.type == "normal")
        {
            this.changeDisplay("pressed");
            this.beforeClick = true;
        }
        else if (this.type == "toggle")
        {
            if (this.state == "pressed")
            {
                this.changeState("unpressed");
                
                if (this.onUnpress)
                    this.onUnpress.apply(this.owner);
            }
            else
            {
                this.changeState("pressed");
                
                if (this.onPress)
                    this.onPress.apply(this.owner);
                
            }
        }
        
        return false;
    },
    
    handleUnpress: function(event)
    {
        cancelEvent(event, true);
        
        if (this.beforeClick)
            this.changeDisplay("unpressed");
        
        return false;
    },
    
    handleClick: function(event)
    {
        cancelEvent(event, true);
        
        if (this.type == "normal")
        {
            if (this.onClick)
                this.onClick.apply(this.owner);
            
            this.changeState("unpressed");
        }
        
        this.beforeClick = false;
        
        return false;
    },
    
    // should be place inside module
    addButton: function(caption, title, handler)
    {
    },
    
    removeAllButtons: function()
    {
        
    }
    
});


//************************************************************************************************
// Status Bar

function StatusBar(){};

StatusBar.prototype = extend(Controller, {
    
});


//************************************************************************************************
// Panel Menus

function PanelOptions(){};

PanelOptions.prototype = extend(Controller, {
    
});


// ************************************************************************************************


// ************************************************************************************************
}});