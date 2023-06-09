import { Inject, Injectable } from '@angular/core';
import { Line } from '../models/Line.model';
import { Trapezoid } from '../models/Trapezoid.model';
import { Point } from '../models/Point.model';
import { DAGService } from './dag.service';
import { H_Node } from '../models/H_Node.model';
import { V_Node } from '../models/V_Node.model';
import { Node } from '../models/Node.model';
import { DRAWService } from './draw.service';

@Injectable({
  providedIn: 'root'
})
export class RICService {
  //private trapNodes:Node[]=[];
  private trapUpdate:{node:Node,mode:string,mergeTrap?:Node}[]=[];
  private counter:number=1;
  private trap?:Trapezoid;
  private stepCounter:number=0;

  constructor(private dagService:DAGService, private drawService:DRAWService) {
    //this.trapNodes[0]=dagService.locate(new Point(0,0))
  }

  reset(){
    this.drawService.updateExtremes();
    this.dagService.init();
    //this.trapNodes=[];
    //this.trapNodes[0]=this.dagService.locate(new Point(0,0))
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
    this.drawService.drawLine(line,canvas);
    return trap;
  }

  stepFwdUpdate(line:Line,canvas:any,canvasDAG:any,trap:Trapezoid){
    //this.trapNodes=this.trapNodes.filter(tNode => {return !this.trapUpdate.map((tU)=>tU.node).includes(tNode)})
    this.trapUpdate.forEach((tU,index) => {
      //delete this.trapNodes[(<any>tU.node.getInner()).id]
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
        tU.node.setInner(new H_Node(line.left))
        tU.node.leftChild=t1
        tU.node.rightChild=new Node(tUd+1,new H_Node(line.right),new Node(tUd+2,new V_Node(line),t2,t3),t4)
        /* tU.node.setInner(new H_Node(line.left,
          t1,
          new Node(tUd+1,new H_Node(line.right,
            new Node(tUd+2,new V_Node(line,
              t2,
              t3
            )),
            t4
          ))
        )) */
        //this.trapNodes.push(t1,t2,t3,t4);
        /* for(let t of [t1,t2,t3,t4]){
          this.trapNodes[(<any>t.getInner()).id]=t
        } */
      }
      else if(tU.mode==="left"){
        const trap:any=tU.node.getInner();
        const t1=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,line.left,trap.top,trap.bottom));
        const t2=new Node(tUd+2,new Trapezoid(this.counter++,line.left,trap.right,trap.top,line));
        const t3=new Node(tUd+2,new Trapezoid(this.counter++,line.left,trap.right,line,trap.bottom));
        const v=new Node(tUd+1,new V_Node(line),t2,t3);
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
        tU.node.setInner(new H_Node(line.left))
        tU.node.leftChild=t1;
        tU.node.rightChild=v
        //this.trapNodes.push(t1,t2,t3);
        /* for(let t of [t1,t2,t3]){
          this.trapNodes[(<any>t.getInner()).id]=t
        } */
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
        tU.node.setInner(new V_Node(line))
        tU.node.leftChild=t1;
        tU.node.rightChild=t2
        /* for(let t of [t1,t2]){
          if(!t.merged){
            //this.trapNodes.push(t);
            this.trapNodes[(<any>t.getInner()).id]=t
          }
        } */
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
        tU.node.setInner(new H_Node(line.right))
        tU.node.leftChild=new Node(tUd+1,new V_Node(line),t1,t2)
        tU.node.rightChild=t3
        /* tU.node.setInner(new H_Node(line.right,
          new Node(tUd+1,new V_Node(line,
            t1,
            t2
          )),
          t3
        )) */
        /* for(let t of [t1,t2,t3]){
          if(!t.merged){
            //this.trapNodes.push(t);
            this.trapNodes[(<any>t.getInner()).id]=t
          }
        } */
      }
    })
    //for(let t of this.trapNodes)console.log(t)
    this.drawRIC(canvas);
    this.drawDAG(canvasDAG,"update");
  }

  drawRIC(canvas:any){
    this.drawService.drawRIC(canvas)
  }

  drawDAG(canvasDAG:any,locateOrUpdate?:string){
    this.drawService.drawDAG(canvasDAG,locateOrUpdate,this.trapUpdate)
  }
}
