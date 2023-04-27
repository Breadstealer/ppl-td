export class Point{
    name: string="";
    x: number;
    y: number;

    constructor(x:number,y:number,name?:string){
        this.x=x;
        this.y=y;
        this.setName(name!);
    }

    setName(name:string){
        this.name=name;
    }
}