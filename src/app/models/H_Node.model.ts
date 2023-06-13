import { Point } from "./Point.model";

export class H_Node {
    constructor(public point:Point){

    }

    leftOrRight(p:Point):"l"|"r"|Point{
        if(p.x===this.point.x&&p.y===this.point.y)return this.point
        if(p.x>this.point.x){
            return "r";
        }
        else{
            return "l";
        }
    }
}