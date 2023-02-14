import { V_Node } from "./V-Node.model";
import { Node } from "./node.model";
import { Point } from "./point.model";
import { Trapezoid } from "./trapezoid.model";

export class H_Node {
    constructor(private value:number,private leftChild:Node,private rightChild:Node){

    }

    locate(p:Point):Node{
        if(p.x>this.value){
            return this.rightChild.locate(p);
        }
        else{
            return this.leftChild.locate(p);
        }
    }
}