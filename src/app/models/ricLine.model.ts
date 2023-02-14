import { Line } from "./line.model";
import { Point } from "./point.model";

export class RICLine extends Line {
    constructor(p1:Point,p2:Point,public leftLine:{up:number,lo:number},public rightLine:{up:number,lo:number}){
        super(p1,p2);
    }
}