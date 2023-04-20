import { H_Node } from "./H-node.model";
import { V_Node } from "./V-Node.model";
import { Point } from "./point.model";
import { Trapezoid } from "./trapezoid.model";

export class Node {
    private node:H_Node|V_Node|Trapezoid;
    private depth:number;
    public merged:boolean;

    constructor(depth:number,node:H_Node|V_Node|Trapezoid,merged?:boolean){
        this.depth=depth;
        this.node=node;
        this.merged=merged??false;
    }

    merge(p:Point){
        if(this.node instanceof Trapezoid){
            this.merged=true;
            this.node.merge(p);
        }
    }

    setDepth(depth:number):void{
        this.depth=depth;
    }

    getDepth():number{
        return this.depth;
    }

    setNode(node:H_Node|V_Node|Trapezoid):void {
        this.node=node;
    }

    getNode():H_Node|V_Node|Trapezoid|undefined{
        return this.node;
    }

    locate(p:Point):Node{
        if(this.node instanceof Trapezoid){
            return this;
        }
        return this.node.locate(p);
    }

    setNeighbors(left:Node[],right:Node[]){
        if(this.node instanceof Trapezoid){
            this.node.setLeftNeighbors(left);
            this.node.setRightNeighbors(right);
        }
    }

    getNeighbors():{left:Node[],right:Node[]}{
        if(this.node instanceof Trapezoid){
            return this.node.getNeighbors()
        }
        else return {left:[],right:[]}
    }
}