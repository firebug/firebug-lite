FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// Globals

var Console = Firebug.Console;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var commandHistory = [];
var commandPointer = -1;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var reOpenBracket = /[\[\(\{]/;
var reCloseBracket = /[\]\)\}]/;

var commandHistory = [];
var commandPointer = -1;

var isAutoCompleting = null;
var autoCompletePrefix = null;
var autoCompleteExpr = null;
var autoCompleteBuffer = null;
var autoCompletePosition = null;

var _completion =
{
    window:
    [
        "console"
    ],
    
    document:
    [
        "getElementById", 
        "getElementsByTagName"
    ]
};

var _stack = function(command)
{
    commandHistory.push(command);
    commandPointer = commandHistory.length;
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

// ************************************************************************************************
// CommandLine

Firebug.CommandLine = function(element)
{
    this.element = element;
    
    if (isOpera)
      fixOperaTabKey(this.element);
    
    this.clear = bind(this.clear, this);
    this.onKeyDown = bind(this.onKeyDown, this);
    this.onError = bind(this.onError, this);
    
    addEvent(this.element, "keydown", this.onKeyDown);
    
    addEvent(Firebug.browser.window, "error", this.onError);
    addEvent(Firebug.chrome.window, "error", this.onError);
};

Firebug.CommandLine.prototype = 
{
    element: null,
  
    initialize: function(doc)
    {
    },
    
    destroy: function()
    {
        removeEvent(Firebug.browser.window, "error", this.onError);
        removeEvent(Firebug.chrome.window, "error", this.onError);
        
        removeEvent(this.element, "keydown", this.onKeyDown);
        
        this.element = null
        delete this.element;
    },

    execute: function()
    {
        var cmd = this.element;
        var command = cmd.value;
        
        _stack(command);
        Firebug.Console.writeMessage(['<span>&gt;&gt;&gt;</span> ', escapeHTML(command)], "command");
        
        try
        {
            
            var result = this.evaluate(command);
            
            // avoid logging the console command twice, in case it is a console function
            // that is being executed in the command line
            if (result != Console.LOG_COMMAND)
            {
                var html = [];
                Firebug.Reps.appendObject(result, html)
                Firebug.Console.writeMessage(html, "command");
            }
                
        }
        catch (e)
        {
            Firebug.Console.writeMessage([e.message || e], "error");
        }
        
        cmd.value = "";
    },
    
    evaluate: function(expr)
    {
        // TODO: need to register the API in console.firebug.commandLineAPI
        var api = "Firebug.CommandLine.API"
            
        //Firebug.context = Firebug.chrome;
        //api = null;

        return Firebug.context.evaluate(expr, "window", api, Console.error);
    },
    
    //eval: new Function("return window.eval.apply(window, arguments)"),
    
    prevCommand: function()
    {
        if (commandPointer > 0 && commandHistory.length > 0)
            this.element.value = commandHistory[--commandPointer];
    },
  
    nextCommand: function()
    {
        var element = this.element;
        
        var limit = commandHistory.length -1;
        var i = commandPointer;
        
        if (i < limit)
          element.value = commandHistory[++commandPointer];
          
        else if (i == limit)
        {
            ++commandPointer;
            element.value = "";
        }
    },
  
    autocomplete: function(reverse)
    {
        var element = this.element;
        
        var command = element.value;
        var offset = getExpressionOffset(command);

        var valBegin = offset ? command.substr(0, offset) : "";
        var val = command.substr(offset);
        
        var buffer, obj, objName, commandBegin, result, prefix;
        
        // if it is the beginning of the completion
        if(!isAutoCompleting)
        {
            
            // group1 - command begin
            // group2 - base object
            // group3 - property prefix
            var reObj = /(.*[^_$\w\d\.])?((?:[_$\w][_$\w\d]*\.)*)([_$\w][_$\w\d]*)?$/;
            var r = reObj.exec(val);
            
            // parse command
            if (r[1] || r[2] || r[3])
            {
                commandBegin = r[1] || "";
                objName = r[2] || "";
                prefix = r[3] || "";
            }
            else if (val == "")
            {
                commandBegin = objName = prefix = "";
            } else
                return;
            
            isAutoCompleting = true;
      
            // find base object
            if(objName == "")
                obj = window;
              
            else
            {
                objName = objName.replace(/\.$/, "");
        
                var n = objName.split(".");
                var target = window, o;
                
                for (var i=0, ni; ni = n[i]; i++)
                {
                    if (o = target[ni])
                      target = o;
                      
                    else
                    {
                        target = null;
                        break;
                    }
                }
                obj = target;
            }
            
            // map base object
            if(obj)
            {
                autoCompletePrefix = prefix;
                autoCompleteExpr = valBegin + commandBegin + (objName ? objName + "." : "");
                autoCompletePosition = -1;
                
                buffer = autoCompleteBuffer = isIE ?
                    _completion[objName || "window"] || [] : [];
                
                for(var p in obj)
                    buffer.push(p);
            }
    
        // if it is the continuation of the last completion
        } else
          buffer = autoCompleteBuffer;
        
        if (buffer)
        {
            prefix = autoCompletePrefix;
            
            var diff = reverse ? -1 : 1;
            
            for(var i=autoCompletePosition+diff, l=buffer.length, bi; i>=0 && i<l; i+=diff)
            {
                bi = buffer[i];
                
                if (bi.indexOf(prefix) == 0)
                {
                    autoCompletePosition = i;
                    result = bi;
                    break;
                }
            }
        }
        
        if (result)
            element.value = autoCompleteExpr + result;
    },
    
    onError: function(msg, href, lineNo)
    {
        var html = [];
        
        var lastSlash = href.lastIndexOf("/");
        var fileName = lastSlash == -1 ? href : href.substr(lastSlash+1);
        
        html.push(
            '<span class="errorMessage">', msg, '</span>', 
            '<div class="objectBox-sourceLink">', fileName, ' (line ', lineNo, ')</div>'
          );
        
        Firebug.Console.writeRow(html, "error");
    },
    
    clear: function()
    {
        this.element.value = "";
    },
    
    onKeyDown: function(e)
    {
        e = e || event;
        
        var code = e.keyCode;
        
        /*tab, shift, control, alt*/
        if (code != 9 && code != 16 && code != 17 && code != 18)
            isAutoCompleting = false;
    
        if (code == 13 /* enter */)
            this.execute();

        else if (code == 27 /* ESC */)
            setTimeout(this.clear, 0);
          
        else if (code == 38 /* up */)
            this.prevCommand();
          
        else if (code == 40 /* down */)
            this.nextCommand();
          
        else if (code == 9 /* tab */)
            this.autocomplete(e.shiftKey);
          
        else
            return;
        
        cancelEvent(e, true);
        return false;
    }
};


// ************************************************************************************************
// 

function getExpressionOffset(command)
{
    // XXXjoe This is kind of a poor-man's JavaScript parser - trying
    // to find the start of the expression that the cursor is inside.
    // Not 100% fool proof, but hey...

    var bracketCount = 0;

    var start = command.length-1;
    for (; start >= 0; --start)
    {
        var c = command[start];
        if ((c == "," || c == ";" || c == " ") && !bracketCount)
            break;
        if (reOpenBracket.test(c))
        {
            if (bracketCount)
                --bracketCount;
            else
                break;
        }
        else if (reCloseBracket.test(c))
            ++bracketCount;
    }

    return start + 1;
}

// ************************************************************************************************
// CommandLine API

var CommandLineAPI =
{
    $: function(id)
    {
        return Firebug.browser.document.getElementById(id)
    },

    $$: function(selector, context)
    {
        context = context || Firebug.browser.document;
        return Firebug.Selector ? 
                Firebug.Selector(selector, context) : 
                Firebug.Console.error("Firebug.Selector module not loaded.");
    },
    
    $0: null,
    
    $1: null,
    
    dir: Firebug.Console.dir,

    dirxml: Firebug.Console.dirxml
};

Firebug.CommandLine.API = {};
var initializeCommandLineAPI = function initializeCommandLineAPI()
{
    for (var m in CommandLineAPI)
        if (!Env.browser.window[m])
            Firebug.CommandLine.API[m] = CommandLineAPI[m];
};

initializeCommandLineAPI();

// ************************************************************************************************
}});