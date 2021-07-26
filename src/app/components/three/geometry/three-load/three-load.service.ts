import { Injectable } from "@angular/core";
import { SceneService } from "src/app/three/scene.service";

import * as THREE from "three";

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
    this.myText = new Text()
    this.scene.add(this.myText)

    // Set properties to configure:
    const p = this.loadEditor[ThreeLoadDistribute.id].getPoints(
      nodei, nodej, direction, load.L1, load.L2, P1, P2, 0.5);
    this.myText.text = 'Hello world!'
    this.myText.fontSize = 0.2
    this.myText.color = 0x9966FF
    this.myText.sync()

    this.myText.lookAt(localAxis.x);
    this.myText.rotateZ(Math.PI/2);
    this.myText.rotateX(-Math.PI/2);
    this.myText.rotateY(this.rotateX * Math.PI / 180);

    //this.guiEnable();
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
    const axiss = this.three_member.localAxis(0, 0, 0, new_position_x*2, new_position_y*2, new_position_z*2 ,0)

    //オブジェクトの再生成
    const nodei = new THREE.Vector3(0, 0, 0);
    const nodej = new THREE.Vector3(axiss.x.x, axiss.x.y, axiss.x.z);
    const direction = "z";
    const load = {L1: 0.05, L2: 0.03,};
    const P1 = -1.0;
    const P2 = -1.2;

    // 分布荷重
    const arrow = this.loadEditor[ThreeLoadDistribute.id].create(
      nodei, nodej, axiss, direction,
      load.L1, load.L2, P1, P2);

    this.DistributeLoadList.children.push(arrow);

    const cg_x = Math.PI + this.rotateX * Math.PI / 180;
    

    this.myText.lookAt(axiss.x);
    // 軸方向荷重や温度荷重
    // this.myText.rotateX(Math.PI/2);
    // this.myText.rotateY(cg_x);
    // this.myText.rotateZ(Math.PI/2);

    // 分布荷重 z軸
    this.myText.rotateZ(Math.PI/2);
    this.myText.rotateX(-Math.PI/2);
    this.myText.rotateY(this.rotateX * Math.PI / 180);
    
  }


}
