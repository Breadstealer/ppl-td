import { Component, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { LinesService } from '../services/lines.service';
import { Line } from '../models/Line.model';
import { RICService } from '../services/ric.service';
import { Point } from '../models/Point.model';
import { Trapezoid } from '../models/Trapezoid.model';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  @ViewChild('canvas') canvas: any;
  @ViewChild('canvasDAG') canvasDAG: any;
  locateX:number=0;
  locateY:number=0;
  locateTrap?:number;
  lines:Line[]=[];
  total:number=0;
  counter:number=0;
  resolution:number[]=[1440,540]

  constructor(private ricService:RICService, public linesService:LinesService){}

  ngOnInit(): void {
    this.lines=this.linesService.getLines();
    this.total=this.lines.length;
  }

  ngAfterViewInit(): void {
    if(!this.canvas){
      alert("canvas not supplied! cannot bind WebGL context!");
      return;
    }
    if(!this.canvasDAG){
      alert("canvas not supplied! cannot bind WebGL context!");
      return;
    }
    this.canvas.nativeElement.style.width=(window.innerWidth*10)/12.15+"px";
    this.canvas.nativeElement.style.height=window.innerHeight/2.05+"px";
    this.canvasDAG.nativeElement.style.width=(window.innerWidth*10)/12.15+"px";
    this.canvasDAG.nativeElement.style.height=window.innerHeight/2.05+"px";
    this.setResolution(this.resolution[0],this.resolution[1]);
    this.ricService.drawLines(this.canvas.nativeElement);
  }

  setResolution(w:number,h:number){
    for(let c of [this.canvas,this.canvasDAG]){
      c.nativeElement.width=w;
      c.nativeElement.height=h;
    }
  }

  @HostListener("window:resize", ['$event'])
  resizeCanvas(){
    this.canvas.nativeElement.style.width=(window.innerWidth*10)/12.15+"px";
    this.canvas.nativeElement.style.height=window.innerHeight/2.05+"px";
    this.ricService.drawRIC(this.canvas.nativeElement);
    this.canvasDAG.nativeElement.style.width=(window.innerWidth*10)/12.15+"px";
    this.canvasDAG.nativeElement.style.height=window.innerHeight/2.05+"px";
    this.ricService.drawDAG(this.canvasDAG.nativeElement);
  }

  drawLines(): void {
    this.ricService.drawLines(this.canvas.nativeElement)
  }

  drawRIC(): void {
    this.ricService.drawRIC(this.canvas.nativeElement);
  }

  stepBck():void {
    if(this.counter>0){
      this.ricService.stepBck();
      this.counter--;
    }
    if(this.counter===0){
      this.ricService.reset();
      this.ricService.drawRIC(this.canvas.nativeElement);
      this.ricService.drawDAG(this.canvasDAG.nativeElement);
    }
    for(let i=0;i<this.counter*2;i++){
      this.ricService.stepFwd(this.lines[Math.floor(i/2)],this.canvas.nativeElement,this.canvasDAG.nativeElement);
    }
    return;
  }

  stepFwd():void{
    if(this.counter==this.total){
      this.ricService.drawRIC(this.canvas.nativeElement);
      this.ricService.drawDAG(this.canvasDAG.nativeElement);
      alert("all lines inserted!");
      return;
    }
    this.counter=this.counter+this.ricService.stepFwd(this.lines[this.counter],this.canvas.nativeElement,this.canvasDAG.nativeElement);
  }

  shuffleLines():void {
    this.reset();
    this.lines=this.linesService.shuffleLines();
    return;
  }

  reset():void {
    this.ricService.reset();
    this.ricService.drawRIC(this.canvas.nativeElement);
    this.ricService.drawDAG(this.canvasDAG.nativeElement);
    this.counter=0;
  }

  swapLineUp(n:number){
    this.reset();
    this.linesService.swapLineUp(n);
  }

  swapLineDown(n:number){
    this.reset();
    this.linesService.swapLineDown(n);
  }

  deleteLine(n:number){
    this.linesService.deleteLine(n);
    this.reset();
    this.total--;
  }

  point(event:MouseEvent){
    const rect= this.canvas.nativeElement.getBoundingClientRect();
    const canvX= event.offsetX*parseFloat(this.canvas.nativeElement.width)/parseFloat(this.canvas.nativeElement.style.width);
    const canvY= event.offsetY*parseFloat(this.canvas.nativeElement.height)/parseFloat(this.canvas.nativeElement.style.height);
    [this.locateX,this.locateY]=this.ricService.calcRealXY(this.canvas.nativeElement,canvX,canvY);
    this.locatePoint();
  }

  locatePoint(){
    this.ricService.drawRIC(this.canvas.nativeElement);
    let locTrap=this.ricService.point(this.canvas.nativeElement,this.canvasDAG.nativeElement,this.locateX,this.locateY)
    if(locTrap && locTrap instanceof Trapezoid){
      this.locateTrap=locTrap.id
    }
  }

  insertLine(x1:number,y1:number,x2:number,y2:number){
    if(isNaN(x1)||isNaN(y1)||isNaN(x2)||isNaN(y2)){
      alert("input missing!")
      return;
    }
    this.reset();
    let lineOrIntersections=this.linesService.createLine(x1,y1,x2,y2);
    if(lineOrIntersections instanceof Line){
      this.ricService.updateExtremes();
      this.lines=this.linesService.addLine(lineOrIntersections);
      this.total++;
      this.ricService.drawLines(this.canvas.nativeElement);
    } else {
      if(lineOrIntersections.problem==="i"){
        let line=new Line("intersecting",new Point(x1,y1),new Point(x2,y2))
        this.ricService.drawIntersections(this.canvas.nativeElement,line,lineOrIntersections.lines)
        let names=lineOrIntersections.lines.map(item => item.name)
        //alert("Segment intersecting "+names)
      } else if(lineOrIntersections.problem==="x"){
        let line=new Line("sharing X",new Point(x1,y1),new Point(x2,y2))
        this.ricService.drawIntersections(this.canvas.nativeElement,line,lineOrIntersections.lines)
        let names=lineOrIntersections.lines.map(item => item.name)
        //alert("Point of segment sharing X with "+names)
      }
      
    }
  }

  test(){
    for(let i=0;i<1000;i++){
      while(this.counter<this.total){
        this.stepFwd();
      }
      this.shuffleLines();
    }
  }

  testInsert(){
    for(let i=0;i<300;i++){
      let xOff=Math.random()*10000;
      let yOff=Math.random()*10000;
      this.insertLine(Math.random()*1000+xOff,Math.random()*1000+yOff,Math.random()*1000+xOff,Math.random()*1000+yOff)
    }
  }
}
