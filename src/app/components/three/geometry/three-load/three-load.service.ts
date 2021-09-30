import { Injectable } from "@angular/core";
import { SceneService } from "src/app/three/scene.service";

import * as THREE from "three";
import { Vector2, Vector3 } from "three";

import { ThreeMembersService } from "../three-members.service";

//import { ThreeLoadText } from "./three-load-text";
//import { ThreeLoadDimension } from "./three-load-dimension";
import { ThreeLoadDistribute } from "./three-load-distribute";
//import { DataHelperModule } from "src/app/providers/data-helper.module";

import { Text } from 'troika-three-text'

@Injectable({
  providedIn: "root",
})
export class ThreeLoadService {

  private isVisible = { object: false, gui: false };

  // 全ケースの荷重を保存
  private AllCaseLoadList: {};
  private currentIndex: string; // 現在 表示中のケース番号
  private currentRow: number;   // 現在 選択中の行番号
  private currentCol: number;   // 現在 選択中の列番号

  // 荷重のテンプレート
  private loadEditor: {};

  // 大きさを調整するためのスケール
  private LoadScale: number;
  private rotateX: number;
  private rotateY: number;
  private rotateZ: number;
  private height: number;
  private params: any; // GUIの表示制御
  public gui: any;
  private myText: any;

  private nodeData: any;    // 荷重図作成時の 節点データ
  private memberData: any;  // 荷重図作成時の 要素データ

  private newNodeData: any;    // 変更された 節点データ
  private newMemberData: any;  // 変更された 要素データ

  private DistributeLoadList: THREE.Object3D;

  // 選択中のアイテムに表示するテキストのシーン
  private ThreeTextObject: THREE.Object3D;

  // 初期化
  constructor(
    private scene: SceneService,
    private three_member: ThreeMembersService
  ) {

    // 荷重の雛形をあらかじめ生成する
    this.loadEditor = {};
    this.loadEditor[ThreeLoadDistribute.id]   = new ThreeLoadDistribute();    // 分布荷重のテンプレート

    // 荷重値のテキストと寸法線は、this.ThreeTextObject で別に管理する
    //his.ThreeTextObject = new THREE.Object3D;
    //this.scene.add(this.ThreeTextObject); // シーンに追加

    // 全てのケースの荷重情報
    this.AllCaseLoadList = {};
    this.currentIndex = null;
    this.currentRow = null;
    this.currentCol = null;

    // 節点、部材データ
    this.nodeData = null;
    this.memberData = null;
    this.newNodeData = null;
    this.newMemberData = null;

    // gui
    this.rotateX = 0;
    this.rotateY = 0;
    this.rotateZ = 0;
    this.height = 0;
    this.params = {
      rotateX: this.rotateX,
      rotateY: this.rotateY,
      rotateZ: this.rotateZ,
      height: this.height,
    };

    this.DistributeLoadList = new THREE.Object3D();
    this.scene.add(this.DistributeLoadList);

    // gui
    this.LoadScale = 100;
    this.params = {
      LoadScale: this.LoadScale,
    };
    this.gui = this.three_member.gui;;

    //text
    this.myText = Object
  }

 
  // 荷重の入力が変更された場合
  public changeData(rotateX, rotateZ, height): void {

    //荷重の要素を削除
    const removeObject = this.DistributeLoadList.children[0];
    this.DistributeLoadList.remove(removeObject);

    // 新規情報をセット
    this.rotateX = rotateX;
    this.rotateZ = rotateZ;
    this.height = height;

    const i = new THREE.Vector3(0,0,0);
    const j = new THREE.Vector3(1.0,0,0);;
    const v = new THREE.Vector3(j.x - i.x, j.y - i.y, j.z - i.z);
    const len: number = v.length();
    const base_rotate_z = Math.acos(v.y / len);

    const new_rotate_z = base_rotate_z - this.rotateZ * Math.PI / 180;

    //部材中央の点座標を入手
    const height_c = this.height / 2;
    let new_position_x = 0.5 * Math.sin(new_rotate_z);
    let new_position_y = 0.5 * Math.cos(new_rotate_z);
    let new_position_z = 0;
    const a = new_position_y / new_position_x; // y = axのaを算出
    new_position_x = Math.sqrt((0.5**2 - height_c**2) / (1 + a**2)) * Math.sign(new_position_x);
    new_position_y = Math.sqrt(Math.abs(0.5**2 - height_c**2 - new_position_x**2)) * Math.sign(new_position_y);
    new_position_z = height_c;
    const localAxis = this.three_member.localAxis(0, 0, 0, new_position_x*2, new_position_y*2, new_position_z*2 ,0)

    //オブジェクトの再生成
    const nodei = new THREE.Vector3(0, 0, 0);
    const nodej = new THREE.Vector3(localAxis.x.x, localAxis.x.y, localAxis.x.z);
    const direction = "z";
    const load = {L1: 0.05, L2: 0.03,};
    const P1 = -1.0;
    const P2 = -1.2;

    // 分布荷重
    const arrow = this.loadEditor[ThreeLoadDistribute.id].create(
      nodei, nodej, localAxis, direction,
      load.L1, load.L2, P1, P2);

    this.DistributeLoadList.children.push(arrow);

    // this.myText.lookAt(localAxis.x);
    // 軸方向荷重や温度荷重
    // this.myText.rotateX(Math.PI/2);
    // this.myText.rotateY(cg_x);
    // this.myText.rotateZ(Math.PI/2);

    // 分布荷重 z軸
    // this.myText.rotateZ(Math.PI/2);
    // this.myText.rotateX(-Math.PI/2);
    // this.myText.rotateY(this.rotateX * Math.PI / 180);

    const group = this.myText;
    group.rotation.set(0,0,0);

    const XY = new Vector2(localAxis.x.x, localAxis.x.y).normalize();
    let A = Math.asin(XY.y)

    if (XY.x < 0) {
      A = Math.PI - A;
    }
    group.rotateZ(A);
    console.log(3, group.rotation);

    const lenXY = Math.sqrt(
      Math.pow(localAxis.x.x, 2) + Math.pow(localAxis.x.y, 2)
    );
    const XZ = new THREE.Vector2(lenXY, localAxis.x.z).normalize();
    group.rotateY(-Math.asin(XZ.y));
    if (localAxis.x.x === 0 && localAxis.x.y === 0) {
      // 鉛直の部材
      if (direction === "z") { group.rotateX(-Math.PI); }
    } else {
      if (direction === "z") { group.rotateX(-Math.PI / 2); }
    }


  }


  //初期化
  public OnInit(): void {

    const nodei = new THREE.Vector3(0, 0, 0);
    const nodej = new THREE.Vector3(1, 0, 0);
    const localAxis = this.three_member.localAxis(
      nodei.x, nodei.y, nodei.z, nodej.x, nodej.y, nodej.z, 0 );
    const direction = "z";
    const load = {L1: 0.05, L2: 0.03,};
    const P1 = -1.0;
    const P2 = -1.2;

    // 分布荷重
    const arrow = this.loadEditor[ThreeLoadDistribute.id].create(
      nodei, nodej, localAxis, direction,
      load.L1, load.L2, P1, P2);

    this.DistributeLoadList.name = "Load";
    this.DistributeLoadList.children.push(arrow);


    // Create:
    // this.myText = new Text()
    // this.scene.add(this.myText)
    // this.myText.text = 'Hello world!'
    // this.myText.fontSize = 0.2
    // this.myText.color = 0x9966FF
    // this.myText.sync()

    // canvasをtextureに載せ、さらにmaterialに載せる。
    const canvasTexture = new THREE.CanvasTexture(
      this.createCanvasForTexture(500, 500, 'Hello World!', 40)
    );
    this.createSprite(
      canvasTexture,
      new THREE.Vector3( 1, 1, 1 ),
      new THREE.Vector3( 0, 0, 0 )
    );

  }
  
  // spriteを作成し、sceneに追加
  private createSprite(texture: THREE.CanvasTexture, scale: Vector3, position: Vector3): void {
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(scale.x, scale.y, scale.z);
    sprite.position.set(position.x, position.y, position.z);

    this.scene.add(sprite);
  };

  private createCanvasForTexture(canvasWidth, canvasHeight, text, fontSize): HTMLCanvasElement {
    // 貼り付けるcanvasを作成。
    const canvasForText = document.createElement('canvas');
    const ctx = canvasForText.getContext('2d');
    ctx.canvas.width = canvasWidth;
    ctx.canvas.height = canvasHeight;
    // 透過率50%の青背景を描く
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    //
    ctx.fillStyle = 'black';
    ctx.font = `${fontSize}px serif`;
    ctx.fillText(
      text,
      // x方向の余白/2をx方向開始時の始点とすることで、横方向の中央揃えをしている。
      (canvasWidth - ctx.measureText(text).width) / 2,
      // y方向のcanvasの中央に文字の高さの半分を加えることで、縦方向の中央揃えをしている。
      canvasHeight / 2 + ctx.measureText(text).actualBoundingBoxAscent / 2
    );
    return canvasForText;
  };



}
