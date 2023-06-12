import { Injectable } from '@angular/core';
import { DAGService } from './dag.service';
import { Line } from '../models/Line.model';
import { LinesService } from './lines.service';
import { Node } from '../models/Node.model';
import { Trapezoid } from '../models/Trapezoid.model';
import { V_Node } from '../models/V_Node.model';
import { H_Node } from '../models/H_Node.model';
import { Point } from '../models/Point.model';
import { RICService } from './ric.service';

@Injectable({
  providedIn: 'root'
})
export class DRAWService {
  private extremes:any;
  private xSpan:number=-1;
  private ySpan:number=-1;
  //private locationPoint?:Point;
  public trapUpdate:{node:Node,mode:string,mergeTrap?:Node}[]=[];
  private visited:(Node|Line)[]=[];

  constructor(private linesService:LinesService,private dagService:DAGService) {
    this.updateExtremes();
  }

  updateExtremes(){
    this.extremes=this.linesService.getExtremes();
    this.xSpan=this.extremes?.maxX-this.extremes?.minX;
    this.ySpan=this.extremes?.maxY-this.extremes?.minY;
    this.ySpan=this.ySpan==0?1:this.ySpan
    this.dagService.init()
  }

  drawLine(line:Line,canvas:any,cc?:any,xMod?:number,w?:number,yMod?:number,h?:number){
    const ll=line.left;
    const lr=line.right;
    if(!cc&&!xMod&&!w&&!yMod&&!h){
      h=canvas.height;
      w=canvas.width;
      xMod=w!/this.xSpan;
      yMod=h!/this.ySpan;
      cc=canvas?.getContext("2d");
    }
    cc.strokeText(line.name,this.calcX((ll.x+lr.x)/2,xMod!,w),this.calcY((ll.y+lr.y)/2,yMod!,h))
    cc.strokeText(ll.name,this.calcX(ll.x,xMod!,w),this.calcY(ll.y,yMod!,h))
    cc.strokeText(lr.name,this.calcX(lr.x,xMod!,w),this.calcY(lr.y,yMod!,h))
    cc.beginPath();
    cc.moveTo(this.calcX(line.left.x,xMod!),this.calcY(line.left.y,yMod!));
    cc.lineTo(this.calcX(line.right.x,xMod!),this.calcY(line.right.y,yMod!));
    cc.closePath();
    cc.stroke();
  }

  drawLines(canvas:any){
    const h=canvas.height;
    const w=canvas.width;
    const xMod=w/this.xSpan;
    const yMod=h/this.ySpan;
    const cc=canvas?.getContext("2d");
    cc.fillStyle="#FFFFFF";
    cc.fillRect(0,0,w,h);
    cc.strokeRect(0,0,w,h);
    this.linesService.getLines().forEach(line => {
      this.drawLine(line,canvas,cc,xMod,w,yMod,h)
    });
  }

  drawIntersections(canvas:any,line:Line, intersections:Line[]){
    const h=canvas.height;
    const w=canvas.width;
    const xMod=w/this.xSpan;
    const yMod=h/this.ySpan;
    const cc=canvas?.getContext("2d");
    cc.fillStyle="#FFFFFF";
    cc.fillRect(0,0,w,h);
    cc.strokeRect(0,0,w,h);
    cc.strokeStyle="#FF0000";
    this.drawLine(line,canvas,cc,xMod,w,yMod,h);
    cc.strokeStyle="#000000"
    this.linesService.getLines().forEach(line => {
      //console.log(intersections.find((intersection)=>{return intersection.name===line.name}))
      if(intersections.find((intersection)=>{return intersection.name===line.name})){
        cc.strokeStyle="#00FFFF"
      }
      this.drawLine(line,canvas,cc,xMod,w,yMod,h)
      cc.strokeStyle="#000000";
    });
  }

  drawRIC(canvas:any){
    this.visited=[]
    const trapNode=this.dagService.locate(new Point(this.extremes.minX-1,0))
    const h=canvas.height;
    const w=canvas.width;
    const xMod=w/this.xSpan;
    const yMod=h/this.ySpan;
    const cc=canvas?.getContext("2d");
    cc.fillStyle="#FFFFFF";
    cc.fillRect(0,0,w,h);
    cc.strokeRect(0,0,w,h);
    const trap = trapNode.getInner(); 
    if(trap instanceof Trapezoid){
      this.drawRICTrap(trap,canvas,cc,xMod,yMod,w,h)
    }
    for(let n of this.visited)n.visited=false;
  }

  drawRICTrap(trap:Trapezoid,canvas:any,cc:any,xMod:number,yMod:number,w:number,h:number){
    const lp=trap.left;
    const rp=trap.right;
    const tl=trap.top;
    const bl=trap.bottom;
    if(!tl.visited){
      tl.visited=true;
      this.visited.push(tl)
      this.drawLine(tl,canvas,cc,xMod,w,yMod,h)
    }
    if(!bl.visited){
      bl.visited=true;
      this.visited.push(bl)
      this.drawLine(bl,canvas,cc,xMod,w,yMod,h)
    }
    cc.beginPath();
    cc.moveTo(this.calcX(lp.x,xMod),this.calcY(tl.func(lp),yMod));
    cc.lineTo(this.calcX(lp.x,xMod),this.calcY(bl.func(lp),yMod));
    cc.moveTo(this.calcX(rp.x,xMod),this.calcY(tl.func(rp),yMod));
    cc.lineTo(this.calcX(rp.x,xMod),this.calcY(bl.func(rp),yMod));
    cc.closePath();
    cc.stroke();
    cc.strokeText(trap.id,this.calcIdX(lp.x,rp.x,xMod,w),this.calcIdY(tl.func(lp),tl.func(rp),bl.func(lp),bl.func(rp),yMod,h));
    trap.getNeighbors().right.forEach((node)=>{
      let t=node.getInner();
      if(t instanceof Trapezoid && !node.visited){
        node.visited=true;
        this.visited.push(node);
        this.drawRICTrap(t,canvas,cc,xMod,yMod,w,h)
      }   
    })
  }

  calcIdX(n1:number,n2:number,mod:number,width:number):number{
    return (this.calcX(n1,mod,width)+this.calcX(n2,mod,width))/2
  }

  calcIdY(n1:number,n2:number,n3:number,n4:number,mod:number,height:number):number{
    return (this.calcY(n1,mod,height)+this.calcY(n2,mod,height)+this.calcY(n3,mod,height)+this.calcY(n4,mod,height))/4
  }

  calcX(n:number,mod:number,width?:number):number{
    const ret=(n-this.extremes.minX)*mod+this.borderX(n);
    if(width){
      if(ret<0) return 0;
      if(ret>width) return width;
    }
    return ret;
  }

  calcY(n:number,mod:number,height?:number):number{
    const ret=(n-this.extremes.minY)*mod+this.borderY(n);
    if(height){
      if(ret<0) return 0;
      if(ret>height) return height;
    }
    return ret;
  }

  borderX(n:number):number{
    return this.border((n-this.extremes.minX)/this.xSpan)
  }

  borderY(n:number):number{
    return this.border((n-this.extremes.minY)/this.ySpan)
  }

  border(n:number):number{
    return -40*n+20
  }

  calcRealXY(canvas:any,canvX:number,canvY:number):number[]{
    const x=((canvX-20)*this.xSpan)/(canvas.width-40)+this.extremes.minX
    const y=((canvY-20)*this.ySpan)/(canvas.height-40)+this.extremes.minY
    return [x,y]
  }

  point(canvas:any,canvasDAG:any,x:number,y:number):H_Node|V_Node|Trapezoid|undefined{
    const canvX=this.calcX(x,canvas.width/this.xSpan)
    const canvY=this.calcY(y,canvas.height/this.ySpan)
    let locationPoint=new Point(x,y,"q")
    const cc=canvas?.getContext("2d");
    cc.fillStyle="#000000"
    cc.fillRect(canvX,canvY,3,3);
    cc.strokeText(locationPoint.name,canvX+3,canvY)
    cc.fillStyle="#ffffff"
    let locTrap=this.dagService.locate(locationPoint).getInner()
    this.drawDAG(canvasDAG,"locate")
    return locTrap
  }

  drawDAG(canvasDAG:any,locateOrUpdate?:string,trapUpdate?:{node:Node,mode:string,mergeTrap?:Node}[]){
    this.trapUpdate=trapUpdate??[];
    const maxDepth=this.dagService.getMaxDepth()+1;
    const root=this.dagService.getRoot();
    const h=canvasDAG.height;
    const w=canvasDAG.width;
    const cc=canvasDAG?.getContext("2d");
    cc.fillStyle="#FFFFFF";
    cc.fillRect(0,0,w,h);
    cc.strokeRect(0,0,w,h);
    this.drawNode(cc,root,w,h,maxDepth,[],undefined,undefined,undefined,true,locateOrUpdate);
  }

  drawNode(cc:any,node:Node,w:number,h:number,max:number,mergedNodes:{node:Node,drawPos:number[]}[],parentw?:number,parenth?:number,leftOrRight?:number,locationPathParent?:boolean,locateOrUpdate?:string,isNew?:boolean){
    let isLocationNode=this.dagService.locationPath.includes(node);
    let wasUpdateTrapNode=this.trapUpdate.some(tU=>tU.node===node);
    let d:number=node.getDepth()+1;
    const drawHeight:number=h*d/(max+1);
    let drawWidth:number=w/(2**d);
    if(node.merged){
      var mergeNode=mergedNodes.filter((mergeNode) => {return mergeNode.node===node})[0];
      if(mergeNode){
        this.drawMergeArrow(cc,
          parentw!,parenth!+3,
          parentw!+leftOrRight!*drawWidth*2,drawHeight,
          mergeNode.drawPos[0],h*(d-1)/(max+1),
          mergeNode.drawPos[0],mergeNode.drawPos[1]-10,
          (isLocationNode&&locationPathParent&&locateOrUpdate==="locate"),
          isNew);
        return;
      }
    }
    if(parentw&&parenth&&leftOrRight) {
      drawWidth=parentw+leftOrRight*drawWidth;
      this.drawArrow(cc,parentw,parenth+3,drawWidth,drawHeight-10,(isLocationNode&&locationPathParent&&locateOrUpdate==="locate"),isNew)
    }
    if(node.merged){
      mergedNodes.push({node:node,drawPos:[drawWidth,drawHeight]})
    }
    const n=node.getInner()
    if(n instanceof Trapezoid){
      this.drawTrap(cc,n.id,drawWidth,drawHeight,(isLocationNode||wasUpdateTrapNode)&&locateOrUpdate==="locate",isNew)
    }
    if(n instanceof V_Node){
      let iN=wasUpdateTrapNode&&locateOrUpdate==="update"||isNew
      this.drawVNode(cc,n.line.name,drawWidth,drawHeight,isLocationNode&&locateOrUpdate==="locate",iN)
      this.drawNode(cc,node.leftChild!,w,h,max,mergedNodes,drawWidth,drawHeight,-1,isLocationNode,locateOrUpdate,iN);
      this.drawNode(cc,node.rightChild!,w,h,max,mergedNodes,drawWidth,drawHeight,1,isLocationNode,locateOrUpdate,iN);
    }
    if(n instanceof H_Node){
      let iN=wasUpdateTrapNode&&locateOrUpdate==="update"||isNew
      this.drawHNode(cc,n.point.name,drawWidth,drawHeight,isLocationNode&&locateOrUpdate==="locate",iN)
      this.drawNode(cc,node.leftChild!,w,h,max,mergedNodes,drawWidth,drawHeight,-1,isLocationNode,locateOrUpdate,iN);
      this.drawNode(cc,node.rightChild!,w,h,max,mergedNodes,drawWidth,drawHeight,1,isLocationNode,locateOrUpdate,iN);
    }
  }

  drawTrap(cc:any,id:number,w:number,h:number,loc?:boolean,isNew?:boolean){
    if(loc)cc.strokeStyle="#FF0000"
    if(isNew)cc.strokeStyle="#00FFFF"
    cc.strokeText(id,w,h)
    cc.strokeStyle="#000000"
  }

  drawVNode(cc:any,name:string,w:number,h:number,loc?:boolean,isNew?:boolean){
    if(loc)cc.strokeStyle="#FF0000"
    if(isNew)cc.strokeStyle="#00FFFF"
    cc.strokeText(name,w,h)
    cc.strokeStyle="#000000"
  }

  drawHNode(cc:any,name:string,w:number,h:number,loc?:boolean,isNew?:boolean){
    if(loc)cc.strokeStyle="#FF0000"
    if(isNew)cc.strokeStyle="#00FFFF"
    cc.strokeText(name,w,h)
    cc.strokeStyle="#000000"
  }

  drawArrow(cc:any,fromx:number,fromy:number,tox:number,toy:number,loc?:boolean,isNew?:boolean){ // https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag, modified
    if(loc)cc.strokeStyle="#FF0000"
    if(isNew)cc.strokeStyle="#00FFFF"
    cc.beginPath();
    var headlen = 5; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);
    cc.moveTo(fromx, fromy);
    cc.lineTo(tox, toy);
    cc.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    cc.moveTo(tox, toy);
    cc.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    cc.stroke();
    cc.strokeStyle="#000000"
  }

  drawMergeArrow(cc:any,fromx:number,fromy:number,cp1x:number,cp1y:number,cp2x:number,cp2y:number,tox:number,toy:number,loc?:boolean,isNew?:boolean){
    if(loc)cc.strokeStyle="#FF0000"
    if(isNew)cc.strokeStyle="#00FFFF"
    cc.beginPath();
    cc.moveTo(fromx,fromy);
    cc.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,tox,toy);
    cc.stroke();
    cc.strokeStyle="#000000"
  }
}
