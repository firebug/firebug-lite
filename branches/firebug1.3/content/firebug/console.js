FBL.ns(function() { with (FBL) {
// ************************************************************************************************


// ************************************************************************************************
// Console

var ConsoleAPI = 
{
    firebuglite: Firebug.version,

    log: function()
    {
        return Firebug.Console.logFormatted(arguments, "");
    },
    
    debug: function()
    {
        return Firebug.Console.logFormatted(arguments, "debug");
    },
    
    info: function()
    {
        return Firebug.Console.logFormatted(arguments, "info");
    },
    
    warn: function()
    {
        return Firebug.Console.logFormatted(arguments, "warning");
    },
    
    error: function()
    {
        return Firebug.Console.logFormatted(arguments, "error");
    },
    
    assert: function(truth, message)
    {
        if (!truth)
        {
            var args = [];
            for (var i = 1; i < arguments.length; ++i)
                args.push(arguments[i]);
            
            Firebug.Console.logFormatted(args.length ? args : ["Assertion Failure"], "error");
            throw message ? message : "Assertion Failure";
        }
        
        return Firebug.Console.LOG_COMMAND;        
    },
    
    dir: function(object)
    {
        var html = [];
                    
        var pairs = [];
        for (var name in object)
        {
            try
            {
                pairs.push([name, object[name]]);
            }
            catch (exc)
            {
            }
        }
        
        pairs.sort(function(a, b) { return a[0] < b[0] ? -1 : 1; });
        
        html.push('<div class="log-object">');
        for (var i = 0; i < pairs.length; ++i)
        {
            var name = pairs[i][0], value = pairs[i][1];
            
            html.push('<div class="property">', 
                '<div class="propertyValueCell"><span class="propertyValue">');
                
            Firebug.Reps.appendObject(value, html);
            
            html.push('</span></div><div class="propertyNameCell"><span class="propertyName">',
                escapeHTML(name), '</span></div>'); 
            
            html.push('</div>');
        }
        html.push('</div>');
        
        return Firebug.Console.logRow(html, "dir");
    },
    
    dirxml: function(node)
    {
        var html = [];
        
        Firebug.Reps.appendNode(node, html);
        return Firebug.Console.logRow(html, "dirxml");
    },
    
    group: function()
    {
        return Firebug.Console.logRow(arguments, "group", Firebug.Console.pushGroup);
    },
    
    groupEnd: function()
    {
        return Firebug.Console.logRow(arguments, "", Firebug.Console.popGroup);
    },
    
    time: function(name)
    {
        this.timeMap[name] = (new Date()).getTime();
        return Firebug.Console.LOG_COMMAND;
    },
    
    timeEnd: function(name)
    {
        if (name in this.timeMap)
        {
            var delta = (new Date()).getTime() - this.timeMap[name];
            Firebug.Console.logFormatted([name+ ":", delta+"ms"]);
            delete this.timeMap[name];
        }
        return Firebug.Console.LOG_COMMAND;
    },
    
    count: function()
    {
        return this.warn(["count() not supported."]);
    },
    
    trace: function()
    {
        return this.warn(["trace() not supported."]);
    },
    
    profile: function()
    {
        return this.warn(["profile() not supported."]);
    },
    
    profileEnd: function()
    {
        return Firebug.Console.LOG_COMMAND;
    },
    
    clear: function()
    {
        Firebug.Console.getPanel().panelNode.innerHTML = "";
        return Firebug.Console.LOG_COMMAND;
    },

    open: function()
    {
        toggleConsole(true);
        return Firebug.Console.LOG_COMMAND;
    },
    
    close: function()
    {
        if (frameVisible)
            toggleConsole();
        
        return Firebug.Console.LOG_COMMAND;
    }
};


// ************************************************************************************************
// Console Module

var ConsoleModule = extend(Firebug.Module, ConsoleAPI);

Firebug.Console = extend(ConsoleModule,
{
    LOG_COMMAND: {},
    
    create: function()
    {
        this.messageQueue = [];
        this.groupStack = [];
        this.timeMap = {};
        
        // Register console API
        var alternateNS = "FB";
        var consoleNS = "console";
        var namespace = isFirefox ? alternateNS : consoleNS;
        application.global[namespace] = ConsoleAPI;        
    },
    
    getPanel: function()
    {
        return Firebug.chrome ? Firebug.chrome.getPanel("Console") : null;
    },    

    flush: function()
    {
        var queue = this.messageQueue;
        this.messageQueue = [];
        
        for (var i = 0; i < queue.length; ++i)
            this.writeMessage(queue[i][0], queue[i][1], queue[i][2]);
    },
    
    // ********************************************************************************************
    
    logFormatted: function(objects, className)
    {
        var html = [];
    
        var format = objects[0];
        var objIndex = 0;
    
        if (typeof(format) != "string")
        {
            format = "";
            objIndex = -1;
        }
    
        var parts = this.parseFormat(format);
        for (var i = 0; i < parts.length; ++i)
        {
            var part = parts[i];
            if (part && typeof(part) == "object")
            {
                var object = objects[++objIndex];
                part.appender(object, html);
            }
            else
                Firebug.Reps.appendText(part, html);
        }
    
        for (var i = objIndex+1; i < objects.length; ++i)
        {
            Firebug.Reps.appendText(" ", html);
            
            var object = objects[i];
            if (typeof(object) == "string")
                Firebug.Reps.appendText(object, html);
            else
                Firebug.Reps.appendObject(object, html);
        }
        
        return this.logRow(html, className);    
    },
    
    parseFormat: function(format)
    {
        var parts = [];
    
        var reg = /((^%|[^\\]%)(\d+)?(\.)([a-zA-Z]))|((^%|[^\\]%)([a-zA-Z]))/;
        var Reps = Firebug.Reps;
        var appenderMap = {
                s: Reps.appendText, 
                d: Reps.appendInteger, 
                i: Reps.appendInteger, 
                f: Reps.appendFloat
            };
    
        for (var m = reg.exec(format); m; m = reg.exec(format))
        {
            var type = m[8] ? m[8] : m[5];
            var appender = type in appenderMap ? appenderMap[type] : Reps.appendObject;
            var precision = m[3] ? parseInt(m[3]) : (m[4] == "." ? -1 : 0);
    
            parts.push(format.substr(0, m[0][0] == "%" ? m.index : m.index+1));
            parts.push({appender: appender, precision: precision});
    
            format = format.substr(m.index+m[0].length);
        }
    
        parts.push(format);
    
        return parts;
    },
    
    // ********************************************************************************************
    
    logRow: function(message, className, handler)
    {
        var panel = this.getPanel();
        
        if (panel && panel.panelNode)
            this.writeMessage(message, className, handler);
        else
        {
            this.messageQueue.push([message, className, handler]);
        }
        
        return this.LOG_COMMAND;
    },
    
    writeMessage: function(message, className, handler)
    {
        var container = this.getPanel().panelContainer;
        var isScrolledToBottom =
            container.scrollTop + container.offsetHeight >= container.scrollHeight;
    
        if (!handler)
            handler = this.writeRow;
        
        handler.call(this, message, className);
        
        if (isScrolledToBottom)
            container.scrollTop = container.scrollHeight - container.offsetHeight;
    },
    
    appendRow: function(row)
    {
        if (this.groupStack.length > 0)
            var container = this.groupStack[this.groupStack.length-1];
        else
            var container = this.getPanel().panelNode;
        
        container.appendChild(row);
    },
    
    writeRow: function(message, className)
    {
        var row = this.getPanel().panelNode.ownerDocument.createElement("div");
        row.className = "logRow" + (className ? " logRow-"+className : "");
        row.innerHTML = message.join("");
        this.appendRow(row);
    },
    
    pushGroup: function(message, className)
    {
        this.logFormatted(message, className);
    
        var groupRow = this.getPanel().panelNode.ownerDocument.createElement("div");
        groupRow.className = "logGroup";
        var groupRowBox = this.getPanel().panelNode.ownerDocument.createElement("div");
        groupRowBox.className = "logGroupBox";
        groupRow.appendChild(groupRowBox);
        this.appendRow(groupRowBox);
        this.groupStack.push(groupRowBox);
    },
    
    popGroup: function()
    {
        this.groupStack.pop();
    }

});

Firebug.Console.create();

Firebug.registerModule(Firebug.Console);


// ************************************************************************************************
// Console Panel

function ConsolePanel(){};

ConsolePanel.prototype = extend(Firebug.Panel,
{
    name: "Console",
    title: "Console",
    
    options: {
        hasCommandLine: true,
        hasToolButtons: true,
        isPreRendered: true
    },

    create: function(){
        Firebug.Panel.create.apply(this, arguments);
    },
    
    initialize: function(){
        Firebug.Panel.initialize.apply(this, arguments);
    }
    
});

Firebug.registerPanel(ConsolePanel);

// ************************************************************************************************

FBL.objectToString = function(object)
{
    try
    {
        return object+"";
    }
    catch (exc)
    {
        return null;
    }
};

// ************************************************************************************************

FBL.onError = function(msg, href, lineNo)
{
    var html = [];
    
    var lastSlash = href.lastIndexOf("/");
    var fileName = lastSlash == -1 ? href : href.substr(lastSlash+1);
    
    html.push(
        '<span class="errorMessage">', msg, '</span>', 
        '<div class="objectBox-sourceLink">', fileName, ' (line ', lineNo, ')</div>'
    );
    
    Firebug.Console.logRow(html, "error");
};

// ************************************************************************************************
}});