FBL.ns(function() { with (FBL) {
// ************************************************************************************************


/*============================================================================
  html
*===========================================================================*/
Firebug.HTML =
{

    appendTreeNode: function(nodeArray, html)
    {
        var reTrim = /^\s+|\s+$/g;
      
        if (!nodeArray.length) nodeArray = [nodeArray];
        
        for (var n=0, node; node=nodeArray[n]; n++)
        {
        
            if (node.nodeType == 1)
            {
              
                var uid = node[cacheID];
                var child = node.childNodes;
                var childLength = child.length;
                var hasSingleTextChild = childLength == 1 && node.firstChild.nodeType == 3;
                
                var nodeName = node.nodeName.toLowerCase();
                
                var nodeControl = !hasSingleTextChild && childLength > 0 ? 
                    ('<div class="nodeControl"></div>') : '';

                
                if(isIE && nodeControl)
                  html.push(nodeControl);
              
                if (typeof uid != 'undefined')
                    html.push(
                        '<div class="objectBox-element" ',
                        cacheID, '="', uid,
                        '" id="', uid,                                                                                        
                        '">',
                        !isIE && nodeControl ? nodeControl: "",                        
                        '&lt;<span class="nodeTag">', nodeName, '</span>'
                      );
                else
                    html.push(
                        '<div class="objectBox-element">&lt;<span class="nodeTag">', 
                        nodeName, '</span>'
                      );
            
                for (var i = 0; i < node.attributes.length; ++i)
                {
                    var attr = node.attributes[i];
                    if (!attr.specified || attr.nodeName == cacheID)
                        continue;
                    
                    html.push('&nbsp;<span class="nodeName">', attr.nodeName.toLowerCase(),
                        '</span>=&quot;<span class="nodeValue">', escapeHTML(attr.nodeValue),
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
                                '</span>&gt;</div>'
                            );
                    }
                    else
                      html.push('/&gt;</div>'); // blank text, print as childless node
                
                }
                else if (childLength > 0)
                {
                    html.push('&gt;</div>');
                }
                else 
                    html.push('/&gt;</div>');
          
            } 
            else if (node.nodeType == 3)
            {
                var value = node.nodeValue.replace(reTrim, '');
                if (value)
                    html.push('<div class="nodeText">', escapeHTML(value),
                        '</div>');
            }
          
        }
    },
    
    appendTreeChildren: function(treeNode)
    {
        var doc = Firebug.Chrome.document;
        
        var uid = treeNode.attributes[cacheID].value;
        var parentNode = documentCache[uid];
        
        if (parentNode.childNodes.length == 0) return;
        
        var treeNext = treeNode.nextSibling;
        var treeParent = treeNode.parentNode;
        
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
        
        var control = isIE ? treeNode.previousSibling : treeNode.firstChild;
        control.className = 'nodeControl';
        
        children.parentNode.removeChild(children);  
        closeTag.parentNode.removeChild(closeTag);  
    },
    
    isTreeNodeVisible: function(id)
    {
        return $U(id);
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
            node = $U(id);
            
            if (stack.length > 0 && documentCache[id].childNodes.length > 0)
              this.appendTreeChildren(node);
        }
        
        selectElement(node);
        
        fbPanel1.scrollTop = Math.round(node.offsetTop - fbPanel1.clientHeight/2);
    }
    
}

var selectedElement = null
function selectElement(e)
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
    }
}

// TODO : Refactor
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
        if(targ.className == 'nodeTag')
        {
            var control = FBL.isIE ? (targ.parentNode.previousSibling || targ) :
                          (targ.previousSibling.previousSibling || targ);

            selectElement(targ.parentNode);
            
            if (control.className.indexOf('nodeControl') == -1)
                return;
            
        } else
            control = targ;
        
        FBL.cancelEvent(e);
        
        var treeNode = FBL.isIE ? control.nextSibling : control.parentNode;
        
        //FBL.Firebug.Console.log(treeNode);
        
        if (control.className.indexOf(' nodeMaximized') != -1) {
            FBL.Firebug.HTML.removeTreeChildren(treeNode);
        } else {
            FBL.Firebug.HTML.appendTreeChildren(treeNode);
        }
    }
    else if (targ.className == 'nodeValue' || targ.className == 'nodeName')
    {
        var input = FBL.Firebug.Chrome.document.getElementById('treeInput');
        
        input.style.display = "block";
        input.style.left = targ.offsetLeft + 'px';
        input.style.top = FBL.topHeight + targ.offsetTop - FBL.fbPanel1.scrollTop + 'px';
        input.style.width = targ.offsetWidth + 6 + 'px';
        input.value = targ.textContent || targ.innerText;
        input.focus(); 
    }
}

// ************************************************************************************************
}});