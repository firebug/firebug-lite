FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// Script Module

Firebug.Script = extend(Firebug.Module, 
{
    getPanel: function()
    {
        return Firebug.chrome ? Firebug.chrome.getPanel("Script") : null;
    },
    
    selectSourceCode: function(index)
    {
        this.getPanel().selectSourceCode(index);
    }
});

Firebug.registerModule(Firebug.Script);


// ************************************************************************************************
// Script Panel

function ScriptPanel(){};

ScriptPanel.prototype = extend(Firebug.Panel,
{
    name: "Script",
    title: "Script",
    
    sourceIndex: 0,
    lastSourceIndex: -1,
    
    options: {
        hasToolButtons: true
    },

    create: function()
    {
        Firebug.Panel.create.apply(this, arguments);
        
        this.onChangeSelect = bind(this.onChangeSelect, this);
        
        var doc = Firebug.browser.document;
        var scripts = doc.getElementsByTagName("script");
        var selectNode = this.selectNode = createElement("select");
        
        for(var i=0, script; script=scripts[i]; i++)
        {
            var fileName = getFileName(script.src) || getFileName(doc.location.href);
            var option = createElement("option", {value:i});
            
            option.appendChild(Firebug.chrome.document.createTextNode(fileName));
            selectNode.appendChild(option);
        };
    
        this.toolButtonsNode.appendChild(selectNode);
    },
    
    initialize: function()
    {
        Firebug.Panel.initialize.apply(this, arguments);
        
        addEvent(this.selectNode, "change", this.onChangeSelect);
        
        this.selectSourceCode(this.sourceIndex);
    },
    
    detach: function(oldChrome, newChrome)
    {
        Firebug.Panel.detach.apply(this, arguments);
        
        var oldPanel = oldChrome.getPanel("Script");
        var index = oldPanel.sourceIndex;
        
        this.selectNode.selectedIndex = index;
        this.sourceIndex = index;
        this.lastSourceIndex = -1;
    },
    
    onChangeSelect: function(event)
    {
        event = event || window.event;
        var target = event.srcElement || event.currentTarget;
        var index = target.selectedIndex;
        
        this.renderSourceCode(index);
    },
    
    selectSourceCode: function(index)
    {
        this.selectNode.selectedIndex = index;
        this.renderSourceCode(index);
    },
    
    renderSourceCode: function(index)
    {
        if (this.lastSourceIndex != index)
        {
            var renderProcess = function renderProcess(src)
            {
                var html = [],
                    hl = 0,
                    s = [],
                    sl = 0;
                
                src = isIE && !isExternal ? 
                        src+'\n' :  // IE put an extra line when reading source of local resources
                        '\n'+src;
                
                // find the number of lines of code
                var match = src.match(/\n/g);
                var lines=match ? match.length : 0;
                
                // render the line number divs
                for(var c=1, lines; c<=lines; c++)
                {
                    s[sl++] = '<div line="';
                    s[sl++] = c;
                    s[sl++] = '">';
                    s[sl++] = c;
                    s[sl++] = '</div>';
                }
                
                // render the full source code + line numbers html
                html[hl++] = '<div><div class="sourceBox" style="left:'; 
                html[hl++] = 35 + 7*(lines+'').length;
                html[hl++] = 'px;"><pre class="sourceCode">';
                html[hl++] = escapeHTML(src);
                html[hl++] = '</pre></div><div class="lineNo">';
                html = html.concat(s); // uses concat instead of string.join() to boost performance 
                hl = html.length; // adjust the size index
                html[hl++] = '</div></div>';
                /**/
                
                updatePanel(html);
            };
            
            var updatePanel = function(html)
            {
                self.contentNode.innerHTML = html.join("");
                
                // IE needs this timeout, otherwise the panel won't scroll
                setTimeout(function(){
                    self.synchronizeUI();
                },0);                        
            };
            
            var onFailure = function()
            {
                renderProcess("Access to restricted URI denied");
            };
            
            var self = this;
            
            var doc = Firebug.browser.document;
            var script = doc.getElementsByTagName("script")[index];
            var url = getScriptURL(script);
            var isExternal = url && url != doc.location.href;
            
            try
            {
                if (isExternal)
                {
                    Ajax.request({url: url, onSuccess: renderProcess, onFailure: onFailure});
                }
                else
                {
                    var src = script.innerHTML;
                    renderProcess(src);
                }   
            }
            catch(e)
            {
                renderProcess("Access to restricted URI denied");
            }
                
            this.sourceIndex = index;
            this.lastSourceIndex = index;
        }
    }
});

Firebug.registerPanel(ScriptPanel);


// ************************************************************************************************


var getScriptURL = function getScriptURL(script) 
{
    var reFile = /([^\/\?#]+)(#.+)?$/;
    var rePath = /^(.*\/)/;
    var reProtocol = /^\w+:\/\//;
    var path = null;
    var doc = Firebug.browser.document;
    
    var file = reFile.exec(script.src);

    if (file)
    {
        var fileName = file[1];
        var fileOptions = file[2];
        
        // absolute path
        if (reProtocol.test(script.src)) {
            path = rePath.exec(script.src)[1];
          
        }
        // relative path
        else
        {
            var r = rePath.exec(script.src);
            var src = r ? r[1] : script.src;
            var backDir = /^((?:\.\.\/)+)(.*)/.exec(src);
            var reLastDir = /^(.*\/)[^\/]+\/$/;
            path = rePath.exec(doc.location.href)[1];
            
            // "../some/path"
            if (backDir)
            {
                var j = backDir[1].length/3;
                var p;
                while (j-- > 0)
                    path = reLastDir.exec(path)[1];

                path += backDir[2];
            }
            
            else if(src.indexOf("/") != -1)
            {
                // "./some/path"
                if(/^\.\/./.test(src))
                {
                    path += src.substring(2);
                }
                // "/some/path"
                else if(/^\/./.test(src))
                {
                    var domain = /^(\w+:\/\/[^\/]+)/.exec(path);
                    path = domain[1] + src;
                }
                // "some/path"
                else
                {
                    path += src;
                }
            }
        }
    }
    
    var m = path && path.match(/([^\/]+)\/$/) || null;
    
    if (path && m)
    {
        return path + fileName;
        
        var App = FBL.Env;
        var loc = App.location; 
        loc.sourceDir = path;
        loc.baseDir = path.substr(0, path.length - m[1].length - 1);
        loc.skinDir = loc.baseDir + "skin/" + App.skin + "/"; 
        loc.skin = loc.skinDir + "firebug.html";
        loc.app = path + fileName;
    }
};

var getFileName = function getFileName(path)
{
    if (!path) return "";
    
    var match = path && path.match(/[^\/]+(\?.*)?(#.*)?$/);
    
    return match && match[0] || path;
};


// ************************************************************************************************
}});