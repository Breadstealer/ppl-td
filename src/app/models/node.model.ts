import { H_Node } from "./H_Node.model";
import { V_Node } from "./V_Node.model";
import { Point } from "./Point.model";
import { Trapezoid } from "./Trapezoid.model";

export class Node {
    private inner:H_Node|V_Node|Trapezoid;
    private depth:number;
    public merged:boolean;

    constructor(depth:number,node:H_Node|V_Node|Trapezoid,merged?:boolean){
        this.depth=depth;
        this.inner=node;
        this.merged=merged??false;
    }

    merge(p:Point){
        if(this.inner instanceof Trapezoid){
            this.merged=true;
            this.inner.merge(p);
        }
    }

    setDepth(depth:number):void{
        this.depth=depth;
    }

    getDepth():number{
        return this.depth;
    }

    setInner(inner:H_Node|V_Node|Trapezoid):void {
        this.inner=inner;
    }

    getInner():H_Node|V_Node|Trapezoid|undefined{
        return this.inner;
    }

    locate(p:Point,locationPath:Node[]):Node{
        locationPath.push(this);
        if(this.inner instanceof Trapezoid){
            return this;
        }
        return this.inner.locate(p,locationPath);
    }

    setNeighbors(left:Node[],right:Node[]){
        if(this.inner instanceof Trapezoid){
            this.inner.setLeftNeighbors(left);
            this.inner.setRightNeighbors(right);
        }
    }

    getNeighbors():{left:Node[],right:Node[]}{
        if(this.inner instanceof Trapezoid){
            return this.inner.getNeighbors()
        }
        else return {left:[],right:[]}
    }
}