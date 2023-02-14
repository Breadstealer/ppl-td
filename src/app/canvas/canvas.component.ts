import { AfterViewInit, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { RICService } from '../services/ric.service';
import { LinesService } from '../services/lines.service';
import { Line } from '../models/line.model';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit, AfterViewInit{
  @ViewChild('canvas') canvas: any;
  private lines:Line[]=[];
  total:number=0;
  counter:number=0;

  constructor(private ricService:RICService, private linesService:LinesService){}

  ngOnInit(): void {
    this.lines=this.linesService.getLines();
    this.total=this.lines.length;
  }

  ngAfterViewInit(): void {
    if(!this.canvas){
      alert("canvas not supplied! cannot bind WebGL context!");
      return;
    }
    this.canvas.nativeElement.width=window.innerWidth*10/12;
    this.canvas.nativeElement.height=window.innerHeight/2;
  }

  @HostListener("window:resize", ['$event'])
  resizeCanvas(){
    this.canvas.nativeElement.width=(window.innerWidth*8)/12;
    this.canvas.nativeElement.height=window.innerHeight/2;
    this.ricService.drawRIC(this.canvas.nativeElement);
  }

  drawLines(): void {
    this.ricService.drawLines(this.canvas.nativeElement)
  }

  drawRIC(): void {
    this.ricService.drawRIC(this.canvas.nativeElement);
  }

  stepBck():void {
    if(this.counter>0){
      this.ricService.stepBck(this.canvas.nativeElement);
    this.counter--;
    }
    return;
  }

  stepFwd():void{
    if(this.counter==this.total){
      alert("all lines inserted!");
      return;
    }
    this.ricService.stepFwd(this.lines[this.counter++],this.canvas.nativeElement);
  }

}
