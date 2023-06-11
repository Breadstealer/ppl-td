import { Injectable } from '@angular/core';
import { Trapezoid } from '../models/Trapezoid.model';
import { Point } from '../models/Point.model';
import { Line } from '../models/Line.model';
import { Node } from '../models/Node.model';
import { LinesService } from './lines.service';

@Injectable({
  providedIn: 'root'
})
export class DAGService {
  private root:Node|undefined;
  private maxDepth:number=0;
  public locationPath:Node[]=[];

  constructor(private linesService:LinesService) {
    this.init();
  }

  init(){
    const extremes:any=this.linesService.getExtremes();
    let xSpan=extremes.maxX-extremes.minX
    let ySpan=extremes.maxY-extremes.minY
    ySpan=ySpan==0?20:ySpan
    const bbOffsetX=xSpan*0.1;
    const bbOffsetY=ySpan*0.1;
    const UL = new Point(extremes.minX-bbOffsetX,extremes.minY-bbOffsetY);
    const UR = new Point(extremes.maxX+bbOffsetX,extremes.minY-bbOffsetY);
    const LL = new Point(extremes.minX-bbOffsetX,extremes.maxY+bbOffsetY);
    const LR = new Point(extremes.maxX+bbOffsetX,extremes.maxY+bbOffsetY);
    const T = new Line("",UL,UR);
    const B = new Line("",LL,LR);
    this.root = new Node(0,new Trapezoid(0,UL,LR,T,B));
    this.maxDepth=0;
  }

  locate(p: Point):Node{
    this.locationPath=[]
    return this.root!.locate(p,this.locationPath);
  }

  setMaxDepth(d: number):void{
    if(d>this.maxDepth)this.maxDepth=d;
  }

  getMaxDepth():number{
    return this.maxDepth;
  }

  getRoot():Node{
    return this.root!;
  }
}
