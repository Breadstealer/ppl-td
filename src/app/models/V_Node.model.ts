import { Line } from "./Line.model";
import { Node } from "./Node.model";
import { Point } from "./Point.model";

export class V_Node {
    constructor(public line:Line,public leftChild:Node,public rightChild:Node){

    }

    locate(p:Point,locationPath:Node[]):Node{
        if(p.y>this.line.func(p)){
            return this.rightChild.locate(p,locationPath);
        }
        else{
            return this.leftChild.locate(p,locationPath);
        }
    }
}