import { Point } from "./point.model";

export class Line {
    name: string;
    left: Point;
    right: Point;

    constructor(name:string,p1:Point,p2:Point){
        if(p1.x==p2.x)throw new Error("Vertical Line not allowed!");
        var c=p1.x<p2.x;
        this.left=c?p1:p2;
        this.right=c?p2:p1;
        this.name=name;
        try{
            const nameNumber:number=<any>name.substring(1);
            this.left.setName("l"+nameNumber);
            this.right.setName("r"+nameNumber);
        }catch{}
        
    }

    func(p:Point):number{
        return ((this.right.y-this.left.y)/(this.right.x-this.left.x))*(p.x-this.left.x)+this.left.y
        //if((this.right.y-this.left.y)/(this.right.x-this.left.x)<(p.y-this.left.y)/(p.x-this.left.x)) return true;
        //return false;
    }
}