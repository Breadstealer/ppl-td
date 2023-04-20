import { Inject, Injectable } from '@angular/core';
import { Line } from '../models/line.model';
import { Trapezoid } from '../models/trapezoid.model';
import { Point } from '../models/point.model';
import { LinesService } from './lines.service';
import { DAGService } from './dag.service';
import { H_Node } from '../models/H-node.model';
import { V_Node } from '../models/V-Node.model';
import { Node } from '../models/node.model';
//import { RICLine } from '../models/ricLine.model';

@Injectable({
  providedIn: 'root'
})
export class RICService {
  private trapNodes:Node[]=[];
  private trapUpdate:{node:Node,mode:string,mergeTrap?:Node}[]=[];
  private extremes:any;
  private xSpan:number;
  private ySpan:number;
  //private ricLines:RICLine[]=[];
  private counter:number=1;

  constructor(private linesService:LinesService, private dagService:DAGService) {
    this.extremes=linesService.getExtremes();
    this.xSpan=this.extremes.maxX-this.extremes.minX;
    this.ySpan=this.extremes.maxY-this.extremes.minY;
    this.trapNodes.push(dagService.locate(new Point(this.xSpan,this.ySpan)))
  }

  reset(){
    this.dagService.init();
    this.trapNodes=[];
    this.trapNodes.push(this.dagService.locate(new Point(this.xSpan,this.ySpan)))
    this.counter=1;
  }

  stepBck(){
    this.reset();
  }

  stepFwd(line:Line,canvas:any,canvasDAG:any){
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
        tU.node.setNode(new H_Node(line.left,
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
        const trap:any=tU.node.getNode();
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
        let cond=true;
        tUn.right.forEach(rN =>{
          //if(rN.getNeighbors().left.length===1){
            if(line.func((<any>rN.getNode()).left)<(<any>rN.getNode()).left.y){
              /* if(!cond){
                rN.setNeighbors([t3],rN.getNeighbors().right);
              }
              if(cond){
                rN.setNeighbors([v],rN.getNeighbors().right);
                cond=!cond;
              } */
              rN.setNeighbors(rN.getNeighbors().left.length===1?[t3]:[t3,rN.getNeighbors().left[1]],rN.getNeighbors().right);
              this.trapUpdate[index+1]={...this.trapUpdate[index+1],mergeTrap:t2}
            }
            else{
              /* if(!cond){
                rN.setNeighbors([v],rN.getNeighbors().right);
              }
              if(cond){
                rN.setNeighbors([t2],rN.getNeighbors().right);
                cond=!cond;
              } */
              rN.setNeighbors(rN.getNeighbors().left.length===1?[t2]:[rN.getNeighbors().left[0],t2],rN.getNeighbors().right);
              this.trapUpdate[index+1]={...this.trapUpdate[index+1],mergeTrap:t3}
            }
          //}
        })
        tU.node.setNode(new H_Node(line.left,
          t1,
          v
        ))
        this.trapNodes.push(t1,t2,t3);
        
      }
      else if(tU.mode==="none"){
        const trap:any=tU.node.getNode();
        var tUn=tU.node.getNeighbors();
        var t1:Node|any;
        var t2:Node|any;
        if(line.func(trap.left)<trap.left.y){
          //let v=tUn.left[0].getNode();
          //if(v instanceof V_Node){
            //t1=v.leftChild;
            t1=tU.mergeTrap;
            t2=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,trap.right,line,trap.bottom));
            t1.setDepth(Math.max(t1.getDepth(),tUd+2));
            t1.merge(trap.right);
          //}
        }
        else{
          //let v=tUn.left[tUn.left.length-1].getNode();
          //if(v instanceof V_Node){
            t1=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,trap.right,trap.top,line));
            //t2=v.rightChild;
            t2=tU.mergeTrap;
            t2.setDepth(Math.max(t2.getDepth(),tUd+2));
            t2.merge(trap.right);
          //}
        }
        /* const t1=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,trap.right,trap.top,line));
        const t2=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,trap.right,line,trap.bottom)); */
        //const v=new Node(tUd,new V_Node(line,t1,t2));
        this.dagService.setMaxDepth(tUd+1);
        /* t1.setNeighbors(tU.node.getNeighbors().left,tU.node.getNeighbors().right);
        t2.setNeighbors(tU.node.getNeighbors().left,tU.node.getNeighbors().right); */
        //if(tUn.left.length===1){
          if(t1.merged){
            t1.setNeighbors(t1.getNeighbors().left,tUn.right);
            //t2.setNeighbors([(<any>tUn.left[0].getNode()).rightChild],tUn.right);
            t2.setNeighbors(tUn.left,tUn.right);
          }
          if(t2.merged){
            //t1.setNeighbors([(<any>tUn.left[0].getNode()).leftChild],tUn.right);
            t1.setNeighbors(tUn.left,tUn.right);
            t2.setNeighbors(t2.getNeighbors().left,tUn.right);
          }
          /* t1.setNeighbors([(<any>tUn.left[0].getNode()).leftChild],tUn.right);
          t2.setNeighbors([(<any>tUn.left[0].getNode()).rightChild],tUn.right); */
        /* }
        else{
          const uL=tUn.left[0].getNode();
          const lL=tUn.left[1].getNode();
          if(lL instanceof V_Node&&t2.merged){
            t1.setNeighbors([tUn.left[0],lL.leftChild],tUn.right);
            t2.setNeighbors(t2.getNeighbors().left,tUn.right);
          }
          else if(uL instanceof V_Node&&t1.merged){
            t1.setNeighbors(t1.getNeighbors().left,tUn.right);
            t2.setNeighbors([uL.rightChild,tUn.left[1]],tUn.right);
          }
        } */
        tUn.left.forEach(lN =>{
          /* if(tUn.left.length===1){
            const lNv=lN.getNode();
            if(lNv instanceof V_Node){ */
              /* if(lNv.line.func((<any>tU.node.getNode()).left)<(<any>tU.node.getNode()).left.y){
                lNv.leftChild.setNeighbors(lNv.leftChild.getNeighbors().left,[t1]);
                lNv.rightChild.setNeighbors(lNv.rightChild.getNeighbors().left,[t2,lNv.rightChild.getNeighbors().right[1]]);
              }
              else{
                lNv.leftChild.setNeighbors(lNv.leftChild.getNeighbors().left,[lNv.leftChild.getNeighbors().right[0],t1]);
                lNv.rightChild.setNeighbors(lNv.rightChild.getNeighbors().left,[t2]);
              } */
              if(t1.merged){
                lN.setNeighbors(lN.getNeighbors().left,tUn.left.length===1?[t2,lN.getNeighbors().right[1]]:[t2]);
              }
              if(t2.merged){
                lN.setNeighbors(lN.getNeighbors().left,tUn.left.length===1?[lN.getNeighbors().right[0],t1]:[t1]);
              }
            /* }
          }
          else{
            const lNt=lN.getNode();
            if(lNt instanceof Trapezoid){
              if(lNt.right.y>line.func(lNt.right)){
                lN.setNeighbors(lN.getNeighbors().left,[t2])
              }
              else{
                lN.setNeighbors(lN.getNeighbors().left,[t1])
              }
            }
            else if(lNt instanceof V_Node){
              if(t1.merged){
                lNt.rightChild.setNeighbors(lNt.rightChild.getNeighbors().left,[t2]);
              }
              if(t2.merged){
                lNt.leftChild.setNeighbors(lNt.leftChild.getNeighbors().left,[t1]);
              }
            }
          } */
        })
        let cond=true;
        tUn.right.forEach(rN =>{
          //if(rN.getNeighbors().left.length===1){
            if(line.func((<any>rN.getNode()).left)<(<any>rN.getNode()).left.y){
              /* if(!cond){
                rN.setNeighbors([t2],rN.getNeighbors().right);
              }
              if(cond){
                rN.setNeighbors([v],rN.getNeighbors().right);
                cond=!cond;
              } */
              rN.setNeighbors(rN.getNeighbors().left.length===1?[t2]:[t2,rN.getNeighbors().left[1]],rN.getNeighbors().right);
              this.trapUpdate[index+1]={...this.trapUpdate[index+1],mergeTrap:t1}
            }
            else{
              /* if(!cond){
                rN.setNeighbors([v],rN.getNeighbors().right);
              }
              if(cond){
                rN.setNeighbors([t1],rN.getNeighbors().right);
                cond=!cond;
              } */
              rN.setNeighbors(rN.getNeighbors().left.length===1?[t1]:[rN.getNeighbors().left[0],t1],rN.getNeighbors().right);
              this.trapUpdate[index+1]={...this.trapUpdate[index+1],mergeTrap:t2}
            }
          /* }
          else{
            console.log(rN.getNeighbors().left[0], node)
            const l=rN.getNeighbors().left[0]===tU.node?[v,rN.getNeighbors().left[1]]:[rN.getNeighbors().left[0],v]
            rN.setNeighbors(l,rN.getNeighbors().right)
          } */
        })
        //console.log(tU.node,v)
        //tU.node=v
        tU.node.setNode(new V_Node(line,
          t1,
          t2
        ))
        //this.trapNodes.push(t1,t2);
        for(let t of [t1,t2]){
          if(!t.merged){
            this.trapNodes.push(t);
          }
        }
      }
      else if(tU.mode==="right"){
        const trap:any=tU.node.getNode();
        var tUn=tU.node.getNeighbors();
        var t1:Node|any;
        var t2:Node|any;
        if(line.func(trap.left)<trap.left.y){
          //let v=tUn.left[0].getNode();
          //if(v instanceof V_Node){
            //t1=v.leftChild;
            t1=tU.mergeTrap;
            t2=new Node(tUd+2,new Trapezoid(this.counter++,trap.left,line.right,line,trap.bottom));
            t1.setDepth(Math.max(t1.getDepth(),tUd+2));
            t1.merge(line.right);
          //}
        }
        else{
          //let v=tUn.left[tUn.left.length-1].getNode();
          //if(v instanceof V_Node){
            t1=new Node(tUd+2,new Trapezoid(this.counter++,trap.left,line.right,trap.top,line));
            //t2=v.rightChild;
            t2=tU.mergeTrap;
            t2.setDepth(Math.max(t2.getDepth(),tUd+2));
            t2.merge(line.right);
          //}
        }
        /* const t1=new Node(tUd+2,new Trapezoid(this.counter++,trap.left,line.right,trap.top,line));
        const t2=new Node(tUd+2,new Trapezoid(this.counter++,trap.left,line.right,line,trap.bottom)); */
        const t3=new Node(tUd+1,new Trapezoid(this.counter++,line.right,trap.right,trap.top,trap.bottom));
        this.dagService.setMaxDepth(tUd+2);
        //if(tUn.left.length===1){
          if(t1.merged){
            t1.setNeighbors(t1.getNeighbors().left,[t3]);
            //t2.setNeighbors([(<any>tUn.left[0].getNode()).rightChild],[t3]);
            t2.setNeighbors(tUn.left,[t3]);
          }
          if(t2.merged){
            //t1.setNeighbors([(<any>tUn.left[0].getNode()).leftChild],[t3]);
            t1.setNeighbors(tUn.left,[t3]);
            t2.setNeighbors(t2.getNeighbors().left,[t3]);
          }
          /* t1.setNeighbors([(<any>tUn.left[0].getNode()).leftChild],[t3]);
          t2.setNeighbors([(<any>tUn.left[0].getNode()).rightChild],[t3]); */
        /* }
        else{
          const uL=tUn.left[0].getNode();
          const lL=tUn.left[1].getNode();
          if(lL instanceof V_Node&&t2.merged){
            t1.setNeighbors([tUn.left[0],lL.leftChild],[t3]);
            t2.setNeighbors(t2.getNeighbors().left,[t3]);
          }
          else if(uL instanceof V_Node&&t1.merged){
            t1.setNeighbors(t1.getNeighbors().left,[t3]);
            t2.setNeighbors([uL.rightChild,tUn.left[1]],[t3]);
          }
        } */
        t3.setNeighbors([t1,t2],tUn.right);
        tUn.left.forEach(lN => {
          //if(tUn.left.length===1){
            /* const lNv=lN.getNode();
            if(lNv instanceof V_Node){ */
              /* if(lNv.line.func((<any>tU.node.getNode()).left)<(<any>tU.node.getNode()).left.y){
                lNv.leftChild.setNeighbors(lNv.leftChild.getNeighbors().left,[t1]);
                lNv.rightChild.setNeighbors(lNv.rightChild.getNeighbors().left,[t2,lNv.rightChild.getNeighbors().right[1]]);
              }
              else{
                lNv.leftChild.setNeighbors(lNv.leftChild.getNeighbors().left,[lNv.leftChild.getNeighbors().right[0],t1]);
                lNv.rightChild.setNeighbors(lNv.rightChild.getNeighbors().left,[t2]);
              } */
              if(t1.merged){
                lN.setNeighbors(lN.getNeighbors().left,tUn.left.length===1?[t2,lN.getNeighbors().right[1]]:[t2]);
              }
              if(t2.merged){
                lN.setNeighbors(lN.getNeighbors().left,tUn.left.length===1?[lN.getNeighbors().right[0],t1]:[t1]);
              }
            //}
          /* }
          else{
            const lNt=lN.getNode();
            if(lNt instanceof Trapezoid){
              if(lNt.right.y>line.func(lNt.right)){
                lN.setNeighbors(lN.getNeighbors().left,[t2])
              }
              else{
                lN.setNeighbors(lN.getNeighbors().left,[t1])
              }
            }
            else if(lNt instanceof V_Node){
              if(t1.merged){
                lNt.rightChild.setNeighbors(lNt.rightChild.getNeighbors().left,[t2]);
              }
              if(t2.merged){
                lNt.leftChild.setNeighbors(lNt.leftChild.getNeighbors().left,[t1]);
              }
            }
          } */
        })
        tUn.right.forEach(rN => {
          const l=rN.getNeighbors().left[0]===tU.node?[t3,rN.getNeighbors().left[1]]:[rN.getNeighbors().left[0],t3]
          rN.setNeighbors(l,rN.getNeighbors().right);
        })
        tU.node.setNode(new H_Node(line.right,
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
        //this.trapNodes.push(t1,t2,t3);
      }
    })
    console.log(this.trapNodes)
    this.drawRIC(canvas);
    this.drawDAG(canvasDAG);
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
      const ll=line.left;
      const lr=line.right;
      cc.strokeText(line.name,this.calcX((ll.x+lr.x)/2,xMod,w),this.calcY((ll.y+lr.y)/2,yMod,h))
      cc.strokeText(ll.name,this.calcX(ll.x,xMod,w),this.calcY(ll.y,yMod,h))
      cc.strokeText(lr.name,this.calcX(lr.x,xMod,w),this.calcY(lr.y,yMod,h))
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

  drawDAG(canvasDAG:any){
    const maxDepth=this.dagService.getMaxDepth();
    const root=this.dagService.getRoot();
    const h=canvasDAG.height;
    const w=canvasDAG.width;
    const cc=canvasDAG?.getContext("2d");
    cc.clearRect(0,0,w,h);
    cc.strokeRect(0,0,w,h);
    this.drawNode(cc,root,w,h,maxDepth)
  }

  drawNode(cc:any,node:Node,w:number,h:number,max:number,parentw?:number,parenth?:number,leftOrRight?:number){
    let d:number=node.getDepth();
    const drawHeight:number=h*d/(max+1);
    let drawWidth:number=w/(2**d)
    if(parentw&&parenth&&leftOrRight) {
      drawWidth=parentw+leftOrRight*w/(2**(d));
      this.drawArrow(cc,parentw,parenth+3,drawWidth,drawHeight-10)
    }
    const n=node.getNode()
    
    if(n instanceof Trapezoid){
      this.drawTrap(cc,n.id,drawWidth,drawHeight)
    }
    if(n instanceof V_Node){
      this.drawVNode(cc,n.line.name,drawWidth,drawHeight)
      if(n.leftChild.merged){
        
        this.drawNode(cc,n.rightChild,w,h,max,drawWidth,drawHeight,1);
      }
      this.drawNode(cc,n.leftChild,w,h,max,drawWidth,drawHeight,-1);
      this.drawNode(cc,n.rightChild,w,h,max,drawWidth,drawHeight,1);
    }
    if(n instanceof H_Node){
      this.drawHNode(cc,n.point.name,drawWidth,drawHeight)
      this.drawNode(cc,n.leftChild,w,h,max,drawWidth,drawHeight,-1);
      this.drawNode(cc,n.rightChild,w,h,max,drawWidth,drawHeight,1);
    }
  }

  drawTrap(cc:any,id:number,w:number,h:number){
    cc.strokeText(id,w,h)
  }

  drawVNode(cc:any,name:string,w:number,h:number){
    cc.strokeText(name,w,h)
  }

  drawHNode(cc:any,name:string,w:number,h:number){
    cc.strokeText(name,w,h)
  }

  drawArrow(cc:any,fromx:number,fromy:number,tox:number,toy:number){ // https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
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
  }
}
