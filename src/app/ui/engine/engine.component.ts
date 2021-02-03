import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { EngineService } from 'src/app/engine/services/engine.service';
@Component({
  selector: 'ui-engine',
  templateUrl: './engine.component.html',
  styleUrls: ['./engine.component.scss'],
})
export class EngineComponent implements OnInit {
  @ViewChild('renderCanvas', { static: true })
  private renderCanvas: ElementRef<HTMLCanvasElement>;

  constructor(private _es: EngineService) {}

  ngOnInit(): void {
    this._es.buildScene(this.renderCanvas);
    this._es.animate();
  }
}
