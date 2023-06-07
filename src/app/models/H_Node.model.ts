import { Node } from "./Node.model";
import { Point } from "./Point.model";

export class H_Node {
    constructor(public point:Point,public leftChild:Node,public rightChild:Node){

    }

    locate(p:Point,locationPath:Node[]):Node{
        if(p.x>this.point.x){
            return this.rightChild.locate(p,locationPath);
        }
        else{
            return this.leftChild.locate(p,locationPath);
        }
    }
}