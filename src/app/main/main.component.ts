import { Component, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { LinesService } from '../services/lines.service';
import { Line } from '../models/Line.model';
import { RICService } from '../services/ric.service';
import { Point } from '../models/Point.model';
import { Trapezoid } from '../models/Trapezoid.model';
import { DRAWService } from '../services/draw.service';
import { DAGService } from '../services/dag.service';
import { Node } from '../models/Node.model';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  @ViewChild('canvas') canvas: any;
  @ViewChild('canvasDAG') canvasDAG: any;
  insertMode:"reset"|"locateWorstCaseLowerBound"|"custom"|"random"|"deleteAll"|"polygons"|"worstcaseExp"="custom"
  open:boolean=false;
  locateX:number=0;
  locateY:number=0;
  locateTrap?:number;
  longestPath?:number;
  maxDepth?:number;
  nodeAmount?:number;
  trapAmount?:number;
  edgeAmount?:number;
  meetsSizeBound?:boolean;
  meetsPathBound?:boolean;
  lines:Line[]=[];
  total:number=0;
  counter:number=0;
  resolution:number[]=[1440,540]

  constructor(private ricService:RICService, public linesService:LinesService, private drawService:DRAWService, private dagService:DAGService){}

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
    this.drawService.drawLines(this.canvas.nativeElement);
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
    this.canvasDAG.nativeElement.style.width=(window.innerWidth*10)/12.15+"px";
    this.canvasDAG.nativeElement.style.height=window.innerHeight/2.05+"px";
  }

  drawLines(): void {
    this.drawService.drawLines(this.canvas.nativeElement)
  }

  drawRIC(): void {
    this.ricService.drawRIC(this.canvas.nativeElement);
  }

  stepBck():void {
    this.clearUI();
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
    this.clearUI();
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
    this.clearUI();
    this.ricService.reset();
    this.drawLines();
    this.ricService.drawDAG(this.canvasDAG.nativeElement);
    this.counter=0;
    this.total=this.lines.length
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
  }

  point(event:MouseEvent){
    const rect= this.canvas.nativeElement.getBoundingClientRect();
    const canvX= event.offsetX*parseFloat(this.canvas.nativeElement.width)/parseFloat(this.canvas.nativeElement.style.width);
    const canvY= event.offsetY*parseFloat(this.canvas.nativeElement.height)/parseFloat(this.canvas.nativeElement.style.height);
    [this.locateX,this.locateY]=this.drawService.calcRealXY(this.canvas.nativeElement,canvX,canvY);
    this.locatePoint();
  }

  locatePoint(){
    this.ricService.drawRIC(this.canvas.nativeElement);
    let locTrap=this.drawService.point(this.canvas.nativeElement,this.canvasDAG.nativeElement,this.locateX,this.locateY)
    if(locTrap && locTrap instanceof Trapezoid){
      this.locateTrap=locTrap.id
    }
  }

  insertLine(x1:number,y1:number,x2:number,y2:number){
    if(isNaN(x1)||isNaN(y1)||isNaN(x2)||isNaN(y2)){
      alert("input missing!")
      return;
    }
    if(this.linesService.getLines().length>0)this.reset();
    let lineOrIntersections=this.linesService.createLine(x1,y1,x2,y2);
    if(lineOrIntersections instanceof Line){
      this.ricService.reset();
      this.lines=this.linesService.addLine(lineOrIntersections);
      this.total++;
      this.drawService.drawLines(this.canvas.nativeElement);
    } else {
      if(lineOrIntersections.problem==="i"){
        let line=new Line("intersecting",new Point(x1,y1,"intersecting"),new Point(x2,y2,"intersecting"))
        this.drawService.drawIntersections(this.canvas.nativeElement,line,lineOrIntersections.lines)
        let names=lineOrIntersections.lines.map(item => item.name)
        //alert("Segment intersecting "+names)
      } else if(lineOrIntersections.problem==="x"){
        let line=new Line("sharing X",new Point(x1,y1,"sharing X"),new Point(x2,y2,"sharing X"))
        this.drawService.drawIntersections(this.canvas.nativeElement,line,lineOrIntersections.lines)
        let names=lineOrIntersections.lines.map(item => item.name)
        //alert("Point of segment sharing X with "+names)
      }
      
    }
  }

  findDAGInBound(c1:number,c2:number){
    if(isNaN(c1)||isNaN(c2)){
      alert("Missing Inputs c1 and/or c2");
      return;
    }
    for (let i = 0; i < 100; i++) {
      this.recalc(c1,c2);
      if(this.meetsPathBound&&this.meetsSizeBound){
        alert("DAG within Boundaries found after "+i+" retries")
        return
      }
    }
    alert("no DAG within Boundaries found after 100 retries")
  }

  recalc(c1:number,c2:number){
    this.shuffleLines();
    this.skip();
    this.analyzeDAG(c1,c2)
  }

  analyzeDAG(c1:number,c2:number){  
    this.longestLegalSearchPath();
    this.maxDepth=this.dagService.getMaxDepth();
    this.getNodeAmount();
    this.getTrapAmount();
    this.getEdgeAmount();
    if(!isNaN(c1)){
      this.meetsSizeBound=(this.nodeAmount!)>c1*this.total?false:true;
    }
    if(!isNaN(c2)){
      this.meetsPathBound=(this.longestPath!)>c2*Math.log(this.total)?false:true;
    }
  }

  getNodeAmount(){
    this.nodeAmount=this.dagService.getNodeAmount()
  }

  getTrapAmount(){
    this.trapAmount=this.dagService.getTrapAmount();
  }

  getEdgeAmount(){
    this.edgeAmount=this.dagService.getEdgeAmount();
  }

  longestLegalSearchPath(){
    this.longestPath=this.ricService.longestLegalSearchPath(this.dagService.getRoot(),{min:undefined,max:undefined},0)
  }

  clearUI(){
    delete this.locateTrap
    delete this.longestPath
    delete this.maxDepth
    delete this.nodeAmount
    delete this.trapAmount
    delete this.edgeAmount
    delete this.meetsSizeBound
    delete this.meetsPathBound
  }

  skip(){
    while(this.counter!=this.total){
      this.counter=this.counter+this.ricService.stepFwd(this.lines[this.counter],this.canvas.nativeElement,this.canvasDAG.nativeElement,false);
    }
    this.ricService.drawDAG(this.canvasDAG.nativeElement);
    this.ricService.drawRIC(this.canvas.nativeElement)
  }

  initLines(mode:'reset'|'locateWorstCaseLowerBound'|'deleteAll'|'polygons'|'worstcaseExp'){
    this.lines=this.linesService.initLines(mode);
    this.reset();
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
    for(let i=0;i<100;i++){
      let xOff=Math.random()*1000;
      let yOff=Math.random()*1000;
      this.insertLine(Math.random()*1000+xOff,Math.random()*1000+yOff,Math.random()*1000+xOff,Math.random()*1000+yOff)
    }
  }
}
