import { AfterViewInit, Component, ElementRef, ViewChild, HostListener, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { ThreeLoadService } from '../components/three/geometry/three-load/three-load.service';
import { ThreeMembersService } from '../components/three/geometry/three-members.service';

import { SceneService } from './scene.service';

@Component({
  selector: 'app-three',
  templateUrl: './three.component.html',
  styleUrls: ['./three.component.scss'],
})
export class ThreeComponent implements AfterViewInit, OnDestroy {

  @ViewChild('myCanvas', { static: true }) private canvasRef!: ElementRef;

  
  // 大きさを調整するためのスケール
  private rotateX: number;
  private rotateZ: number;
  private height: number;
  private params: any; // GUIの表示制御
  public gui: any;

  constructor(private ngZone: NgZone,
              private scene: SceneService,
              private member: ThreeMembersService,
              private load: ThreeLoadService) {

    THREE.Object3D.DefaultUp.set(0, 0, 1);

    // gui
    this.rotateX = 0;
    this.rotateZ = 0;
    this.height = 0;
    this.params = {
      rotateX: this.rotateX,
      rotateZ: this.rotateZ,
      height: this.height,
    };
    this.gui = null;
  }

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  ngAfterViewInit() {
    this.scene.OnInit(this.getAspectRatio(),
                      this.canvas,
                      devicePixelRatio,
                      window.innerWidth,
                      window.innerHeight);
    // レンダリングする
    this.animate();

    this.member.OnInit();
    this.load.OnInit();

    this.guiEnable();
  }

  ngOnDestroy() {
  }

  animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('DOMContentLoaded', () => {
      this.scene.render();
      });
    });
  }

  // マウスクリック時のイベント
  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent) {
  }

  // マウスクリック時のイベント
  @HostListener('mouseup', ['$event'])
  public onMouseUp(event: MouseEvent) {
  }

  // マウス移動時のイベント
  @HostListener('mousemove', ['$event'])
  public onMouseMove(event: MouseEvent) {
  }

  // ウインドウがリサイズした時のイベント処理
  @HostListener('window:resize', ['$event'])
  public onResize(event: Event) {
    this.scene.onResize(this.getAspectRatio(),
                        window.innerWidth,
                        window.innerHeight - 120);
  }

  private getAspectRatio(): number {
    if (this.canvas.clientHeight === 0) {
      return 0;
    }
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  public guiEnable(): void {
    if (this.gui !== null) {
      return;
    }
    
    this.gui = this.scene.gui.addFolder('try')
    this.gui.add(this.params, 'rotateX', 0, 90)
      .step(10)
      .onChange((value) => {
        this.rotateX = value;
        this.member.changeData(this.rotateZ, this.height);
        this.load.changeData(this.rotateX, this.rotateZ, this.height);
        this.scene.render();
    });
    this.gui.add(this.params, 'rotateZ', 0, 360)
      .step(10)
      .onChange((value) => {
        this.rotateZ = value;
        this.member.changeData(this.rotateZ, this.height);
        this.load.changeData(this.rotateX, this.rotateZ, this.height);
        this.scene.render();
    });
    this.gui.add(this.params, 'height', -1.0, 1.0)
      .step(0.1)
      .onChange((value) => {
        this.height = value;
        this.member.changeData(this.rotateZ, this.height);
        this.load.changeData(this.rotateX, this.rotateZ, this.height);
        this.scene.render();
    });
    this.gui.closed = false

  }

}
