import { Line } from "./Line.model";
import { Node } from "./Node.model";
import { Point } from "./Point.model";

export class Trapezoid{
    private leftNeighbors:Node[]=[];
    private rightNeighbors:Node[]=[];


    constructor(public id:number, public left:Point,public right:Point,public top:Line,public bottom:Line){
    }

    merge(p:Point){
        this.right=p;
    }

    setLeftNeighbors(left:Node[]){
        this.leftNeighbors=left;
    }

    setRightNeighbors(right:Node[]){
        this.rightNeighbors=right;
    }

    getNeighbors():{left:Node[],right:Node[]}{
        return {left:this.leftNeighbors,right:this.rightNeighbors}
    }
}