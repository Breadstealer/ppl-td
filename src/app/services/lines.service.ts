import { Injectable } from '@angular/core';
import { Line } from '../models/line.model';
import { Point } from '../models/point.model';

@Injectable({
  providedIn: 'root'
})
export class LinesService {
  private lines:Line[] | undefined
  private extremes:{minX:number,maxX:number,minY:number,maxY:number} | undefined;

  constructor() {
    this.initLines();
    //this.findExtremes();
  }

  initLines(){
    this.lines=[]
    for(let line of[
      {name:"s1",p1x:50,p1y:250,p2x:500,p2y:50},
      {name:"s2",p1x:100,p1y:300,p2x:250,p2y:250},
      {name:"s3",p1x:75,p1y:275,p2x:125,p2y:275},
      {name:"s4",p1x:150,p1y:300,p2x:400,p2y:600},
      {name:"s5",p1x:200,p1y:300,p2x:450,p2y:250},
    ]){
      let pushLine=this.createLine(line.name,line.p1x,line.p1y,line.p2x,line.p2y)
      this.lines.push(pushLine!);
    }
    /* this.lines=[
      new Line("s1",new Point(50,250), new Point(500,50)), 
      new Line("s2",new Point(100,300), new Point(250,250)), 
      new Line("s3",new Point(75,275), new Point(125,275)),
      new Line("s4",new Point(150,300), new Point(400,600)), 
      new Line("s5",new Point(200,300), new Point(450,250))] */
  }

  createLine(name:string,p1x:number,p1y:number,p2x:number,p2y:number):Line{
    if(p1x==p2x)throw new Error("Vertical Line not allowed!");
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
    
    return new Line(name,left,right)
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
  }

  getExtremes():{minX:number,maxX:number,minY:number,maxY:number} | undefined{
    return this.extremes;
  }

  /* findExtremes(){
    this.lines?.forEach(line => {
      if(!this.extremes){
        this.extremes={
          minX:line.left.x,
          maxX:line.right.x,
          minY:line.left.y<line.right.y?line.left.y:line.right.y,
          maxY:line.left.y<line.right.y?line.right.y:line.left.y}
      }
      else{
        if(line.left.x<this.extremes.minX){
          this.extremes.minX=line.left.x;
        }
        if(line.right.x>this.extremes.maxX){
          this.extremes.maxX=line.right.x;
        }
        var smY=line.left.y<line.right.y?line.right.y:line.left.y;
        var bgY=line.left.y<line.right.y?line.right.y:line.left.y;
        if(smY<this.extremes.minY){
          this.extremes.minY=smY;
        }
        if(bgY>this.extremes.maxY){
          this.extremes.maxY=bgY;
        }
      }
    });
  } */

  collidesAnyLine(x1:number,y1:number,x2:number,y2:number):Line[]|boolean{

    return true
  }
}
