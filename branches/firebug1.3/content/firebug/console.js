FBL.ns(function() { with (FBL) {
// ************************************************************************************************


// ************************************************************************************************
// Console

var ConsoleAPI = 
{
    firebug: FBL.version,

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
        return Firebug.Console.logRow(arguments, "group", pushGroup);
    },
    
    groupEnd: function()
    {
        return Firebug.Console.logRow(arguments, "", popGroup);
    },
    
    time: function(name)
    {
        timeMap[name] = (new Date()).getTime();
        return Firebug.Console.LOG_COMMAND;
    },
    
    timeEnd: function(name)
    {
        if (name in timeMap)
        {
            var delta = (new Date()).getTime() - timeMap[name];
            Firebug.Console.logFormatted([name+ ":", delta+"ms"]);
            delete timeMap[name];
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
        fbConsole.innerHTML = "";
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

    logRow: function(message, className, handler)
    {
        if (fbConsole)
            Firebug.Console.writeMessage(message, className, handler);
        else
        {
            Firebug.cache.messageQueue.push([message, className, handler]);
        }
        
        return Firebug.Console.LOG_COMMAND;
    },
    
    flush: function()
    {
        var queue = Firebug.cache.messageQueue;
        Firebug.cache.messageQueue = [];
        
        for (var i = 0; i < queue.length; ++i)
            Firebug.Console.writeMessage(queue[i][0], queue[i][1], queue[i][2]);
    },
    
    writeMessage: function(message, className, handler)
    {
        var isScrolledToBottom =
            fbPanel1.scrollTop + fbPanel1.offsetHeight >= fbPanel1.scrollHeight;
    
        if (!handler)
            handler = Firebug.Console.writeRow;
        
        handler(message, className);
        
        if (isScrolledToBottom)
            fbPanel1.scrollTop = fbPanel1.scrollHeight - fbPanel1.offsetHeight;
    },
    
    appendRow: function(row)
    {
        var container = groupStack.length ? groupStack[groupStack.length-1] : fbConsole;
        container.appendChild(row);
    },
    
    writeRow: function(message, className)
    {
        var row = fbConsole.ownerDocument.createElement("div");
        row.className = "logRow" + (className ? " logRow-"+className : "");
        row.innerHTML = message.join("");
        Firebug.Console.appendRow(row);
    },
    
    pushGroup: function(message, className)
    {
        Firebug.Console.logFormatted(message, className);
    
        var groupRow = fbConsole.ownerDocument.createElement("div");
        groupRow.className = "logGroup";
        var groupRowBox = fbConsole.ownerDocument.createElement("div");
        groupRowBox.className = "logGroupBox";
        groupRow.appendChild(groupRowBox);
        Firebug.Console.appendRow(groupRowBox);
        groupStack.push(groupRowBox);
    },
    
    popGroup: function()
    {
        groupStack.pop();
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
    
        var parts = Firebug.Console.parseFormat(format);
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
        
        return Firebug.Console.logRow(html, className);    
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
    }    

});

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
    
    initialize: function(){
        Firebug.Panel.initialize.apply(this, arguments);
        
        fbConsole = $("fbConsole");
        fbPanel1 =  $("fbPanel1");
    },
    
    shutdown: function()
    {
        fbConsole = null;
        fbPanel1 =  null;
    }
    
});

Firebug.registerPanel(ConsolePanel);

// ********************************************************************************************

var fbConsole = null;
var fbPanel1 = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

Firebug.cache.messageQueue = [];
var groupStack = [];
var timeMap = {};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

// ********************************************************************************************

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

// ********************************************************************************************
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


// ********************************************************************************************
// Register console API

var alternateNS = "FB";
var consoleNS = "console";
var namespace = isFirefox ? alternateNS : consoleNS;
application.global[namespace] = ConsoleAPI;


// ************************************************************************************************
}});