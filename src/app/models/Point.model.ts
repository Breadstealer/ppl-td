export class Point{
    name: string="";
    x: number;
    y: number;

    constructor(x:number,y:number,name?:string){
        this.x=x;
        this.y=y;
        this.setName(name??"");
    }

    isEqual(x:number,y:number):boolean{
        if(x===this.x&&y===this.y)return true
        return false
    }

    setName(name:string){
        if(this.name==="")this.name+=name;
    }
}
