// ***************************************************
// **************** Constructor **********************
// ***************************************************

function Grid(id,width,height,step)
{
    this.st  = step;
    this.w   = step * width;
    this.h   = step * height;

    this.svg = d3.select(id).append("svg")
                            .attr("width", this.w)
                            .attr("height",this.h)
                            .data([this]); // Attaching self to the d3.data

    // 2D array of elements, null initialized
    this.elems = d3.range(0,this.w,this.st)
                   .map(  
                           function(d) 
                           { 
                               return d3.range(0,this.h,this.st)
                                        .map( function(x){return null;} ) 
                           }
                       );

    this.boxes = this.svg.append("g");
    this.lines = this.svg.append("g");

    this.shbox  = null;
    this.shline = null;
    this.linemode = 0;
    this.boxcount = 0;
}

Grid.prototype.BoxIdx  = function(r) { return [Math.round(r[0]/this.st-0.5),Math.round(r[1]/this.st-0.5)];}

Grid.prototype.LineIdx = function(r)                 
{ 
    var dr = r.map(function(x){return x%this.st;});  // *--3--*---> x
    var ret = 0;                                     // |     |
    if(dr[0] > dr[1]) ret +=1;                       // 2     1
    if((this.st-dr[0]) > dr[1]) ret +=2;             // |     |         
    return ret;                                      // *--0--*
}                                                    // |
                                                     // y
Grid.prototype.NeighbourIndex = function(idx,xgty,rxgty)
{
    var nidx = idx.slice(0); // "slice(0)" makes a copy of an array
    if(xgty) if(rxgty) nidx[1]--; else  nidx[0]++;
    else     if(rxgty) nidx[0]--; else  nidx[1]++;
    return nidx;
}

// ***********************************************
// ***************** Box Mode ********************
// ***********************************************

/////////////////////// Updaters ////////////////////////////
// Note that in updaters "this" is a current DOM object
// while "d" is the d3.data that was associated with it
// namely -- the grid object 
///////////////////////////////////////////////////////////
Grid.prototype.ClickBox = function(d) 
{
    var idx = d.BoxIdx(d3.mouse(this));
    d.shbox.attr("x",d.st*idx[0]).attr("y",d.st*idx[1]);
    if(d.TestBox(idx)) d.RemoveBox(idx);
    else d.AddBox(idx); 
    
}
Grid.prototype.UpdateBox = function(d) 
{
    var idx = d.BoxIdx(d3.mouse(this));
    d.shbox.attr("x",d.st*idx[0]).attr("y",d.st*idx[1]);
    if(!d.TestBox(idx)) d.shbox.attr("fill","gray");
}

///////////////// Mode selector //////////////////
Grid.prototype.BoxMode = function()
{
    this.svg
        .on("mousemove",this.UpdateBox)   
        .on("click",    this.ClickBox );  

    if(!this.shbox)
        this.shbox = this.svg.append("rect")
                             .attr("id","shbox")
                             .attr("x","0").attr("y","0")
                             .attr("width",this.st).attr("height",this.st)
                             .attr("fill","white");

    if(this.shline) { this.shline.remove(); delete this.shline; }
}


//-!-!-!-!-!--!-!-! Do the bounds check, okay? xxxxxxxxxxxxx////////////////
Grid.prototype.TestBox       = function(r) { return this.elems[r[0]][r[1]] != null;} 

Grid.prototype.TestNeighbors = function(r) 
{ 
    return this.elems[r[0]-1][r[1]] != null || 
           this.elems[r[0]+1][r[1]] != null || 
           this.elems[r[0]][r[1]+1] != null || 
           this.elems[r[0]][r[1]-1] != null ;
}


Grid.prototype.AddBox = function(r)
{
    var bx = this.boxes.append("rect")
        .attr("x",r[0]*this.st).attr("y",r[1]*this.st)
        .attr("width",this.st).attr("height",this.st)
        .attr("fill","black");

    this.elems[r[0]][r[1]]     = new Object;
    this.elems[r[0]][r[1]].box = bx;

//    var rn = r.slice(0);
//    if(this.TestBox(rn)) this.MakeLine(r, true, true); else this.RemoveLine(r, true, true);
//    if(this.TestBox(rn)) this.MakeLine(r,false,false); else this.RemoveLine(r,false,false);
//    if(this.TestBox(rn)) this.MakeLine(r,false, true); else this.RemoveLine(r,false, true);
//    if(this.TestBox(rn)) this.MakeLine(r, true,false); else this.RemoveLine(r, true,false);
}

Grid.prototype.RemoveBox = function(r)
{
    this.elems[r[0]][r[1]].box.remove();
    delete this.elems[r[0]][r[1]];
}

// ***********************************************
// ***************** Line Mode *******************
// ***********************************************

/////////////////////// Updaters ////////////////////////////
// Note that in updaters "this" is a current DOM object
// while "d" is the d3.data that was associated with it
// namely -- the grid object 
///////////////////////////////////////////////////////////

Grid.prototype.ClickLine = function(d) 
{
    var idx = d.BoxIdx(d3.mouse(this));
    var  dr = d3.mouse(this).map(function(x){return x%d.st;}); 

    var  xgty = dr[0] > dr[1];                    
    var rxgty = (d.st-dr[0]) > dr[1];               

    var nidx = d.NeighbourIndex(idx,xgty,rxgty); 

    // "!=" is a javascript way of xoring 
    if(d.TestBox(nidx) != d.TestBox(idx)) d.MakeLine(idx,xgty,rxgty);
}

Grid.prototype.UpdateLine = function(d) 
{
    var idx = d.BoxIdx(d3.mouse(this));
    var  dr = d3.mouse(this).map(function(x){return x%d.st;}); 
    
    var  xgty = dr[0] > dr[1];                    
    var rxgty = (d.st-dr[0]) > dr[1];               
                                                  
    d.PositionLine(d.shline,idx,xgty,rxgty);
    var nidx = d.NeighbourIndex(idx,xgty,rxgty); 

    // "!=" is a javascript way of xoring 
    if(d.TestBox(nidx) != d.TestBox(idx)) 
        if(d.linemode == 0) d.shline.attr("stroke","red"); 
                       else d.shline.attr("stroke","blue");
    else d.shline.attr("stroke","gray"); 
}

///////////////// Mode selector //////////////////
Grid.prototype. SetRedLineMode = function() { this.linemode = 0; this.LineMode(); }
Grid.prototype.SetBlueLineMode = function() { this.linemode = 1; this.LineMode(); }
Grid.prototype.LineMode = function()
{
    this.svg
        .on("mousemove",this.UpdateLine)   
        .on("click",    this.ClickLine );  

    if(!this.shline)
        this.shline = this.svg.append("line")
                              .attr("id","shline")
                              .attr("x1","0").attr("y1","0")
                              .attr("x2",this.st) .attr("y2","0")
                              .attr("stroke","grey");

    if(this.shbox) { this.shbox.remove(); delete this.shbox; }
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






