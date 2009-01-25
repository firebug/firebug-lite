FBL.ns(function() { with (FBL) {
// ************************************************************************************************

var Console = Firebug.Console;


// ************************************************************************************************
// CommandLine

var CommandLine = Firebug.CommandLine = 
{
    _cmdElement: null,
  
    _buffer: [],
    _bi: -1,
    
    _completing: null,
    _completePrefix: null,
    _completeExpr: null,
    _completeBuffer: null,
    _ci: null,
    
    _completion:
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
    },
  
    _stack: function(command)
    {
        this._buffer.push(command);
        this._bi = this._buffer.length;
    },
    
    initialize: function(doc)
    {
        initializeCommandLineAPI();

        this._cmdElement = doc.getElementById("commandLine");
        
        addEvent(this._cmdElement, "keydown", this.onKeyDown);
        window.onerror = this.onError;
    },

    execute: function()
    {
        var cmd = this._cmdElement;
        var command = cmd.value;
        
        this._stack(command);
        writeMessage(['<span>&gt;&gt;&gt;</span> ',command], "command");
        
        try
        {
            
            var result = this.evaluate(command);
            // evita que seja repetido o log, caso o comando executado
            // j� seja um log via linha de comando
            if (result != Console.logID)
            {
                var html = [];
                appendObject(result, html)
                writeMessage(html, "command");
            }
                
        }
        catch (e)
        {
            writeMessage([e.message || e], "error");
        }
        
        cmd.value = "";
    },
    
    evaluate: function(expr)
    {
      //var cmd = "with(window){ (function() { return " + expr + " \n}).apply(window); }";
      var cmd = "(function() { with(FBL.CommandLineAPI){ return " + expr + " } }).apply(window)";
      return this.eval(cmd);
    },
    
    eval: new Function("return window.eval.apply(window, arguments)"),
    
    prevCommand: function()
    {
        var cmd = this._cmdElement;
        var buffer = this._buffer;
        
        if (this._bi > 0 && buffer.length > 0)
            cmd.value = buffer[--this._bi];
    },
  
    nextCommand: function()
    {
        var cmd = this._cmdElement;
        
        var buffer = this._buffer;
        var limit = buffer.length -1;
        var i = this._bi;
        
        if (i < limit)
          cmd.value = buffer[++this._bi];
          
        else if (i == limit)
        {
            ++this._bi;
            cmd.value = "";
        }
    },
  
    autocomplete: function(reverse)
    {
        var cmd = this._cmdElement;
        
        var command = cmd.value;
        var offset = getExpressionOffset(command);

        var valBegin = offset ? command.substr(0, offset) : "";
        var val = command.substr(offset);
        
        var buffer, obj, objName, commandBegin, result, prefix;
        
        // if it is the beginning of the completion
        if(!this._completing)
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
            
            this._completing = true;
      
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
                this._completePrefix = prefix;
                this._completeExpr = valBegin + commandBegin + (objName ? objName + "." : "");
                this._ci = -1;
                
                buffer = this._completeBuffer = isIE ?
                    this._completion[objName || "window"] || [] : [];
                
                for(var p in obj)
                    buffer.push(p);
            }
    
        // if it is the continuation of the last completion
        } else
          buffer = this._completeBuffer;
        
        if (buffer)
        {
            prefix = this._completePrefix;
            
            var diff = reverse ? -1 : 1;
            
            for(var i=this._ci+diff, l=buffer.length, bi; i>=0 && i<l; i+=diff)
            {
                bi = buffer[i];
                
                if (bi.indexOf(prefix) == 0)
                {
                    this._ci = i;
                    result = bi;
                    break;
                }
            }
        }
        
        if (result)
            cmd.value = this._completeExpr + result;
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
        
        writeRow(html, "error");
    },
    
    clear: function()
    {
        CommandLine._cmdElement.value = "";
    },
    
    onKeyDown: function(e)
    {
        e = e || event;
        
        var code = e.keyCode;
        
        /*tab, shift, control, alt*/
        if (code != 9 && code != 16 && code != 17 && code != 18)
            CommandLine._completing = false;
    
        if (code == 13 /* enter */)
            CommandLine.execute();

        else if (code == 27 /* ESC */)
            setTimeout(CommandLine.clear, 0);
          
        else if (code == 38 /* up */)
            CommandLine.prevCommand();
          
        else if (code == 40 /* down */)
            CommandLine.nextCommand();
          
        else if (code == 9 /* tab */)
            CommandLine.autocomplete(e.shiftKey);
          
        else
            return;
        
        cancelEvent(e, true);
        return false;
    }
};

Firebug.CommandLine.API =
{
    $: function(id)
    {
        return document.getElementById(id)
    },

    $$: Firebug.Selector,
    
    dir: ConsoleAPI.dir,

    dirxml: ConsoleAPI.dirxml
}

FBL.CommandLineAPI = {};
function initializeCommandLineAPI()
{
    var api = FBL.Firebug.CommandLine.API;
    for (var m in api)
        if (!window[m])
            FBL.CommandLineAPI[m] = api[m];
}
    


/*
OPERA TAB bug
function handleBlur(e) {
  if (this.lastKey == 9)
    this.focus();
}

function handleKeyDown(e) {
  this.lastKey = e.keyCode;
}

function handleFocus(e) {
  this.lastKey = null;
}

window.onload = function() {
  var elm = document.getElementById('myTextarea');
  elm.onfocus = handleFocus;
  elm.onblur = handleBlur;
  elm.onkeydown = handleKeyDown;
};
      
/**/


var reOpenBracket = /[\[\(\{]/;
var reCloseBracket = /[\]\)\}]/;

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
}});