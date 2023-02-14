import { Inject, Injectable } from '@angular/core';
import { Line } from '../models/line.model';
import { Trapezoid } from '../models/trapezoid.model';
import { Point } from '../models/point.model';
import { LinesService } from './lines.service';
import { DAGService } from './dag.service';
import { H_Node } from '../models/H-node.model';
import { V_Node } from '../models/V-Node.model';
import { Node } from '../models/node.model';
import { RICLine } from '../models/ricLine.model';

@Injectable({
  providedIn: 'root'
})
export class RICService {
  private trapNodes:Node[]=[];
  private trapUpdate:{node:Node,mode:string}[]=[];
  private extremes:any;
  private xSpan:number;
  private ySpan:number;
  private ricLines:RICLine[]=[];
  private counter:number=1;

  constructor(private linesService:LinesService, private dagService:DAGService) {
    this.extremes=linesService.getExtremes();
    this.xSpan=this.extremes.maxX-this.extremes.minX;
    this.ySpan=this.extremes.maxY-this.extremes.minY;
    this.trapNodes.push(dagService.locate(new Point(this.xSpan,this.ySpan)))
  }

  stepBck(canvas:any){
    this.ricLines.pop();
    this.drawRIC(canvas);
  }

  stepFwd(line:Line,canvas:any){
    this.trapUpdate=[];
    var node=this.dagService.locate(line.left);
    var trap:any=node.getNode();
    this.trapNodes=this.trapNodes.filter(tNode => {return tNode !== node});
    if(line.right.x<trap.right.x){
      this.trapUpdate.push({node:node,mode:"both"});
    }
    else{
      this.trapUpdate.push({node:node,mode:"left"});
      console.log(line.func(trap.right),trap.right.y);
      
      if(trap.rightNeighbors.length==1||line.func(trap.right)<trap.right.y){ //kleiner, da y von oben!!
        node=trap.rightNeighbors[0];
      }
      else{node=trap.rightNeighbors[1]}
      trap=node.getNode();
      while(line.right.x>trap.right.x){
        this.trapNodes=this.trapNodes.filter(tNode => {return tNode !== node});
        this.trapUpdate.push({node:node,mode:"none"});
        if(trap.rightNeighbors.length==1||line.func(trap.right)<trap.right.y){ //kleiner, da y von oben!!
          node=trap.rightNeighbors[0];
        }
        else{node=trap.rightNeighbors[1]}
        trap=node.getNode();
      }
      this.trapNodes=this.trapNodes.filter(tNode => {return tNode !== node});
      this.trapUpdate.push({node:node,mode:"right"});
    }
    this.trapUpdate.forEach(tU => {
      if(tU.mode==="both"){
        const t1=new Node(new Trapezoid(this.counter++,trap.left,line.left,trap.top,trap.bottom));
        const t2=new Node(new Trapezoid(this.counter++,line.left,line.right,trap.top,line));
        const t3=new Node(new Trapezoid(this.counter++,line.left,line.right,line,trap.bottom));
        const t4=new Node(new Trapezoid(this.counter++,line.right,trap.right,trap.top,trap.bottom));
        var tUn=tU.node.getNeighbors();
        t1.setNeighbors(tUn.left,[t2,t3]);
        t2.setNeighbors([t1],[t4]);
        t3.setNeighbors([t1],[t4]);
        t4.setNeighbors([t2,t3],tUn.right);
        tUn.left.forEach(lN => {
          const r=lN.getNeighbors().right[0]===t1?[t1,lN.getNeighbors().right[1]]:[lN.getNeighbors().right[0],t1]
          lN.setNeighbors(lN.getNeighbors().left,r);
        })
        tUn.right.forEach(rN => {
          const l=rN.getNeighbors().left[0]===t4?[t4,rN.getNeighbors().left[1]]:[rN.getNeighbors().left[0],t4]
          rN.setNeighbors(l,rN.getNeighbors().right);
        })
        tU.node.setNode(new H_Node(line.left.x,
          t1,
          new Node(new H_Node(line.right.x,
            new Node(new V_Node(line,
              t2,
              t3
            )),
            t4
          ))
        ))
        this.trapNodes.push(t1,t2,t3,t4);
        
      }
      else if(tU.mode==="left"){
        const trap:any=tU.node.getNode();
        const t1=new Node(new Trapezoid(this.counter++,trap.left,line.left,trap.top,trap.bottom));
        const t2=new Node(new Trapezoid(this.counter++,line.left,trap.right,trap.top,line));
        const t3=new Node(new Trapezoid(this.counter++,line.left,trap.right,line,trap.bottom));
        const v=new Node(new V_Node(line,t2,t3));
        var tUn=tU.node.getNeighbors();
        t1.setNeighbors(tUn.left,[t2,t3]);
        t2.setNeighbors([t1],tUn.right);
        t3.setNeighbors([t1],tUn.right);
        tUn.left.forEach(lN => {
          const r=lN.getNeighbors().right[0]===t1?[t1,lN.getNeighbors().right[1]]:[lN.getNeighbors().right[0],t1]
          lN.setNeighbors(lN.getNeighbors().left,r);
        })
        let cond=true;
        tUn.right.forEach(rN =>{
          if(rN.getNeighbors().left.length===1){
            if(line.func((<any>rN.getNode()).left)<(<any>rN.getNode()).left.y){
              if(!cond){
                rN.setNeighbors([t3],rN.getNeighbors().right);
              }
              if(cond){
                rN.setNeighbors([v],rN.getNeighbors().right);
                cond=!cond;
              }
            }
            else{
              if(!cond){
                rN.setNeighbors([v],rN.getNeighbors().right);
              }
              if(cond){
                rN.setNeighbors([t2],rN.getNeighbors().right);
                cond=!cond;
              }
            }
          }
          else{
            const l=rN.getNeighbors().left[0]===node?[v,rN.getNeighbors().left[1]]:[rN.getNeighbors().left[0],v]
            rN.setNeighbors(l,rN.getNeighbors().right)
          }
        })
        tU.node.setNode(new H_Node(line.left.x,
          t1,
          v
        ))
        this.trapNodes.push(t1,t2,t3);
        
      }
      else if(tU.mode==="none"){
        const trap:any=tU.node.getNode();
        const t1=new Node(new Trapezoid(this.counter++,trap.left,trap.right,trap.top,line));
        const t2=new Node(new Trapezoid(this.counter++,trap.left,trap.right,line,trap.bottom));
        t1.setNeighbors(tU.node.getNeighbors().left,tU.node.getNeighbors().right);
        t2.setNeighbors(tU.node.getNeighbors().left,tU.node.getNeighbors().right);
        tU.node.setNode(new V_Node(line,
          t1,
          t2
        ))
        this.trapNodes.push(t1,t2);
      }
      else if(tU.mode==="right"){
        const trap:any=tU.node.getNode();
        const t1=new Node(new Trapezoid(this.counter++,trap.left,line.right,trap.top,line));
        const t2=new Node(new Trapezoid(this.counter++,trap.left,line.right,line,trap.bottom));
        const t3=new Node(new Trapezoid(this.counter++,line.right,trap.right,trap.top,trap.bottom));
        var tUn=tU.node.getNeighbors();
        if(tUn.left.length===1){
          t1.setNeighbors([(<any>tUn.left[0].getNode()).leftChild],[t3]);
          t2.setNeighbors([(<any>tUn.left[0].getNode()).rightChild],[t3]);
        }
        else{
          const uL=tUn.left[0].getNode();
          const lL=tUn.left[1].getNode();
          if(lL instanceof V_Node){
            t1.setNeighbors([tUn.left[0],lL.leftChild],[t3]);
            t2.setNeighbors([lL.rightChild],[t3]);
          }
          else if(uL instanceof V_Node){
            t1.setNeighbors([uL.leftChild],[t3]);
            t2.setNeighbors([uL.rightChild,tUn.left[1]],[t3]);
          }
        }
        t3.setNeighbors([t1,t2],tUn.right);
        tUn.left.forEach(lN =>{
          if(tUn.left.length===1){
            const lNv=lN.getNode();
            if(lNv instanceof V_Node){
              if(lNv.line.func((<any>tU.node.getNode()).left)<(<any>tU.node.getNode()).left.y){
                lNv.leftChild.setNeighbors(lNv.leftChild.getNeighbors().left,[t1]);
                lNv.rightChild.setNeighbors(lNv.rightChild.getNeighbors().left,[t2,lNv.rightChild.getNeighbors().right[1]]);
              }
              else{
                lNv.leftChild.setNeighbors(lNv.leftChild.getNeighbors().left,[lNv.leftChild.getNeighbors().right[0],t1]);
                lNv.rightChild.setNeighbors(lNv.rightChild.getNeighbors().left,[t2]);
              }
            }
          }
          else{
            const lNt=lN.getNode();
            if(lNt instanceof Trapezoid){
              if(lNt.right.y>line.func(lNt.right)){
                lN.setNeighbors(lN.getNeighbors().left,[t1])
              }
              else{
                lN.setNeighbors(lN.getNeighbors().left,[t2])
              }
            }
            else if(lNt instanceof V_Node){
              lNt.leftChild.setNeighbors(lNt.leftChild.getNeighbors().left,[t1]);
              lNt.rightChild.setNeighbors(lNt.rightChild.getNeighbors().left,[t2]);
            }
          }
        })
        tUn.right.forEach(rN => {
          const l=rN.getNeighbors().left[0]===tU.node?[t3,rN.getNeighbors().left[1]]:[rN.getNeighbors().left[0],t3]
          rN.setNeighbors(l,rN.getNeighbors().right);
        })
        tU.node.setNode(new H_Node(line.right.x,
          new Node(new V_Node(line,
            t1,
            t2
          )),
          t3
        ))
        this.trapNodes.push(t1,t2,t3);
      }
    })
    console.log(this.trapNodes)
    this.drawRIC(canvas);
  }

  drawLines(canvas:any){
    const h=canvas.height;
    const w=canvas.width;
    const xMod=w/this.xSpan;
    const yMod=h/this.ySpan;
    const cc=canvas?.getContext("2d");
    cc.clearRect(0,0,w,h);
    cc.strokeRect(0,0,w,h);
    this.linesService.getLines().forEach(line => {
      cc.beginPath();
      cc.moveTo(this.calcX(line.left.x,xMod),this.calcY(line.left.y,yMod));
      cc.lineTo(this.calcX(line.right.x,xMod),this.calcY(line.right.y,yMod));
      cc.closePath();
      cc.stroke();
    });
  }

  drawRIC(canvas:any){
    const h=canvas.height;
    const w=canvas.width;
    const xMod=w/this.xSpan;
    const yMod=h/this.ySpan;
    const cc=canvas?.getContext("2d");
    cc.clearRect(0,0,w,h);
    cc.strokeRect(0,0,w,h);
    this.trapNodes.forEach(node =>{
      const trap = node.getNode();
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
}
