import { H_Node } from "./H-node.model";
import { Line } from "./line.model";
import { Node } from "./node.model";
import { Point } from "./point.model";
import { Trapezoid } from "./trapezoid.model";

export class V_Node {
    constructor(public line:Line,public leftChild:Node,public rightChild:Node){

    }

    locate(p:Point):Node{
        if(p.y>this.line.func(p)){
            return this.rightChild.locate(p);
        }
        else{
            return this.leftChild.locate(p);
        }
    }
}