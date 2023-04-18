export class Point{
    name: string="";
    x: number;
    y: number;

    constructor(x:number,y:number){
        this.x=x;
        this.y=y;
    }

    setName(name:string){
        this.name=name;
    }
}