import { Inject, Injectable } from '@angular/core';
import { Line } from '../models/Line.model';
import { Trapezoid } from '../models/Trapezoid.model';
import { Point } from '../models/Point.model';
import { LinesService } from './lines.service';
import { DAGService } from './dag.service';
import { H_Node } from '../models/H_Node.model';
import { V_Node } from '../models/V_Node.model';
import { Node } from '../models/Node.model';

@Injectable({
  providedIn: 'root'
})
export class RICService {
  private trapNodes:Node[]=[];
  private trapUpdate:{node:Node,mode:string,mergeTrap?:Node}[]=[];
  private extremes:any;
  private xSpan:number=-1;
  private ySpan:number=-1;
  private counter:number=1;
  private locationPoint?:Point;
  private trap?:Trapezoid;
  private stepCounter:number=0;

  constructor(private linesService:LinesService, private dagService:DAGService) {
    this.updateExtremes();
    this.trapNodes.push(dagService.locate(new Point(this.xSpan,this.ySpan!)))
  }

  updateExtremes(){
    this.extremes=this.linesService.getExtremes();
    this.xSpan=this.extremes.maxX-this.extremes.minX;
    this.ySpan=this.extremes.maxY-this.extremes.minY;
    this.dagService.init()
  }

  reset(){
    this.linesService.findExtremes();
    this.updateExtremes();
    this.dagService.init();
    this.trapNodes=[];
    this.trapNodes.push(this.dagService.locate(new Point(this.xSpan,this.ySpan)))
    this.counter=1;
    this.stepCounter=0;
  }

  stepBck(){
    this.reset();
  }

  stepFwd(line:Line,canvas:any,canvasDAG:any):number{
    if(this.stepCounter%2==0){
      this.trap=this.stepFwdLocate(line,canvas,canvasDAG);
      this.stepCounter++;
      return 0;
    } 
    else{
      this.stepFwdUpdate(line,canvas,canvasDAG,this.trap!);
      this.stepCounter++;
      return 1;
    }
  }

  stepFwdLocate(line:Line,canvas:any,canvasDAG:any):Trapezoid{
    this.trapUpdate=[];
    var node=this.dagService.locate(line.left);
    var trap:any=node.getInner();
    //this.trapNodes=this.trapNodes.filter(tNode => {return tNode !== node});
    if(line.right.x<trap.right.x){
      this.trapUpdate.push({node:node,mode:"both"});
    }
    else{
      this.trapUpdate.push({node:node,mode:"left"});
      if(trap.rightNeighbors.length==1||line.func(trap.right)<trap.right.y){ //kleiner, da y von oben!!
        node=trap.rightNeighbors[0];
      }
      else{
        node=trap.rightNeighbors[1]
      }
      trap=node.getInner();
      while(line.right.x>trap.right.x){
        //this.trapNodes=this.trapNodes.filter(tNode => {return tNode !== node});
        this.trapUpdate.push({node:node,mode:"none"});
        if(trap.rightNeighbors.length==1||line.func(trap.right)<trap.right.y){ //kleiner, da y von oben!!
          node=trap.rightNeighbors[0];
        }
        else{node=trap.rightNeighbors[1]}
        trap=node.getInner();
      }
      //this.trapNodes=this.trapNodes.filter(tNode => {return tNode !== node});
      this.trapUpdate.push({node:node,mode:"right"});
    }
    this.drawRIC(canvas);
    this.drawDAG(canvasDAG,"locate");
    this.drawLine(line,canvas);
    return trap;
  }

  stepFwdUpdate(line:Line,canvas:any,canvasDAG:any,trap:Trapezoid){
    this.trapNodes=this.trapNodes.filter(tNode => {return this.trapNodes.includes(tNode)})
    this.trapUpdate.forEach((tU,index) => {
      const tUd=tU.node.getDepth();
      if(tU.mode==="both"){
        const t1=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,line.left,trap.top,trap.bottom));
        const t2=new Node(tUd+3,new Trapezoid(this.counter++,line.left,line.right,trap.top,line));
        const t3=new Node(tUd+3,new Trapezoid(this.counter++,line.left,line.right,line,trap.bottom));
        const t4=new Node(tUd+2,new Trapezoid(this.counter++,line.right,trap.right,trap.top,trap.bottom));
        this.dagService.setMaxDepth(tUd+3);
        var tUn=tU.node.getNeighbors();
        t1.setNeighbors(tUn.left,[t2,t3]);
        t2.setNeighbors([t1],[t4]);
        t3.setNeighbors([t1],[t4]);
        t4.setNeighbors([t2,t3],tUn.right);
        tUn.left.forEach(lN => {
          if(lN.getNeighbors().right.length===1){
            lN.setNeighbors(lN.getNeighbors().left,[t1]);
          }
          else{
            const r=lN.getNeighbors().right[0]===tU.node?[t1,lN.getNeighbors().right[1]]:[lN.getNeighbors().right[0],t1]
            lN.setNeighbors(lN.getNeighbors().left,r);
          }
        })
        tUn.right.forEach(rN => {
          if(rN.getNeighbors().left.length===1){
            rN.setNeighbors([t4],rN.getNeighbors().right);
          }
          else{
            const l=rN.getNeighbors().left[0]===tU.node?[t4,rN.getNeighbors().left[1]]:[rN.getNeighbors().left[0],t4]
            rN.setNeighbors(l,rN.getNeighbors().right);
          }
        })
        tU.node.setInner(new H_Node(line.left,
          t1,
          new Node(tUd+1,new H_Node(line.right,
            new Node(tUd+2,new V_Node(line,
              t2,
              t3
            )),
            t4
          ))
        ))
        this.trapNodes.push(t1,t2,t3,t4);
        
      }
      else if(tU.mode==="left"){
        const trap:any=tU.node.getInner();
        const t1=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,line.left,trap.top,trap.bottom));
        const t2=new Node(tUd+2,new Trapezoid(this.counter++,line.left,trap.right,trap.top,line));
        const t3=new Node(tUd+2,new Trapezoid(this.counter++,line.left,trap.right,line,trap.bottom));
        const v=new Node(tUd+1,new V_Node(line,t2,t3));
        this.dagService.setMaxDepth(tUd+2);
        var tUn=tU.node.getNeighbors();
        t1.setNeighbors(tUn.left,[t2,t3]);
        t2.setNeighbors([t1],tUn.right);
        t3.setNeighbors([t1],tUn.right);
        tUn.left.forEach(lN => {
          if(lN.getNeighbors().right.length===1){
            lN.setNeighbors(lN.getNeighbors().left,[t1]);
          }
          else{
            const r=lN.getNeighbors().right[0]===tU.node?[t1,lN.getNeighbors().right[1]]:[lN.getNeighbors().right[0],t1]
            lN.setNeighbors(lN.getNeighbors().left,r);
          }
        })
        tUn.right.forEach(rN =>{
          if(line.func((<any>rN.getInner()).left)<(<any>rN.getInner()).left.y){
            rN.setNeighbors(rN.getNeighbors().left.length===1?[t3]:[t3,rN.getNeighbors().left[1]],rN.getNeighbors().right);
            this.trapUpdate[index+1]={...this.trapUpdate[index+1],mergeTrap:t2}
          }
          else{
            rN.setNeighbors(rN.getNeighbors().left.length===1?[t2]:[rN.getNeighbors().left[0],t2],rN.getNeighbors().right);
            this.trapUpdate[index+1]={...this.trapUpdate[index+1],mergeTrap:t3}
          }
        })
        tU.node.setInner(new H_Node(line.left,
          t1,
          v
        ))
        this.trapNodes.push(t1,t2,t3);
        
      }
      else if(tU.mode==="none"){
        const trap:any=tU.node.getInner();
        var tUn=tU.node.getNeighbors();
        var t1:Node|any;
        var t2:Node|any;
        if(line.func(trap.left)<trap.left.y){
          t1=tU.mergeTrap;
          t2=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,trap.right,line,trap.bottom));
          t1.setDepth(Math.max(t1.getDepth(),tUd+2));
          t1.merge(trap.right);
        }
        else{
          t1=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,trap.right,trap.top,line));
          t2=tU.mergeTrap;
          t2.setDepth(Math.max(t2.getDepth(),tUd+2));
          t2.merge(trap.right);
        }
        this.dagService.setMaxDepth(tUd+1);
        if(t1.merged){
          t1.setNeighbors(t1.getNeighbors().left,tUn.right);
          t2.setNeighbors(tUn.left,tUn.right);
        }
        if(t2.merged){
          t1.setNeighbors(tUn.left,tUn.right);
          t2.setNeighbors(t2.getNeighbors().left,tUn.right);
        }
        tUn.left.forEach(lN =>{
          if(t1.merged){
            lN.setNeighbors(lN.getNeighbors().left,tUn.left.length===1?[t2,lN.getNeighbors().right[1]]:[t2]);
          }
          if(t2.merged){
            lN.setNeighbors(lN.getNeighbors().left,tUn.left.length===1?[lN.getNeighbors().right[0],t1]:[t1]);
          }
        })
        tUn.right.forEach(rN =>{
          if(line.func((<any>rN.getInner()).left)<(<any>rN.getInner()).left.y){
            rN.setNeighbors(rN.getNeighbors().left.length===1?[t2]:[t2,rN.getNeighbors().left[1]],rN.getNeighbors().right);
            this.trapUpdate[index+1]={...this.trapUpdate[index+1],mergeTrap:t1}
          }
          else{
            rN.setNeighbors(rN.getNeighbors().left.length===1?[t1]:[rN.getNeighbors().left[0],t1],rN.getNeighbors().right);
            this.trapUpdate[index+1]={...this.trapUpdate[index+1],mergeTrap:t2}
          }
        })
        tU.node.setInner(new V_Node(line,
          t1,
          t2
        ))
        for(let t of [t1,t2]){
          if(!t.merged){
            this.trapNodes.push(t);
          }
        }
      }
      else if(tU.mode==="right"){
        const trap:any=tU.node.getInner();
        var tUn=tU.node.getNeighbors();
        var t1:Node|any;
        var t2:Node|any;
        if(line.func(trap.left)<trap.left.y){
          t1=tU.mergeTrap;
          t2=new Node(tUd+2,new Trapezoid(this.counter++,trap.left,line.right,line,trap.bottom));
          t1.setDepth(Math.max(t1.getDepth(),tUd+2));
          t1.merge(line.right);
        }
        else{
          t1=new Node(tUd+2,new Trapezoid(this.counter++,trap.left,line.right,trap.top,line));
          t2=tU.mergeTrap;
          t2.setDepth(Math.max(t2.getDepth(),tUd+2));
          t2.merge(line.right);
        }
        const t3=new Node(tUd+1,new Trapezoid(this.counter++,line.right,trap.right,trap.top,trap.bottom));
        this.dagService.setMaxDepth(tUd+2);
        if(t1.merged){
          t1.setNeighbors(t1.getNeighbors().left,[t3]);
          t2.setNeighbors(tUn.left,[t3]);
        }
        if(t2.merged){
          t1.setNeighbors(tUn.left,[t3]);
          t2.setNeighbors(t2.getNeighbors().left,[t3]);
        }
        t3.setNeighbors([t1,t2],tUn.right);
        tUn.left.forEach(lN => {
          if(t1.merged){
            lN.setNeighbors(lN.getNeighbors().left,tUn.left.length===1?[t2,lN.getNeighbors().right[1]]:[t2]);
          }
          if(t2.merged){
            lN.setNeighbors(lN.getNeighbors().left,tUn.left.length===1?[lN.getNeighbors().right[0],t1]:[t1]);
          }
        })
        tUn.right.forEach(rN => {
          if(rN.getNeighbors().left.length===1){
            rN.setNeighbors([t3],rN.getNeighbors().right);
          }
          else{
            const l=rN.getNeighbors().left[0]===tU.node?[t3,rN.getNeighbors().left[1]]:[rN.getNeighbors().left[0],t3]
            rN.setNeighbors(l,rN.getNeighbors().right);
          }
        })
        tU.node.setInner(new H_Node(line.right,
          new Node(tUd+1,new V_Node(line,
            t1,
            t2
          )),
          t3
        ))
        for(let t of [t1,t2,t3]){
          if(!t.merged){
            this.trapNodes.push(t);
          }
        }
      }
    })
    this.drawRIC(canvas);
    this.drawDAG(canvasDAG,"update");
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
      /* const ll=line.left;
      const lr=line.right;
      cc.strokeText(line.name,this.calcX((ll.x+lr.x)/2,xMod,w),this.calcY((ll.y+lr.y)/2,yMod,h))
      cc.strokeText(ll.name,this.calcX(ll.x,xMod,w),this.calcY(ll.y,yMod,h))
      cc.strokeText(lr.name,this.calcX(lr.x,xMod,w),this.calcY(lr.y,yMod,h))
      cc.beginPath();
      cc.moveTo(this.calcX(line.left.x,xMod),this.calcY(line.left.y,yMod));
      cc.lineTo(this.calcX(line.right.x,xMod),this.calcY(line.right.y,yMod));
      cc.closePath();
      cc.stroke(); */
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
      console.log(intersections.find((intersection)=>{return intersection.name===line.name}))
      if(intersections.find((intersection)=>{return intersection.name===line.name})){
        cc.strokeStyle="#00FFFF"
      }
      this.drawLine(line,canvas,cc,xMod,w,yMod,h)
      cc.strokeStyle="#000000";
      /* const ll=line.left;
      const lr=line.right;
      cc.strokeText(line.name,this.calcX((ll.x+lr.x)/2,xMod,w),this.calcY((ll.y+lr.y)/2,yMod,h))
      cc.strokeText(ll.name,this.calcX(ll.x,xMod,w),this.calcY(ll.y,yMod,h))
      cc.strokeText(lr.name,this.calcX(lr.x,xMod,w),this.calcY(lr.y,yMod,h))
      cc.beginPath();
      cc.moveTo(this.calcX(line.left.x,xMod),this.calcY(line.left.y,yMod));
      cc.lineTo(this.calcX(line.right.x,xMod),this.calcY(line.right.y,yMod));
      cc.closePath();
      cc.stroke(); */
    });
  }

  drawRIC(canvas:any){
    const h=canvas.height;
    const w=canvas.width;
    const xMod=w/this.xSpan;
    const yMod=h/this.ySpan;
    const cc=canvas?.getContext("2d");
    cc.fillStyle="#FFFFFF";
    cc.fillRect(0,0,w,h);
    cc.strokeRect(0,0,w,h);
    this.trapNodes.forEach(node =>{
      const trap = node.getInner();
      if(trap instanceof Trapezoid){
        const lp=trap.left;
        const rp=trap.right;
        const tl=trap.top;
        const bl=trap.bottom;
        cc.beginPath();
        cc.moveTo(this.calcX(tl.left.x,xMod),this.calcY(tl.left.y,yMod));
        cc.lineTo(this.calcX(tl.right.x,xMod),this.calcY(tl.right.y,yMod));
        cc.moveTo(this.calcX(bl.left.x,xMod),this.calcY(bl.left.y,yMod));
        cc.lineTo(this.calcX(bl.right.x,xMod),this.calcY(bl.right.y,yMod));
        cc.moveTo(this.calcX(lp.x,xMod),this.calcY(tl.func(lp),yMod));
        cc.lineTo(this.calcX(lp.x,xMod),this.calcY(bl.func(lp),yMod));
        cc.moveTo(this.calcX(rp.x,xMod),this.calcY(tl.func(rp),yMod));
        cc.lineTo(this.calcX(rp.x,xMod),this.calcY(bl.func(rp),yMod));
        cc.closePath();
        cc.stroke();
        cc.strokeText(trap.id,this.calcIdX(lp.x,rp.x,xMod,w),this.calcIdY(tl.func(lp),tl.func(rp),bl.func(lp),bl.func(rp),yMod,h));
        cc.strokeText(tl.name,this.calcX((tl.left.x+tl.right.x)/2,xMod,w),this.calcY((tl.left.y+tl.right.y)/2,yMod,h));
        cc.strokeText(bl.name,this.calcX((bl.left.x+bl.right.x)/2,xMod,w),this.calcY((bl.left.y+bl.right.y)/2,yMod,h));
        cc.strokeText(tl.left.name,this.calcX(tl.left.x,xMod,w),this.calcY(tl.left.y,yMod,h))
        cc.strokeText(tl.right.name,this.calcX(tl.right.x,xMod,w),this.calcY(tl.right.y,yMod,h))
        cc.strokeText(bl.left.name,this.calcX(bl.left.x,xMod,w),this.calcY(bl.left.y,yMod,h))
        cc.strokeText(bl.right.name,this.calcX(bl.right.x,xMod,w),this.calcY(bl.right.y,yMod,h))
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

  drawDAG(canvasDAG:any,locateOrUpdate?:string){
    const maxDepth=this.dagService.getMaxDepth();
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
    let d:number=node.getDepth();
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
      this.drawNode(cc,n.leftChild,w,h,max,mergedNodes,drawWidth,drawHeight,-1,isLocationNode,locateOrUpdate,iN);
      this.drawNode(cc,n.rightChild,w,h,max,mergedNodes,drawWidth,drawHeight,1,isLocationNode,locateOrUpdate,iN);
    }
    if(n instanceof H_Node){
      let iN=wasUpdateTrapNode&&locateOrUpdate==="update"||isNew
      this.drawHNode(cc,n.point.name,drawWidth,drawHeight,isLocationNode&&locateOrUpdate==="locate",iN)
      this.drawNode(cc,n.leftChild,w,h,max,mergedNodes,drawWidth,drawHeight,-1,isLocationNode,locateOrUpdate,iN);
      this.drawNode(cc,n.rightChild,w,h,max,mergedNodes,drawWidth,drawHeight,1,isLocationNode,locateOrUpdate,iN);
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

  calcRealXY(canvas:any,canvX:number,canvY:number):number[]{
    const x=((canvX-20)*this.xSpan)/(canvas.width-40)+this.extremes.minX
    const y=((canvY-20)*this.ySpan)/(canvas.height-40)+this.extremes.minY
    return [x,y]
  }

  point(canvas:any,canvasDAG:any,x:number,y:number):H_Node|V_Node|Trapezoid|undefined{
    const canvX=this.calcX(x,canvas.width/this.xSpan)
    const canvY=this.calcY(y,canvas.height/this.ySpan)
    this.locationPoint=new Point(x,y,"q")
    const cc=canvas?.getContext("2d");
    cc.fillStyle="#000000"
    cc.fillRect(canvX,canvY,3,3);
    cc.strokeText(this.locationPoint.name,canvX+3,canvY)
    cc.fillStyle="#ffffff"
    let locTrap=this.dagService.locate(this.locationPoint).getInner()
    this.drawDAG(canvasDAG,"locate")
    return locTrap
  }
}
