/*
Copyright (c)  2012   John King
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
function Sprite(name)
{
	this.name=name;
	this.title;
	this.ptime=5;
	this.track;
	this.engine;
	this.train;
	this.speed;
	this.finishmove=false;
	this.points=[]; //an array of points along a path depending on time along path giving x and y coordinates and the angle of the gradient at that point
	this.pointer=0;
	this.vector = {xs:0,ys:0,xe:0,ye:0,psi:0};
	this.usevec=false;
	this.expanded=false;
	
	//methods
	this.setAniStage=setAniStage;
	this.copysprite=copysprite;
	this.drawsprite=drawsprite;
	this.drawrailway=drawrailway;
	this.drawalltracks=drawalltracks;
	this.inTheatre=inTheatre;
	this.followPath=followPath;
	this.setPoints=setPoints;
	this.moveSprite=moveSprite;
	this.setVector=setVector;
	this.zeroPointers=zeroPointers;
	this.saveCanvases=saveCanvases;
	this.restoreCanvases=restoreCanvases;
	this.transform=transform;
	this.transformTrack=transformTrack;
	this.nextPointer=nextPointer;
	this.getShapes=getShapes;
	this.expandspritelist=expandspritelist;
}

function copysprite()
{
	var sprite=new Sprite("SUBSP"+(NCOUNT++));
	sprite.title=this.title;
	sprite.engine=this.engine;
	sprite.track=this.track.copytrack("sprite");
	sprite.ptime=this.ptime;
	sprite.finishmove=this.finishmove;
	sprite.points=[];
	for(var i=0; i<this.points.length; i++)
	{
		sprite.points[i]={x:0,y:0,phi:0};
		sprite.points[i].x=this.points[i].x;
		sprite.points[i].y=this.points[i].y;
		sprite.points[i].phi=this.points[i].phi;
	}
	sprite.pointer=this.pointer;
	sprite.vector.xs=this.vector.xs;
	sprite.vector.xe=this.vector.xe;
	sprite.vector.ys=this.vector.ys;
	sprite.vector.ye=this.vector.ye;
	sprite.vector.psi=this.vector.psi;
	sprite.usevec=this.usevec;
	sprite.expanded=false;
	switch (this.engine)
	{
		case "scene":
			sprite.train=this.train.copyscene("sprite");
		break
		case "sprite":
			sprite.train=this.train.copysprite("sprite");
		break
	}
	return sprite;
}

function drawsprite()
{
	switch(this.engine)
	{
		case "scene":
			this.train.drawscene();
		break
		case "sprite":
			this.train.drawsprite();
		break
	}
}

function drawrailway(showpathline)
{
	switch (this.engine)
	{
		case "scene":
			this.train.drawscene();
		break
		case "sprite":
			this.train.transform();
			this.train.drawsprite();
			this.drawalltracks(showpathline);
		break	
	}
}

function drawalltracks(showpathline)
{
	if (this.engine !='scene')
	{
		this.train.track.drawtrack(showpathline);
		this.train.drawalltracks(showpathline);
	}
}

function setVector()
{
	if (this.usevec)
	{
		//position vector for sprite vector
		vector.xs = parseInt($('vecdiv').style.left)+110+MINIVECT.xs;
		vector.xe = parseInt($('vecdiv').style.left)+110+MINIVECT.xe;
		vector.ys = parseInt($('vecdiv').style.top)+110+MINIVECT.ys;
		vector.ye = parseInt($('vecdiv').style.top)+110+MINIVECT.ye;
		var psi = arctan(vector.ye - vector.ys,vector.xe - vector.xs);
	}
	else
	{
		vector.xs=parseInt($('spritecentre').style.left)+10;
		vector.ys=parseInt($('spritecentre').style.top)+10;
		var psi = 0;
	}
	this.vector.xs=vector.xs;
	this.vector.xe=vector.xe;
	this.vector.ys=vector.ys;
	this.vector.ye=vector.ye;
	this.vector.psi = psi;
}

function checksprite(spritename)
{
	var sprite=SPRITES[spritename];
	sprite.setVector();
	$('vecdiv').style.visibility="hidden";
	$('spritecentre').style.visibility="hidden";
	$('checksp').style.visibility="hidden";
	$('savesp').style.visibility="hidden";
	$('checkdone').style.visibility="visible";
	sprite.setPoints();
	sprite.followPath(true);
}

function savesprite(spritename)
{
	var sprite=SPRITES[spritename];
	sprite.setVector();
	sprite.setPoints();
	$("checksp").style.visibility="hidden";
	$("savesp").style.visibility="hidden";
	closedone();
}

function followPath(showpathline)
{
	
	this.zeroPointers();
	this.finishmove=false;
	clear($("spritestage"));
	this.inTheatre($("spritestage"));
	this.saveCanvases();
	this.track.drawtrack(showpathline);
	//HTMLmsg="";
  	this.moveSprite(showpathline);
}

function setPoints()
{
  	var track=this.track;
  	track.ptime=this.ptime*1000;
  	track.setLengths();
  	track.setTimes();
  	var s=0; //section number
  	var t=0; //time in milliseconds 
  	var dt; //fraction of time from 0 to 1 for a section of path
  	var xd,yd,phi //for linear sections
  	this.points=[];
  	var prev;
  	var shape=track.getShape();//alert([track.name,track.title,shape.name,shape.title]);
  	var path=shape.path;//alert(shape.path.point.x)
  	var node=path.next; 
  	while(node.next.point.x!="end")
  	{
  		prev=node;
  		node=node.next;
  		while(t<track.times[s+1])
  		{
  			dt=(t-track.times[s])/(track.times[s+1]-track.times[s]);
  			switch(node.vertex)
  			{
  				case "L":
  					xd=prev.point.x+(node.point.x-prev.point.x)*dt;
  					yd=prev.point.y+(node.point.y-prev.point.y)*dt;
  					phi=arctan((node.point.y-prev.point.y),(node.point.x-prev.point.x));
  					this.points.push({x:xd,y:yd,phi:phi});
  				break
  				case "B":
  					this.points.push({x:x(dt),y:y(dt),phi:arctan(dy(dt),dx(dt))});//alert(["("+prev.point.x+","+prev.point.y+")","("+x(dt)+","+y(dt)+")",dy(dt),dx(dt),arctan(dy(dt),dx(dt))*180/Math.PI])
  				break
  			}
  			llxx=this.points.length-1;
  			//if(this.engine=="sprite"){alert([this.points[llxx].x,this.points[llxx].y,(this.points[llxx].phi)*180/Math.PI])};	
  			t+=50;
  		}
  		s++;
  	}
  	if (!this.open)
  	{
	 	//this.points.pop(); 
  	}
  	if (track.yoyo)
  	{
	  	var apl=this.points.length;
	  	for (var i=apl; i>0; i--)
	  	{
		  	this.points.push(this.points[i-1]);
	  	}
  	}
  	if (this.engine !='scene')
 	{
	 	this.train.setPoints();  
  	}
  
  	function x(t)
	{
		return (1-t)*(1-t)*(1-t)*prev.point.x + 3*(1-t)*(1-t)*t*node.ctrl1.x + 3*(1-t)*t*t*node.ctrl2.x + t*t*t*node.point.x
	}
	
	function y(t)
	{
	
		return (1-t)*(1-t)*(1-t)*prev.point.y + 3*(1-t)*(1-t)*t*node.ctrl1.y + 3*(1-t)*t*t*node.ctrl2.y + t*t*t*node.point.y
	}
	
	function dx(t)
	{
		return -3*(1-t)*(1-t)*prev.point.x + (3*(1-t)*(1-t) - 6*(1-t)*t)*node.ctrl1.x + (6*(1-t)*t - 3*t*t)*node.ctrl2.x + 3*t*t*node.point.x;
	}
	
	function dy(t)
	{
		return -3*(1-t)*(1-t)*prev.point.y + (3*(1-t)*(1-t) - 6*(1-t)*t)*node.ctrl1.y + (6*(1-t)*t - 3*t*t)*node.ctrl2.y + 3*t*t*node.point.y;
	}
}

function moveSprite(showpathline)
{
	this.transform();
	this.drawalltracks(showpathline);
	if (!this.finishmove)
	{
		this.drawsprite();
		var sprite=this;
	  	setTimeout(function() {sprite.moveSprite(showpathline)},50);
	}
	else
	{
		//$("msg").innerHTML=HTMLmsg;
		alert('Check completed');
		$("checkdone").style.visibility="hidden";
		STOPCHECKING=false;
		$("checksp").style.visibility="visible";
		$("savesp").style.visibility="visible";
		this.restoreCanvases();
		this.zeroPointers();

		if (1==2) //editcheck
		{
			if (trackcheck)
			{
				restoretracksprops(sprite);
			}
			editsprite();
		}
		else
		{
			this.saveCanvases();
			clear($("spritestage"));
			this.inTheatre($("spritestage"));
			this.drawrailway(true);
			this.restoreCanvases();
			if (this.usevec)
			{
				$('vecdiv').style.visibility='visible';
			}
			else
			{
				$('spritecentre').style.visibility='visible';
			}
		}
	}
}

function inTheatre(theatre)
{
	var shape=this.track.getShape();
	shape.addTo(theatre);
	switch (this.engine)
	{
		case "scene":
			for(var name in this.train.shapes)
			{
				shape=this.train.shapes[name];
				shape.addTo(theatre);
			}
		break
		case "sprite":
			this.train.inTheatre(theatre);
		break
	}
}

function zeroPointers()
{
	this.pointer=0;
	if (this.engine!='scene')
	{
		this.train.zeroPointers();
	}
}

function saveCanvases()
{
	var shape;
	switch (this.engine)
	{
		case "scene":
			shape=this.track.getShape();
			shape.Canvas.ctx.save();
			for(var name in this.train.shapes)
			{
				shape=this.train.shapes[name];
				shape.Canvas.ctx.save();
			}
		break
		case "sprite":
			shape=this.track.getShape();
			shape.Canvas.ctx.save();
			this.train.saveCanvases();
		break
	}
}

function restoreCanvases()
{
	var shape;
	switch (this.engine)
	{
		case "scene":
			shape=this.track.getShape();
			shape.Canvas.ctx.restore();
			for(var name in this.train.shapes)
			{
				shape=this.train.shapes[name];
				shape.Canvas.ctx.restore();
			}
		break
		case "sprite":
			shape=this.track.getShape();
			shape.Canvas.ctx.restore();
			this.train.restoreCanvases();
		break
	}
}

function transform()
{
	var curptr=this.pointer % this.points.length;
	this.nextPointer();
	var p = this.points[curptr];
	switch(this.engine)
    {
    	case 'scene':	
			for(var name in this.train.shapes)
			{	
				shape=this.train.shapes[name];
				shape.Canvas.ctx.translate(p.x,p.y);
				if (this.usevec)
				{
					var psi=p.phi-this.vector.psi;
					shape.Canvas.ctx.rotate(psi);
				}
				shape.Canvas.ctx.translate(-this.vector.xs, -this.vector.ys);
			}
		break
		case "sprite":
			this.transformTrack(p);
			var shapes=this.train.getShapes();
			for(var name in shapes)
			{	
				shape=shapes[name];
				shape.Canvas.ctx.translate(p.x,p.y);
				if (this.usevec)
				{
					var psi=p.phi-this.vector.psi;
					shape.Canvas.ctx.rotate(psi);
				}
				shape.Canvas.ctx.translate(-this.vector.xs, -this.vector.ys);
			}
			this.train.transform();
		break
	}
}

function transformTrack(p)
{
	if (this.engine !='scene')
	{
		var shape=this.train.track.getShape();
		shape.Canvas.ctx.translate(p.x,p.y);//$("msg").innerHTML+=p.x+".."+p.y+"..."+p.phi*180/Math.PI+"<br>";
		if (this.usevec)
		{
			var psi=p.phi-this.vector.psi;
			shape.Canvas.ctx.rotate(psi);
		}
		shape.Canvas.ctx.translate(-this.vector.xs, -this.vector.ys);
		this.train.transformTrack(p);
	}
}

function nextPointer()
{
	if (STOPCHECKING)
	{
		this.finishmove=true;
		return;
	}
	
	this.finishmove=false;
	if (this.track.repeats=='c')
	{
		this.pointer +=1;
		return;
	}
	var shape=this.track.getShape();
	if (!shape.open && this.pointer>=((this.track.repeats+1)*this.points.length))
	{
		this.finishmove=true;
	}
	else if (shape.editable && this.pointer>=((this.track.repeats+1)*this.points.length - 1))
	{
		this.finishmove=true;
	}
	else
	{
		this.pointer +=1;
	}
}

function getShapes()
{
	switch(this.engine)
	{
		case "scene":
			return this.train.shapes;
		break
		case "sprite":
			return this.train.getShapes();
		break
	}
}

function expandspritelist()
{
	LIMARGIN+="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	switch(this.engine)
	{
		case "scene":
			var scene=this.train;
			$("innersp").innerHTML+='<li sprite='+this.name+'id='+scene.name+'>'+LIMARGIN+' <img src="assets/edit.png" alt="edit" title="edit" onclick="sceneEdit(this)" /> <span id="SC'+(SPANCOUNT++)+'" class="innertext">'+scene.title+'</span></li>';
			var track=this.track;
			$("innersp").innerHTML+='<li sprite='+this.name+'id='+track.name+'>'+LIMARGIN+' <img src="assets/edit.png" alt="edit" title="edit" onclick="trackEdit(this)" /><span id="TR'+(SPANCOUNT++)+'" class="innertext">'+track.title+'</span></li>';
		break
		case "sprite":
			var sprite=this.train;
			if(sprite.expanded)
			{
				$("innersp").innerHTML+='<li sprite='+this.name+'id='+sprite.name+' >'+LIMARGIN+'  <img src="assets/contract.gif" alt="contract" title="contract" onclick=expand(this) /> <img src="assets/edit.png" alt="edit" title="edit" onclick="spriteEdit(this)" /> <img src="assets/delete.gif" alt="delete" title="delete" onclick="spriteDelete(this)" /> <span id="SP'+(SPANCOUNT++)+'" class="innertext">'+sprite.title+'</span></li>';
				sprite.expandspritelist();
			}
			else
			{
				$("innersp").innerHTML+='<li sprite='+this.name+'id='+sprite.name+' >'+LIMARGIN+'  <img src="assets/expand.gif" alt="expand" title="expand" onclick=expand(this) /> <img src="assets/edit.png" alt="edit" title="edit" onclick="spriteEdit(this)" /> <img src="assets/delete.gif" alt="delete" title="delete" onclick="spriteDelete(this)" /> <span id="SP'+(SPANCOUNT++)+'" class="innertext">'+sprite.title+'</span></li>';
			}
		break
	}
}

function getspritefromname(name)
{
	if(this.engine!="sprite")
	{
		return 
	}
}