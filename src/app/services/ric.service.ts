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
  private trapUpdate:{node:Node,mode:string,mergeTrap?:Node}[]=[];
  private counter:number=1;
  private stepCounter:number=0;

  constructor(private dagService:DAGService, private drawService:DRAWService) {}

  reset(){
    this.drawService.updateExtremes();
    this.dagService.init();
    this.counter=1;
    this.stepCounter=0;
  }

  stepBck(){
    this.reset();
  }

  stepFwd(line:Line,canvas:any,canvasDAG:any,draw?:boolean):number{
    if(this.stepCounter%2==0){
      this.stepFwdLocate(line,canvas,canvasDAG,draw);
      this.stepCounter++;
      return 0;
    } 
    else{
      this.stepFwdUpdate(line,canvas,canvasDAG,draw);
      this.stepCounter++;
      return 1;
    }
  }

  stepFwdLocate(line:Line,canvas:any,canvasDAG:any,draw?:boolean){
    this.trapUpdate=[];
    let node=this.dagService.locate(line.left);
    let trap:any=node.getInner();
    if(trap instanceof H_Node){
      let p=new Point(line.left.x+0.5,0)
      p.y=line.func(p)
      node=this.dagService.locate(p)
      trap=node.getInner();
      if(line.right.x===trap.right.x){
        this.trapUpdate.push({node:node,mode:"bothHit"})
      } else {
        if(line.right.x<trap.right.x){
          this.trapUpdate.push({node:node,mode:"leftHitAndRight"})
        } else {
          this.trapUpdate.push({node:node,mode:"leftHit"})
          if(trap.rightNeighbors.length==1||line.func(trap.right)<trap.right.y){ //smaller, y measured from top!
            node=trap.rightNeighbors[0];
          }else{
            node=trap.rightNeighbors[1]
          }
          trap=node.getInner();
          while(line.right.x>trap.right.x){
            this.trapUpdate.push({node:node,mode:"none"});
            if(trap.rightNeighbors.length==1||line.func(trap.right)<trap.right.y){ //smaller, y measured from top!
              node=trap.rightNeighbors[0];
            }
            else{node=trap.rightNeighbors[1]}
            trap=node.getInner();
          }
          if(line.right.x===trap.right.x){
            this.trapUpdate.push({node:node,mode:"rightHit"})
          }else{
            this.trapUpdate.push({node:node,mode:"right"});
          }
        }
      }
    }
    else{
      if(line.right.x<trap.right.x){
        this.trapUpdate.push({node:node,mode:"both"});
      }else if(line.right.x===trap.right.x){
        this.trapUpdate.push({node:node,mode:"leftAndRightHit"})
      }else{
        this.trapUpdate.push({node:node,mode:"left"});
        if(trap.rightNeighbors.length==1||line.func(trap.right)<trap.right.y){ //smaller, y measured from top!
          node=trap.rightNeighbors[0];
        }
        else{
          node=trap.rightNeighbors[1]
        }
        trap=node.getInner();
        while(line.right.x>trap.right.x){
          this.trapUpdate.push({node:node,mode:"none"});
          if(trap.rightNeighbors.length==1||line.func(trap.right)<trap.right.y){ //smaller, y measured from top!
            node=trap.rightNeighbors[0];
          }
          else{node=trap.rightNeighbors[1]}
          trap=node.getInner();
        }
        if(line.right.x===trap.right.x){
          this.trapUpdate.push({node:node,mode:"rightHit"})
        }else{
          this.trapUpdate.push({node:node,mode:"right"});
        }
      }
    }
    if(draw===undefined || draw===true){
      this.drawDAG(canvasDAG,"locate");
      this.drawRIC(canvas);
      this.drawService.drawLine(line,canvas);
    }
  }

  stepFwdUpdate(line:Line,canvas:any,canvasDAG:any,draw?:boolean){
    this.trapUpdate.forEach((tU,index) => {
      const tUd=tU.node.getDepth();
      const trap=tU.node.getInner() as Trapezoid;
      const tUn=tU.node.getNeighbors();
      if(tU.mode==="both"){
        const t1=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,line.left,trap.top,trap.bottom));
        const t2=new Node(tUd+3,new Trapezoid(this.counter++,line.left,line.right,trap.top,line));
        const t3=new Node(tUd+3,new Trapezoid(this.counter++,line.left,line.right,line,trap.bottom));
        const t4=new Node(tUd+2,new Trapezoid(this.counter++,line.right,trap.right,trap.top,trap.bottom));
        this.dagService.setMaxDepth(tUd+3);
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
      }
      else if(tU.mode==="left"){
        const t1=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,line.left,trap.top,trap.bottom));
        const t2=new Node(tUd+2,new Trapezoid(this.counter++,line.left,trap.right,trap.top,line));
        const t3=new Node(tUd+2,new Trapezoid(this.counter++,line.left,trap.right,line,trap.bottom));
        this.dagService.setMaxDepth(tUd+2);
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
        tU.node.rightChild=new Node(tUd+1,new V_Node(line),t2,t3);
      }
      else if(tU.mode==="none"){
        let t2:Node|any;
        let t3:Node|any;
        if(line.func(trap.left)<trap.left.y){
          t2=tU.mergeTrap;
          t3=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,trap.right,line,trap.bottom));
          t2.setDepth(Math.max(t2.getDepth(),tUd+1));
          t2.merge(trap.right);
        }
        else{
          t2=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,trap.right,trap.top,line));
          t3=tU.mergeTrap;
          t3.setDepth(Math.max(t3.getDepth(),tUd+1));
          t3.merge(trap.right);
        }
        this.dagService.setMaxDepth(tUd+1);
        if(t2.merged){
          t2.setNeighbors(t2.getNeighbors().left,tUn.right);
          t3.setNeighbors(tUn.left,tUn.right);
        }
        if(t3.merged){
          t2.setNeighbors(tUn.left,tUn.right);
          t3.setNeighbors(t3.getNeighbors().left,tUn.right);
        }
        tUn.left.forEach(lN =>{
          if(t2.merged){
            lN.setNeighbors(lN.getNeighbors().left,tUn.left.length===1?[t3,lN.getNeighbors().right[1]]:[t3]);
          }
          if(t3.merged){
            lN.setNeighbors(lN.getNeighbors().left,tUn.left.length===1?[lN.getNeighbors().right[0],t2]:[t2]);
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
        tU.node.setInner(new V_Node(line))
        tU.node.leftChild=t2;
        tU.node.rightChild=t3;
      }
      else if(tU.mode==="right"){
        let t2:Node|any;
        let t3:Node|any;
        if(line.func(trap.left)<trap.left.y){
          t2=tU.mergeTrap;
          t3=new Node(tUd+2,new Trapezoid(this.counter++,trap.left,line.right,line,trap.bottom));
          t2.setDepth(Math.max(t2.getDepth(),tUd+2));
          t2.merge(line.right);
        }
        else{
          t2=new Node(tUd+2,new Trapezoid(this.counter++,trap.left,line.right,trap.top,line));
          t3=tU.mergeTrap;
          t3.setDepth(Math.max(t3.getDepth(),tUd+2));
          t3.merge(line.right);
        }
        const t4=new Node(tUd+1,new Trapezoid(this.counter++,line.right,trap.right,trap.top,trap.bottom));
        this.dagService.setMaxDepth(tUd+2);
        if(t2.merged){
          t2.setNeighbors(t2.getNeighbors().left,[t4]);
          t3.setNeighbors(tUn.left,[t4]);
        }
        if(t3.merged){
          t2.setNeighbors(tUn.left,[t4]);
          t3.setNeighbors(t3.getNeighbors().left,[t4]);
        }
        t4.setNeighbors([t2,t3],tUn.right);
        tUn.left.forEach(lN => {
          if(t2.merged){
            lN.setNeighbors(lN.getNeighbors().left,tUn.left.length===1?[t3,lN.getNeighbors().right[1]]:[t3]);
          }
          if(t3.merged){
            lN.setNeighbors(lN.getNeighbors().left,tUn.left.length===1?[lN.getNeighbors().right[0],t2]:[t2]);
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
        tU.node.setInner(new H_Node(line.right))
        tU.node.leftChild=new Node(tUd+1,new V_Node(line),t2,t3)
        tU.node.rightChild=t4
      }
      else if(tU.mode==="bothHit"){
        let t2=new Node(tUd+1,new Trapezoid(this.counter++,line.left,line.right,trap.top,line))
        let t3=new Node(tUd+1,new Trapezoid(this.counter++,line.left,line.right,line,trap.bottom))
        this.dagService.setMaxDepth(tUd+1);
        if(tUn.left.length===2){
          t2.setLeftNeighbors([tUn.left[0]])
          t3.setLeftNeighbors([tUn.left[1]])
        }else if(tUn.left.length===1){
          if(trap.bottom.left.isEqual(line.left.x,line.left.y)){
            t2.setLeftNeighbors([tUn.left[0]])
            this.dagService.entryNodes.push(t3)
          }else{
            t3.setLeftNeighbors([tUn.left[0]])
            this.dagService.entryNodes.push(t2)
          }
        }
        if(tUn.right.length===2){
          t2.setRightNeighbors([tUn.right[0]])
          t3.setRightNeighbors([tUn.right[1]])
        }else if(tUn.right.length===1){
          if(trap.bottom.right.isEqual(line.right.x,line.right.y)){
            t2.setRightNeighbors([tUn.right[0]])
          }else{ 
            t3.setRightNeighbors([tUn.right[0]])
          }
        }
        let i=2;
        tUn.left.forEach(lN=>{
          if(lN.getNeighbors().right.length===1){
            if(tUn.left.length===1&&trap.top.left.isEqual(line.left.x,line.left.y))i++
            lN.setRightNeighbors([eval("t"+i++)])
          } else {
            if(trap.bottom.left.isEqual(line.left.x,line.left.y)){
              lN.setRightNeighbors([t2,lN.getNeighbors().right[1]])
            }else{
              lN.setRightNeighbors([lN.getNeighbors().right[0],t3])
            }
          }
        })
        i=2
        tUn.right.forEach(rN=>{
          if(rN.getNeighbors().left.length===1){
            if(tUn.right.length===1&&trap.top.right.isEqual(line.right.x,line.right.y))i++
            rN.setLeftNeighbors([eval("t"+i++)])
          } else {
            if(trap.bottom.right.isEqual(line.right.x,line.right.y)){
              rN.setLeftNeighbors([t2,rN.getNeighbors().left[1]])
            }else{
              rN.setLeftNeighbors([rN.getNeighbors().left[0],t3])
            }
          }
        })
        tU.node.setInner(new V_Node(line))
        tU.node.leftChild=t2
        tU.node.rightChild=t3
      }
      else if(tU.mode==="leftHitAndRight"){
        let t2=new Node(tUd+2,new Trapezoid(this.counter++,line.left,line.right,trap.top,line))
        let t3=new Node(tUd+2,new Trapezoid(this.counter++,line.left,line.right,line,trap.bottom))
        let t4=new Node(tUd+1,new Trapezoid(this.counter++,line.right,trap.right,trap.top,trap.bottom))
        this.dagService.setMaxDepth(tUd+2);
        if(tUn.left.length===2){
          t2.setLeftNeighbors([tUn.left[0]])
          t3.setLeftNeighbors([tUn.left[1]])
        }else if(tUn.left.length===1){
          if(trap.bottom.left.isEqual(line.left.x,line.left.y)){
            t2.setLeftNeighbors([tUn.left[0]])
            this.dagService.entryNodes.push(t3)
          }else{
            t3.setLeftNeighbors([tUn.left[0]])
            this.dagService.entryNodes.push(t2)
          }
        }
        t2.setRightNeighbors([t4])
        t3.setRightNeighbors([t4])
        t4.setNeighbors([t2,t3],tUn.right)
        let i=2;
        tUn.left.forEach(lN=>{
          if(lN.getNeighbors().right.length===1){
            if(tUn.left.length===1&&trap.top.left.isEqual(line.left.x,line.left.y))i++
            lN.setRightNeighbors([eval("t"+i++)])
          } else {
            if(trap.bottom.left.isEqual(line.left.x,line.left.y)){
              lN.setRightNeighbors([t2,lN.getNeighbors().right[1]])
            }else{
              lN.setRightNeighbors([lN.getNeighbors().right[0],t3])
            }
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
        tU.node.setInner(new H_Node(line.right))
        tU.node.leftChild=new Node(tUd+1,new V_Node(line),t2,t3)
        tU.node.rightChild=t4
      }
      else if(tU.mode==="leftHit"){
        let t2=new Node(tUd+1,new Trapezoid(this.counter++,line.left,trap.right,trap.top,line))
        let t3=new Node(tUd+1,new Trapezoid(this.counter++,line.left,trap.right,line,trap.bottom))
        this.dagService.setMaxDepth(tUd+1);
        if(tUn.left.length===2){
          t2.setLeftNeighbors([tUn.left[0]])
          t3.setLeftNeighbors([tUn.left[1]])
        }else if(tUn.left.length===1){
          if(trap.bottom.left.isEqual(line.left.x,line.left.y)){
            t2.setLeftNeighbors([tUn.left[0]])
            this.dagService.entryNodes.push(t3)
          }else{
            t3.setLeftNeighbors([tUn.left[0]])
            this.dagService.entryNodes.push(t2)
          }
        }
        t2.setRightNeighbors(tUn.right)
        t3.setRightNeighbors(tUn.right)
        let i=2;
        tUn.left.forEach(lN=>{
          if(lN.getNeighbors().right.length===1){
            if(tUn.left.length===1&&trap.top.left.isEqual(line.left.x,line.left.y))i++
            lN.setRightNeighbors([eval("t"+i++)])
          } else {
            if(trap.bottom.left.isEqual(line.left.x,line.left.y)){
              lN.setRightNeighbors([t2,lN.getNeighbors().right[1]])
            }else{
              lN.setRightNeighbors([lN.getNeighbors().right[0],t3])
            }
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
        tU.node.setInner(new V_Node(line))
        tU.node.leftChild=t2
        tU.node.rightChild=t3
      }
      else if(tU.mode==="rightHit"){
        let t2:Node|any;
        let t3:Node|any;
        if(line.func(trap.left)<trap.left.y){
          t2=tU.mergeTrap;
          t3=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,line.right,line,trap.bottom));
          t2.setDepth(Math.max(t2.getDepth(),tUd+1));
          t2.merge(line.right);
        }
        else{
          t2=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,line.right,trap.top,line));
          t3=tU.mergeTrap;
          t3.setDepth(Math.max(t3.getDepth(),tUd+1));
          t3.merge(line.right);
        }
        if(t2.merged){
          t2.setLeftNeighbors(t2.getNeighbors().left);
          t3.setLeftNeighbors(tUn.left);
        }
        if(t3.merged){
          t2.setLeftNeighbors(tUn.left);
          t3.setLeftNeighbors(t3.getNeighbors().left);
        }
        if(tUn.right.length===2){
          t2.setRightNeighbors([tUn.right[0]])
          t3.setRightNeighbors([tUn.right[1]])
        }else if(tUn.right.length===1){
          if(trap.bottom.right.isEqual(line.right.x,line.right.y)){
            t2.setRightNeighbors([tUn.right[0]])
          }else{ 
            t3.setRightNeighbors([tUn.right[0]])
          }
        }
        tUn.left.forEach(lN => {
          if(t2.merged){
            lN.setRightNeighbors(lN.getNeighbors().right.length!==1?[t3,lN.getNeighbors().right[1]]:[t3]);
          }
          if(t3.merged){
            lN.setRightNeighbors(lN.getNeighbors().right.length!==1?[lN.getNeighbors().right[0],t2]:[t2]);
          }
        })
        let i=2
        tUn.right.forEach(rN=>{
          if(rN.getNeighbors().left.length===1){
            if(tUn.right.length===1&&trap.top.right.isEqual(line.right.x,line.right.y))i++
            rN.setLeftNeighbors([eval("t"+i++)])
          } else {
            if(trap.bottom.right.isEqual(line.right.x,line.right.y)){
              rN.setLeftNeighbors([t2,rN.getNeighbors().left[1]])
            }else{
              rN.setLeftNeighbors([rN.getNeighbors().left[0],t3])
            }
          }
        })
        tU.node.setInner(new V_Node(line))
        tU.node.leftChild=t2
        tU.node.rightChild=t3
      }
      else if(tU.mode==="leftAndRightHit"){
        let t1=new Node(tUd+1,new Trapezoid(this.counter++,trap.left,line.left,trap.top,trap.bottom))
        let t2=new Node(tUd+2,new Trapezoid(this.counter++,line.left,line.right,trap.top,line))
        let t3=new Node(tUd+2,new Trapezoid(this.counter++,line.left,line.right,line,trap.bottom))
        this.dagService.setMaxDepth(tUd+2);
        t1.setNeighbors(tUn.left,[t2,t3]);
        t2.setLeftNeighbors([t1])
        t3.setLeftNeighbors([t1])
        if(tUn.right.length===2){
          t2.setRightNeighbors([tUn.right[0]])
          t3.setRightNeighbors([tUn.right[1]])
        }else if(tUn.right.length===1){
          if(trap.bottom.right.isEqual(line.right.x,line.right.y)){
            t2.setRightNeighbors([tUn.right[0]])
          }else{ 
            t3.setRightNeighbors([tUn.right[0]])
          }
        }
        tUn.left.forEach(lN => {
          if(lN.getNeighbors().right.length===1){
            lN.setNeighbors(lN.getNeighbors().left,[t1]);
          }
          else{
            const r=lN.getNeighbors().right[0]===tU.node?[t1,lN.getNeighbors().right[1]]:[lN.getNeighbors().right[0],t1]
            lN.setNeighbors(lN.getNeighbors().left,r);
          }
        })
        let i=2
        tUn.right.forEach(rN=>{
          if(rN.getNeighbors().left.length===1){
            if(tUn.right.length===1&&trap.top.right.isEqual(line.right.x,line.right.y))i++
            rN.setLeftNeighbors([eval("t"+i++)])
          } else {
            if(trap.bottom.right.isEqual(line.right.x,line.right.y)){
              rN.setLeftNeighbors([t2,rN.getNeighbors().left[1]])
            }else{
              rN.setLeftNeighbors([rN.getNeighbors().left[0],t3])
            }
          }
        })
        tU.node.setInner(new H_Node(line.left))
        tU.node.leftChild=t1;
        tU.node.rightChild=new Node(tUd+1,new V_Node(line),t2,t3);
      }
    })
    if(draw===undefined || draw===true){
      this.drawDAG(canvasDAG,"update");
      this.drawRIC(canvas);
    }
  }

  drawRIC(canvas:any){
    this.drawService.drawRIC(canvas)
  }

  drawDAG(canvasDAG:any,locateOrUpdate?:string){
    this.drawService.drawDAG(canvasDAG,locateOrUpdate,this.trapUpdate)
  }

  longestLegalSearchPath(node:Node,interval:{min:number|undefined,max:number|undefined},i:number):number{
    const inner=node.getInner()
    if(inner instanceof V_Node){
      let n1=this.longestLegalSearchPath(node.leftChild!,interval,i+1);
      let n2=this.longestLegalSearchPath(node.rightChild!,interval,i+1);
      return Math.max(n1,n2);
    } else if(inner instanceof H_Node){
      if(interval.min && inner.point.x<interval.min){
        return this.longestLegalSearchPath(node.rightChild!,interval,i+1);
      }
      if(interval.max && inner.point.x>interval.max){
        return this.longestLegalSearchPath(node.leftChild!,interval,i+1);
      }
      if((!interval.min || inner.point.x>interval.min) && (!interval.max || inner.point.x<interval.max)){
        let n1=this.longestLegalSearchPath(node.leftChild!,{min:interval.min,max:inner.point.x},i+1);
        let n2=this.longestLegalSearchPath(node.rightChild!,{min:inner.point.x,max:interval.max},i+1);
        return Math.max(n1,n2);
      }
    } else if(inner instanceof Trapezoid){
      return i
    }
    return -1;
  }
}
