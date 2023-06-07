import { H_Node } from "./H_Node.model";
import { V_Node } from "./V_Node.model";
import { Point } from "./Point.model";
import { Trapezoid } from "./Trapezoid.model";

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

    locate(p:Point,locationPath:Node[]):Node{
        locationPath.push(this);
        if(this.node instanceof Trapezoid){
            return this;
        }
        return this.node.locate(p,locationPath);
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