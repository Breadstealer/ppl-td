import { Line } from "./Line.model";
import { Point } from "./Point.model";

export class V_Node {
    constructor(public line:Line){

    }

    leftOrRight(p:Point):"l"|"r"{
        if(p.y>this.line.func(p)){
            return "r";
        }
        else{
            return "l";
        }
    }
}