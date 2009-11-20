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
        
        var doc = Firebug.browser.document;
        var scripts = doc.getElementsByTagName("script");
        var selectNode = this.selectNode = createElement("select");
        
        for(var i=0, script; script=scripts[i]; i++)
        {
            var fileName = getFileName(script.src) || "..";
            var option = createElement("option", {value:i});
            
            option.appendChild(Firebug.chrome.document.createTextNode(fileName));
            selectNode.appendChild(option);
        };
    
        this.toolButtonsNode.appendChild(selectNode);
        
        /*
        this.clearButton = new Firebug.Button({
            node: $("fbConsole_btClear"),
            owner: Firebug.Console,
            onClick: Firebug.Console.clear
        });
        /**/
    },
    
    initialize: function()
    {
        Firebug.Panel.initialize.apply(this, arguments);
        
        //this.clearButton.initialize();
        
        addEvent(this.selectNode, "change", bind(this.onChangeSelect, this));
        
        this.selectSourceCode(this.sourceIndex);
    },
    
    reattach: function(oldChrome, newChrome)
    {
        var index = oldChrome.getPanel("Script").sourceIndex;;
        
        this.selectNode.selectedIndex = index;
        this.sourceIndex = index;
        this.lastSourceIndex = index;
    },
    
    onChangeSelect: function(event)
    {
        event = event || window.event;
        
        var target = event.srcElement || event.currentTarget;
        var index = target.selectedIndex;
        
        this.sourceIndex = index;
        this.renderSourceCode(index);
    },
    
    selectSourceCode: function(index)
    {
        this.selectNode.selectedIndex = index;
        this.sourceIndex = index;
        this.renderSourceCode(index);
    },
    
    renderSourceCode: function(index)
    {
        if (this.lastSourceIndex != index)
        {
            var doc = Firebug.browser.document;
            var script = doc.getElementsByTagName("script")[index];
            
            try
            {
                var self = this;
                var renderProcess = function renderProcess(response)
                {
                    var html = [],
                        hl = 0,
                        s = [],
                        sl = 0,
                        src = isExternal ? response : script.innerHTML;
                    
                    //src = isIE ? src+'\n' : '\n'+src+'\n';
                    src = '\n'+src+'\n';
                    
                    var match = src.match(/\n/g);
                    var num = match ? match.length : 0;
                    
                    //var t = new Date().getTime();
                    
                    for(var c=1; c<num; c++)
                    {
                        s[sl++] = '<div line="';
                        s[sl++] = c;
                        s[sl++] = '">';
                        s[sl++] = c;
                        s[sl++] = '</div>';
                    }
                      
                    html[hl++] = '<div><div class="lineNo">';
                    html = html.concat(s);
                    hl = html.length;
                    html[hl++] = '</div><pre class="nodeCode">';
                    html[hl++] = escapeHTML(src);
                    html[hl++] = '</pre></div>';
                    
                    //alert(new Date().getTime() - t);
                    
                    setTimeout(function(){
                        self.contentNode.innerHTML = html.join("");
                        self.containerNode.scrollTop = 0;
                    },0);
                };
                
                var url = getScriptURL(script);
                var isExternal = url != doc.location.href;
                
                if (isExternal)
                    Ajax.request({url: url, onComplete: renderProcess})
                    
                else
                    renderProcess();
            }
            catch(e)
            {
                str = "<em>Access to restricted URI denied</em>";
            }
            
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
        
        var App = FBL.Application;
        var loc = App.location; 
        loc.sourceDir = path;
        loc.baseDir = path.substr(0, path.length - m[1].length - 1);
        loc.skinDir = loc.baseDir + "skin/" + App.skin + "/"; 
        loc.skin = loc.skinDir + "firebug.html";
        loc.app = path + fileName;
    }
};


var getFileName = function getFileName(_path)
{
    if (!_path) return "";
    
    var match = _path&&_path.match(/[^\/]+(\?.*)?(#.*)?$/);
    
    return match&&match[0]||_path;
};


// ************************************************************************************************
}});