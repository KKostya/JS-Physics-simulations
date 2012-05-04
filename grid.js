function Grid(svg,st)
{
    this.svg = svg.data([this]); // Attaching self to the d3.data
    this.w   = svg.attr("width");
    this.h   = svg.attr("height");
    this.st  = st

    this.elems  = d3.range(0,w,this.st).map(function(d){return d3.range(0,h,this.st).map(function(x){return null;})});

    this.boxes = this.svg.append("g");
    this.lines = this.svg.append("g");

    this.shbox  = null;
    this.shline = null;

    this.linemode = 0;
}

Grid.prototype. SetRedLineMode = function() { this.linemode = 0; this.LineMode(); }
Grid.prototype.SetBlueLineMode = function() { this.linemode = 1; this.LineMode(); }

Grid.prototype.BoxIdx  = function(r) { return r.map(function(d){return Math.round(d/this.st-0.5);});}

// *--3--*---> x
// |     |
// 2     1
// |     |
// *--0--*
// |
// y
Grid.prototype.LineIdx = function(r)                 
{ 
    var dr = r.map(function(x){return x%this.st;}); 
    var ret = 0;
    if(dr[0] > dr[1]) ret +=1;                    
    if((this.st-dr[0]) > dr[1]) ret +=2;               
    return ret;
}

//-!-!-!-!-!--!-!-! Do the bounds check, okay? xxxxxxxxxxxxx////////////////
Grid.prototype.TestBox= function(r) { return this.elems[r[0]][r[1]] != null;} 

Grid.prototype.AddBox = function(r)
{
    var bx = this.boxes.append("rect")
        .attr("x",r[0]*st).attr("y",r[1]*st)
        .attr("width",st).attr("height",st)
        .attr("fill","black");

    this.elems[r[0]][r[1]]     = new Object;
    this.elems[r[0]][r[1]].box = bx;

    var rn = r.slice(0);
    if(this.TestBox(rn)) this.MakeLine(r,3); else this.RemoveLine(r, true, true);
    if(this.TestBox(rn)) this.MakeLine(r,se,false); else this.RemoveLine(r,false,false);
    if(this.TestBox(rn)) this.MakeLine(r,false, true); else this.RemoveLine(r,false, true);
    if(this.TestBox(rn)) this.MakeLine(r, true,false); else this.RemoveLine(r, true,false);
}

Grid.prototype.RemoveBox = function(r)
{
    this.elems[r[0]][r[1]].box.remove();
    delete this.elems[r[0]][r[1]];
}

///////////////////////////////////////// Liney part ////////////////////////////////////////////

Grid.prototype.NeighbourIndex = function(idx,xgty,rxgty)
{
    var nidx = idx.slice(0); // "slice(0)" makes a copy of an array
    if(xgty) if(rxgty) nidx[1]--; else  nidx[0]++;
    else     if(rxgty) nidx[0]--; else  nidx[1]++;
    return nidx;
}

Grid.prototype.PositionLine = function(obj,idx,xgty,rxgty)
{
    var x1 = this.st*( idx[0] + ( xgty?1:0));        
    var y1 = this.st*( idx[1] + ( xgty?0:1));        
    var x2 = this.st*( idx[0] + (rxgty?0:1));        
    var y2 = this.st*( idx[1] + (rxgty?0:1));        
                                                  
    obj.attr("x1",x1).attr("y1",y1).attr("x2",x2).attr("y2",y2);
}

Grid.prototype.MakeLine = function(idx,xgty,rxgty)
{
    var ln = this.lines.append("line");
    var el = this.elems[idx[0]][idx[1]];

    if(this.linemode == 0) ln.attr("stroke","red"); else ln.attr("stroke","blue");

    this.PositionLine(ln,idx,xgty,rxgty);

    if(xgty) if(rxgty) el.up   = ln; else  el.right = ln;
    else     if(rxgty) el.left = ln; else  el.down  = ln; 
}

Grid.prototype.RemoveLine = function(idx,xgty,rxgty)
{
    var el = this.elems[idx[0]][idx[1]];
    if(xgty) if(rxgty) { el.up  .remove(); delete el.up  ; } else { el.right.remove(); delete el.right; }
    else     if(rxgty) { el.left.remove(); delete el.left; } else { el.down .remove(); delete el.down ; }
}


/////////////////////// Updaters ////////////////////////////
// Note that in updaters "this" is a current DOM object
// while "d" is the d3.data that was associated with it
///////////////////////////////////////////////////////////

// Boxxy
Grid.prototype.ClickBox = function(d) 
{
    var idx = d.BoxIdx(d3.mouse(this));
    d.shbox.attr("x",st*idx[0]).attr("y",st*idx[1]);
    if(!d.TestBox(idx)) d.AddBox(idx); 
    else d.RemoveBox(idx);
}
Grid.prototype.UpdateBox = function(d) 
{
    var idx = d.BoxIdx(d3.mouse(this));
    d.shbox.attr("x",st*idx[0]).attr("y",st*idx[1]);
    if(!d.TestBox(idx)) d.shbox.attr("fill","gray");
}


// Liney
Grid.prototype.ClickLine = function(d) 
{
    var idx = d.BoxIdx(d3.mouse(this));
    var  dr = d3.mouse(this).map(function(x){return x%this.st;}); 

    var  xgty = dr[0] > dr[1];                    
    var rxgty = (st-dr[0]) > dr[1];               

    var nidx = d.NeighbourIndex(idx,xgty,rxgty); 

    // "!=" is a javascript way of xoring 
    if(d.TestBox(nidx) != d.TestBox(idx)) 
        d.MakeLine(idx,xgty,rxgty);
}

Grid.prototype.UpdateLine = function(d) 
{
    var idx = d.BoxIdx(d3.mouse(this));
    var  dr = d3.mouse(this).map(function(x){return x%this.st;}); // I have no idea why "this" here is a grid instance
    
    var  xgty = dr[0] > dr[1];                    
    var rxgty = (st-dr[0]) > dr[1];               
                                                  
    d.PositionLine(d.shline,idx,xgty,rxgty);
    var nidx = d.NeighbourIndex(idx,xgty,rxgty); 

    // "!=" is a javascript way of xoring 
    if(d.TestBox(nidx) != d.TestBox(idx)) 
        if(d.linemode == 0) d.shline.attr("stroke","red"); 
                       else d.shline.attr("stroke","blue");
    else d.shline.attr("stroke","gray"); 
}





/////////////////////////////// Mode selectors //////////////////////////////////

Grid.prototype.BoxMode = function()
{
    this.svg
        .on("mousemove",this.UpdateBox)   
        .on("click",    this.ClickBox );  

    if(!this.shbox)
        this.shbox = svg.append("rect")
            .attr("id","shbox")
            .attr("x","0").attr("y","0")
            .attr("width",st).attr("height",st)
            .attr("fill","white");

    if(this.shline) { this.shline.remove(); delete this.shline; }
}

Grid.prototype.LineMode = function()
{
    this.svg
        .on("mousemove",this.UpdateLine)   
        .on("click",    this.ClickLine );  

    if(!this.shline)
        this.shline = svg.append("line")
            .attr("id","shline")
            .attr("x1","0").attr("y1","0")
            .attr("x2",st) .attr("y2","0")
            .attr("stroke","grey");

    if(this.shbox) { this.shbox.remove(); delete this.shbox; }
}
