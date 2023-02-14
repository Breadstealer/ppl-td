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
    this.findExtremes();
  }

  initLines(){
    this.lines=[
      new Line(new Point(50,250), new Point(500,50)), 
      new Line(new Point(100,300), new Point(250,250)), 
      new Line(new Point(75,275), new Point(125,275)),
      new Line(new Point(150,300), new Point(400,600)), 
      new Line(new Point(200,300), new Point(450,250))]
  }

  getLines():Line[]{
    return this.lines?? [];
  }

  getExtremes():{minX:number,maxX:number,minY:number,maxY:number} | undefined{
    return this.extremes;
  }

  findExtremes(){
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
  }
}
