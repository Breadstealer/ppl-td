import { Line } from "./line.model";
import { Node } from "./node.model";
import { Point } from "./point.model";

export class Trapezoid{
    private leftNeighbors:Node[]=[];
    private rightNeighbors:Node[]=[];


    constructor(public id:number, public left:Point,public right:Point,public top:Line,public bottom:Line){
    }

    locate(p:Point){
        return this;
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