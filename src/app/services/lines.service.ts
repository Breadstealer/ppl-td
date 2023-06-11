import { Injectable } from '@angular/core';
import { Line } from '../models/Line.model';
import { Point } from '../models/Point.model';

@Injectable({
  providedIn: 'root'
})
export class LinesService {
  private lines:Line[] | undefined
  private extremes:{minX:number,maxX:number,minY:number,maxY:number} | undefined;
  private nameNumber:number=0;

  private reset=[
    {p1x:50,p1y:250,p2x:300,p2y:50},
    {p1x:200,p1y:300,p2x:500,p2y:250},
    {p1x:350,p1y:375,p2x:475,p2y:275},
    {p1x:375,p1y:375,p2x:425,p2y:350},
    {p1x:100,p1y:300,p2x:450,p2y:500},
  ]

  //worstcaseDepthLowerBoundLocationPath
  private locateWorstCaseLowerBound=[
    {p1x:10,p1y:320,p2x:30,p2y:320}
  ]

  constructor() {
    for(let i=0;i<4;i++){
      let j=this.locateWorstCaseLowerBound.length
      let moveX=this.locateWorstCaseLowerBound[j-1].p2x-this.locateWorstCaseLowerBound[0].p1x-5
      let moveY=10*j
      this.locateWorstCaseLowerBound=this.locateWorstCaseLowerBound
      .concat(this.locateWorstCaseLowerBound
        .map(e=> {return {p1x:e.p1x+moveX,p1y:e.p1y-moveY,p2x:e.p2x+moveX,p2y:e.p2y-moveY}}))
      this.locateWorstCaseLowerBound=this.locateWorstCaseLowerBound
      .concat([this.locateWorstCaseLowerBound[this.locateWorstCaseLowerBound.length-1]]
        .map(e=> {return {p1x:this.locateWorstCaseLowerBound[j].p1x-5,p1y:e.p1y-10,p2x:e.p2x+15,p2y:e.p2y-10}}))
    }
    this.locateWorstCaseLowerBound.reverse()
    this.initLines('reset');
    //this.findExtremes();
  }

  initLines(mode:'reset'|'locateWorstCaseLowerBound'):Line[]{
    let initLines:any=eval("this."+mode)
    this.lines=[]
    this.extremes=undefined
    for(let line of initLines){
      let pushLine=this.createLine(line.p1x,line.p1y,line.p2x,line.p2y)
      if(pushLine instanceof Line)this.lines.push(pushLine!);
    }
    return this.lines;
  }

  createLine(p1x:number,p1y:number,p2x:number,p2y:number):Line|{problem:"x"|"i",lines:Line[]}{
    if(p1x==p2x)throw new Error("Vertical Line not allowed!");
    let iProblem=this.collidesAnyLine(p1x,p1y,p2x,p2y);
    let xProblem=this.hasPointOnSameX(p1x,p2x);
    if(xProblem && xProblem!=true){
      return {problem:"x",lines:xProblem};
    } else if(iProblem && iProblem!=true){
      return {problem:"i",lines:iProblem};
    } else {
      const p1=new Point(p1x,p1y);
      const p2=new Point(p2x,p2y);
      let c=p1x<p2x;
      let left=c?p1:p2;
      let right=c?p2:p1;
      if(!this.extremes){
        this.extremes={
          minX:left.x,
          maxX:right.x,
          minY:Math.min(p1y,p2y),
          maxY:Math.max(p1y,p2y)
        }
      }
      else{
        if(left.x<this.extremes.minX)this.extremes.minX=left.x;
        if(right.x>this.extremes.maxX)this.extremes.maxX=right.x;
        let minY=Math.min(p1y,p2y);
        let maxY=Math.max(p1y,p2y);
        if(minY<this.extremes.minY){
          this.extremes.minY=minY;
        }
        if(maxY>this.extremes.maxY){
          this.extremes.maxY=maxY;
        }
      }
      
      return new Line("s"+(++this.nameNumber),left,right)
    }
  }

  addLine(line:Line):Line[]{
    this.lines?.push(line)
    return this.getLines();
  }

  getLines():Line[]{
    return this.lines?? [];
  }

  shuffleLines():Line[]{ 
    //this.lines?.sort((a,b)=>{return Math.random()-0.5})
    this.shuffle(this.lines!);
    return this.lines??[];
  }

  shuffle(arr:Line[]){ // clean and simple solution from: https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
    for (let i=arr.length!-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [arr[i], arr[j]] = [arr[j],arr[i]]
    }
  }

  swapLineUp(n:number){
    if(n>0 && this.lines){
      [this.lines[n-1],this.lines[n]]=[this.lines[n],this.lines[n-1]]
    }
  }

  swapLineDown(n:number){
    if(n<this.lines!.length-1 && this.lines){
      [this.lines[n],this.lines[n+1]]=[this.lines[n+1],this.lines[n]]
    }
  }

  deleteLine(n:number){
    if(this.lines){
      this.lines.splice(n,1);
    }
    this.findExtremes();
  }

  getExtremes():{minX:number,maxX:number,minY:number,maxY:number} | undefined{
    return this.extremes;
  }

  findExtremes(){
    this.extremes=undefined;
    this.lines?.forEach(line => {
      if(!this.extremes){
        this.extremes={
          minX:line.left.x,
          maxX:line.right.x,
          minY:Math.min(line.left.y,line.right.y),
          maxY:Math.max(line.left.y,line.right.y)}
      }
      else{
        if(line.left.x<this.extremes.minX)this.extremes.minX=line.left.x;
        if(line.right.x>this.extremes.maxX)this.extremes.maxX=line.right.x;
        let minY=Math.min(line.left.y,line.right.y);
        let maxY=Math.max(line.left.y,line.right.y);
        if(minY<this.extremes.minY){
          this.extremes.minY=minY;
        }
        if(maxY>this.extremes.maxY){
          this.extremes.maxY=maxY;
        }
      }
    });
  }

  collidesAnyLine(x1:number,y1:number,x2:number,y2:number):Line[]|boolean{ 
    let intersections:Line[]=[]
    for(let line of this.lines!){ //https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
      let r=line.right;
      let l=line.left;
      let det=(x2-x1)*(r.y-l.y)-(r.x-l.x)*(y2-y1)
      if(det!==0){
        let lambda = ((r.y - l.y) * (r.x - x1) + (l.x - r.x) * (r.y - y1)) / det
        let gamma = ((y1 - y2) * (r.x - x1) + (x2 - x1) * (r.y - y1)) / det
        if(0<lambda && lambda<1 && 0<gamma&&gamma<1) intersections.push(line)
      }
    }
    return intersections.length>0?intersections:false
  }

  hasPointOnSameX(x1:number,x2:number):Line[]|boolean{
    let lines:Line[]=[]
    for(let line of this.lines!){
      let r,l
      [r,l]=[line.right.x,line.left.x]
      if([r,l].includes(x1)||[r,l].includes(x2))lines.push(line)
    }
    return lines.length>0?lines:false
  }
}
