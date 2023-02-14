import { Injectable } from '@angular/core';
import { H_Node } from '../models/H-node.model';
import { V_Node } from '../models/V-Node.model';
import { Trapezoid } from '../models/trapezoid.model';
import { Point } from '../models/point.model';
import { Line } from '../models/line.model';
import { Node } from '../models/node.model';
import { LinesService } from './lines.service';

@Injectable({
  providedIn: 'root'
})
export class DAGService {
  private DAG:Node;

  constructor(private linesService:LinesService) {
    const extremes:any=linesService.getExtremes();
    const UL = new Point(extremes.minX*0.5,extremes.minY*0.5);
    const UR = new Point(extremes.maxX*2,extremes.minY*0.5);
    const LL = new Point(extremes.minX*0.5,extremes.maxY*2);
    const LR = new Point(extremes.maxX*2,extremes.maxY*2);
    const T = new Line(UL,UR);
    const B = new Line(LL,LR);
    this.DAG = new Node(new Trapezoid(0,UL,LR,T,B));
  }

  locate(p: Point):Node{
    return this.DAG.locate(p);
  }
}
