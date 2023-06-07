import { Point } from "./Point.model";

export class H_Node {
    constructor(public point:Point){

    }

    leftOrRight(p:Point):"l"|"r"{
        if(p.x>this.point.x){
            return "r";
        }
        else{
            return "l";
        }
    }
}