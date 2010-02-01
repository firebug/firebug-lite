/* See license.txt for terms of usage */

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// Globals

var ignoreHTMLProps =
{
    // ignores the attributes injected by Sizzle, otherwise it will 
    // be visible on IE (when enumerating element.attributes)
    sizcache: 1,
    sizset: 1
};

// ignores also the cache property injected by firebug
ignoreHTMLProps[cacheID] = 1;
// TODO: xxxpedro cache remove this expando property
ignoreHTMLProps[cacheID+"b"] = 1;


// ************************************************************************************************
// HTML Module

Firebug.HTML = extend(Firebug.Module, 
{
    appendTreeNode: function(nodeArray, html)
    {
        var reTrim = /^\s+|\s+$/g;
        
        if (!nodeArray.length) nodeArray = [nodeArray];
        
        for (var n=0, node; node=nodeArray[n]; n++)
        {
            if (node.nodeType == 1)
            {
                if (Firebug.ignoreFirebugElements && node.firebugIgnore) continue;
                
                var uid = node[cacheID];
                var child = node.childNodes;
                var childLength = child.length;
                
                var nodeName = node.nodeName.toLowerCase();
                
                var nodeVisible = isVisible(node);
                
                var hasSingleTextChild = childLength == 1 && node.firstChild.nodeType == 3 &&
                        nodeName != "script" && nodeName != "style";
                
                var nodeControl = !hasSingleTextChild && childLength > 0 ? 
                    ('<div class="nodeControl"></div>') : '';
                
                var isIE = false;

                if(isIE && nodeControl)
                    html.push(nodeControl);
              
                if (typeof uid != 'undefined')
                    html.push(
                        '<div class="objectBox-element" ',
                        'id="', uid,                                                                                        
                        '">',
                        !isIE && nodeControl ? nodeControl: "",                        
                        '<span ',
                        cacheID, 
                        '="', uid,
                        '"  class="nodeBox',
                        nodeVisible ? "" : " nodeHidden",
                        '">&lt;<span class="nodeTag">', nodeName, '</span>'
                    );
                else
                    html.push(
                        '<div class="objectBox-element"><span class="nodeBox',
                        nodeVisible ? "" : " nodeHidden",
                        '">&lt;<span class="nodeTag">', 
                        nodeName, '</span>'
                    );
                
                for (var i = 0; i < node.attributes.length; ++i)
                {
                    var attr = node.attributes[i];
                    if (!attr.specified || Firebug.ignoreFirebugElements && 
                        ignoreHTMLProps.hasOwnProperty(attr.nodeName))
                            continue;
                    
                    var name = attr.nodeName.toLowerCase();
                    var value = name == "style" ? formatStyles(node.style.cssText) : attr.nodeValue;
                    
                    html.push('&nbsp;<span class="nodeName">', name,
                        '</span>=&quot;<span class="nodeValue">', escapeHTML(value),
                        '</span>&quot;')
                }
                
                /*
                // source code nodes
                if (nodeName == 'script' || nodeName == 'style')
                {
                  
                    if(document.all){
                        var src = node.innerHTML+'\n';
                       
                    }else {
                        var src = '\n'+node.innerHTML+'\n';
                    }
                    
                    var match = src.match(/\n/g);
                    var num = match ? match.length : 0;
                    var s = [], sl = 0;
                    
                    for(var c=1; c<num; c++){
                        s[sl++] = '<div line="'+c+'">' + c + '</div>';
                    }
                    
                    html.push('&gt;</div><div class="nodeGroup"><div class="nodeChildren"><div class="lineNo">',
                            s.join(''),
                            '</div><pre class="nodeCode">',
                            escapeHTML(src),
                            '</pre>',
                            '</div><div class="objectBox-element">&lt;/<span class="nodeTag">',
                            nodeName,
                            '</span>&gt;</div>',
                            '</div>'
                        );
                      
                
                }/**/
                
                // Just a single text node child
                if (hasSingleTextChild)
                {
                    var value = child[0].nodeValue.replace(reTrim, '');
                    if(value)
                    {
                        html.push(
                                '&gt;<span class="nodeText">',
                                escapeHTML(value),
                                '</span>&lt;/<span class="nodeTag">',
                                nodeName,
                                '</span>&gt;</span></div>'
                            );
                    }
                    else
                      html.push('/&gt;</span></div>'); // blank text, print as childless node
                
                }
                else if (childLength > 0)
                {
                    html.push('&gt;</span></div>');
                }
                else 
                    html.push('/&gt;</span></div>');
          
            } 
            else if (node.nodeType == 3)
            {
                if ( node.parentNode && ( node.parentNode.nodeName.toLowerCase() == "script" ||
                     node.parentNode.nodeName.toLowerCase() == "style" ) )
                {
                    var value = node.nodeValue.replace(reTrim, '');
                    
                    if(isIE){
                        var src = value+'\n';
                       
                    }else {
                        var src = '\n'+value+'\n';
                    }
                    
                    var match = src.match(/\n/g);
                    var num = match ? match.length : 0;
                    var s = [], sl = 0;
                    
                    for(var c=1; c<num; c++){
                        s[sl++] = '<div line="'+c+'">' + c + '</div>';
                    }
                    
                    html.push('<div class="nodeGroup"><div class="nodeChildren"><div class="lineNo">',
                            s.join(''),
                            '</div><pre class="nodeCode">',
                            escapeHTML(src),
                            '</pre>',
                            '</div></div>'
                        );
                      
                }
                else
                {
                    var value = node.nodeValue.replace(reTrim, '');
                    if (value)
                        html.push('<div class="nodeText">', escapeHTML(value),'</div>');
                }
            }
        }
    },
    
    appendTreeChildren: function(treeNode)
    {
        var doc = Firebug.chrome.document;
        var uid = treeNode.id;
        var parentNode = documentCache[uid];
        
        if (parentNode.childNodes.length == 0) return;
        
        var treeNext = treeNode.nextSibling;
        var treeParent = treeNode.parentNode;
        
        var isIE = false;
        var control = isIE ? treeNode.previousSibling : treeNode.firstChild;
        control.className = 'nodeControl nodeMaximized';
        
        var html = [];
        var children = doc.createElement("div");
        children.className = "nodeChildren";
        this.appendTreeNode(parentNode.childNodes, html);
        children.innerHTML = html.join("");
        
        treeParent.insertBefore(children, treeNext);
        
        var closeElement = doc.createElement("div");
        closeElement.className = "objectBox-element";
        closeElement.innerHTML = '&lt;/<span class="nodeTag">' + 
            parentNode.nodeName.toLowerCase() + '&gt;</span>'
        
        treeParent.insertBefore(closeElement, treeNext);
        
    },
    
    removeTreeChildren: function(treeNode)
    {
        var children = treeNode.nextSibling;
        var closeTag = children.nextSibling;
        
        var isIE = false;
        var control = isIE ? treeNode.previousSibling : treeNode.firstChild;
        control.className = 'nodeControl';
        
        children.parentNode.removeChild(children);  
        closeTag.parentNode.removeChild(closeTag);  
    },
    
    isTreeNodeVisible: function(id)
    {
        return $(id);
    },
    
    select: function(el)
    {
        var id = el && el[cacheID];
        if (id)
            this.selectTreeNode(id);
    },
    
    selectTreeNode: function(id)
    {
        id = ""+id;
        var node, stack = [];
        while(id && !this.isTreeNodeVisible(id))
        {
            stack.push(id);
            
            var node = documentCache[id].parentNode;

            if (node && typeof node[cacheID] != "undefined")
                id = ""+node[cacheID];
            else
                break;
        }
        
        stack.push(id);
        
        while(stack.length > 0)
        {
            id = stack.pop();
            node = $(id);
            
            if (stack.length > 0 && documentCache[id].childNodes.length > 0)
              this.appendTreeChildren(node);
        }
        
        selectElement(node);
        
        fbPanel1.scrollTop = Math.round(node.offsetTop - fbPanel1.clientHeight/2);
    }
    
});

Firebug.registerModule(Firebug.HTML);

// ************************************************************************************************
// HTML Panel

function HTMLPanel(){};

HTMLPanel.prototype = extend(Firebug.Panel,
{
    name: "HTML",
    title: "HTML",
    
    options: {
        hasSidePanel: true,
        //hasToolButtons: true,
        isPreRendered: true,
        innerHTMLSync: true
    },

    create: function(){
        Firebug.Panel.create.apply(this, arguments);
        
        this.panelNode.style.padding = "4px 3px 1px 15px";
        this.contentNode.style.minWidth = "500px";
        
        if (Env.Options.enablePersistent || Firebug.chrome.type != "popup")
            this.createUI();
        
        if(!this.sidePanelBar.selectedPanel)
        {
            this.sidePanelBar.selectPanel("css");
        }
    },
    
    destroy: function()
    {
        selectedElement = null
        fbPanel1 = null;
        
        selectedSidePanelTS = null;
        selectedSidePanelTimer = null;
        
        Firebug.Panel.destroy.apply(this, arguments);
    },
    
    createUI: function()
    {
        var rootNode = Firebug.browser.document.documentElement;
        var html = [];
        Firebug.HTML.appendTreeNode(rootNode, html);
        
        var d = this.contentNode;
        d.innerHTML = html.join("");
        this.panelNode.appendChild(d);
    },
    
    initialize: function()
    {
        Firebug.Panel.initialize.apply(this, arguments);
        addEvent(this.panelNode, 'click', Firebug.HTML.onTreeClick);
        
        fbPanel1 = $("fbPanel1");
        
        if(!selectedElement)
        {
            Firebug.HTML.selectTreeNode(Firebug.browser.document.body[cacheID]);
        }
        
        // TODO: xxxpedro
        addEvent(fbPanel1, 'mousemove', Firebug.HTML.onListMouseMove);
        addEvent($("fbContent"), 'mouseout', Firebug.HTML.onListMouseMove);
        addEvent(Firebug.chrome.node, 'mouseout', Firebug.HTML.onListMouseMove);        
    },
    
    shutdown: function()
    {
        // TODO: xxxpedro
        removeEvent(fbPanel1, 'mousemove', Firebug.HTML.onListMouseMove);
        removeEvent($("fbContent"), 'mouseout', Firebug.HTML.onListMouseMove);
        removeEvent(Firebug.chrome.node, 'mouseout', Firebug.HTML.onListMouseMove);
        
        removeEvent(this.panelNode, 'click', Firebug.HTML.onTreeClick);
        
        fbPanel1 = null;
        
        Firebug.Panel.shutdown.apply(this, arguments);
    },
    
    reattach: function()
    {
        // TODO: panel reattach
        if(FirebugChrome.selectedHTMLElementId)
            Firebug.HTML.selectTreeNode(FirebugChrome.selectedHTMLElementId);
    }
});

Firebug.registerPanel(HTMLPanel);

// ************************************************************************************************

var formatStyles = function(styles)
{
    return isIE ?
        // IE return CSS property names in upper case, so we need to convert them
        styles.replace(/([^\s]+)\s*:/g, function(m,g){return g.toLowerCase()+":"}) :
        // other browsers are just fine
        styles;
};

// ************************************************************************************************

var selectedElement = null
var fbPanel1 = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *  
var selectedSidePanelTS, selectedSidePanelTimer;

var selectElement= function selectElement(e)
{
    if (e != selectedElement)
    {
        if (selectedElement)
            selectedElement.className = "objectBox-element";
            
        e.className = e.className + " selectedElement";

        if (FBL.isFirefox)
            e.style.MozBorderRadius = "2px";
        
        else if (FBL.isSafari)
            e.style.WebkitBorderRadius = "2px";
        
        selectedElement = e;
        
        FirebugChrome.selectedHTMLElementId = e.id;
        
        var target = documentCache[e.id];
        var selectedSidePanel = Firebug.chrome.getPanel("HTML").sidePanelBar.selectedPanel;
        
        var stack = FirebugChrome.htmlSelectionStack;
        
        stack.unshift(target);
        Firebug.CommandLine.API.$0 = stack[0];
        Firebug.CommandLine.API.$1 = stack[1];
        
        if (stack.length > 2)
            stack.pop();
        
        var lazySelect = function()
        {
            selectedSidePanelTS = new Date().getTime();
            
            selectedSidePanel.select(target, true);
        };
        
        if (selectedSidePanelTimer)
        {
            clearTimeout(selectedSidePanelTimer);
            selectedSidePanelTimer = null;
        }
        
        if (new Date().getTime() - selectedSidePanelTS > 100)
            setTimeout(lazySelect, 0)
        else
            selectedSidePanelTimer = setTimeout(lazySelect, 150);
    }
}


// ************************************************************************************************
// ***  TODO:  REFACTOR  **************************************************************************
// ************************************************************************************************
Firebug.HTML.onTreeClick = function (e)
{
    e = e || event;
    var targ;
    
    if (e.target) targ = e.target;
    else if (e.srcElement) targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
        targ = targ.parentNode;
        
    
    if (targ.className.indexOf('nodeControl') != -1 || targ.className == 'nodeTag')
    {
        var isIE = false;
        
        if(targ.className == 'nodeTag')
        {
            var control = isIE ? (targ.parentNode.previousSibling || targ) :
                          (targ.parentNode.previousSibling || targ);

            selectElement(targ.parentNode.parentNode);
            
            if (control.className.indexOf('nodeControl') == -1)
                return;
            
        } else
            control = targ;
        
        FBL.cancelEvent(e);
        
        var treeNode = isIE ? control.nextSibling : control.parentNode;
        
        //FBL.Firebug.Console.log(treeNode);
        
        if (control.className.indexOf(' nodeMaximized') != -1) {
            FBL.Firebug.HTML.removeTreeChildren(treeNode);
        } else {
            FBL.Firebug.HTML.appendTreeChildren(treeNode);
        }
    }
    else if (targ.className == 'nodeValue' || targ.className == 'nodeName')
    {
        /*
        var input = FBL.Firebug.chrome.document.getElementById('treeInput');
        
        input.style.display = "block";
        input.style.left = targ.offsetLeft + 'px';
        input.style.top = FBL.topHeight + targ.offsetTop - FBL.fbPanel1.scrollTop + 'px';
        input.style.width = targ.offsetWidth + 6 + 'px';
        input.value = targ.textContent || targ.innerText;
        input.focus(); 
        /**/
    }
}

function onListMouseOut(e)
{
    e = e || event || window;
    var targ;
    
    if (e.target) targ = e.target;
    else if (e.srcElement) targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
      targ = targ.parentNode;
        
      if (hasClass(targ, "fbPanel")) {
          FBL.Firebug.Inspector.hideBoxModel();
          hoverElement = null;        
      }
};
    
var hoverElement = null;
var hoverElementTS = 0;

Firebug.HTML.onListMouseMove = function onListMouseMove(e)
{
    try
    {
        e = e || event || window;
        var targ;
        
        if (e.target) targ = e.target;
        else if (e.srcElement) targ = e.srcElement;
        if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;
            
        var found = false;
        while (targ && !found) {
            if (!/\snodeBox\s|\sobjectBox-selector\s/.test(" " + targ.className + " "))
                targ = targ.parentNode;
            else
                found = true;
        }
        
        if (!targ)
        {
            FBL.Firebug.Inspector.hideBoxModel();
            hoverElement = null;
            return;
        }
        
        /*
        if (typeof targ.attributes[FBL.cacheID] == 'undefined') return;
        
        var uid = targ.attributes[FBL.cacheID];
        if (!uid) return;
        /**/
        
        if (typeof targ.attributes[FBL.cacheID] == 'undefined') return;
        
        var uid = targ.attributes[FBL.cacheID];
        if (!uid) return;
        
        var el = FBL.documentCache[uid.value];
        
        var nodeName = el.nodeName.toLowerCase();
    
        if (FBL.isIE && " meta title script link ".indexOf(" "+nodeName+" ") != -1)
            return;
    
        if (!/\snodeBox\s|\sobjectBox-selector\s/.test(" " + targ.className + " ")) return;
        
        if (el.id == "FirebugUI" || " html head body br script link iframe ".indexOf(" "+nodeName+" ") != -1) { 
            FBL.Firebug.Inspector.hideBoxModel();
            hoverElement = null;
            return;
        }
      
        if ((new Date().getTime() - hoverElementTS > 40) && hoverElement != el) {
            hoverElementTS = new Date().getTime();
            hoverElement = el;
            FBL.Firebug.Inspector.drawBoxModel(el);
        }
    }
    catch(E)
    {
    }
}


// ************************************************************************************************
}});