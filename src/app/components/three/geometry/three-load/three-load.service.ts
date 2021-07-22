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
    this.myText.rotation.x = Math.PI / 2;
    this.myText.rotation.z = Math.PI / 2;
    this.myText.color = 0x9966FF

    // Update the rendering:
    this.myText.sync()


    //this.guiEnable();
  }
  
  // three.component から終了時に呼ばれる メモリリークの解消処理
  /*private dispose(): void {
    for( const item of this.ThreeTextObject.children){
      this.ThreeTextObject.remove(item);
      if(item.name === 'text'){
        const text: Text = item;
        text.dispose();
      }
    }
  }*/

 

  /*// 荷重を再設定する
  public ClearData(): void {
    // 荷重を全部削除する
    for (const id of Object.keys(this.AllCaseLoadList)) {
      this.removeCase(id);
    }

    this.AllCaseLoadList = {};
    this.currentIndex = null;

    // 節点、部材データ
    this.nodeData = null;
    this.memberData = null;
    this.newNodeData = null;
    this.newMemberData = null;

    // このモジュールで保有する テキストを削除する
    this.dispose();
  }

  // ファイルを読み込むなど、りセットする
  public ResetData(): void {

    this.ClearData();

    // ファイルを開いたときの処理
    // 荷重を作成する
    for (const id of Object.keys(this.load.load)) {
      this.addCase(id);
    }

    // データを入手
    this.nodeData = this.node.getNodeJson(0);
    this.memberData = this.member.getMemberJson(0);

    // 格点データ
    this.newNodeData = null;
    if (Object.keys(this.nodeData).length <= 0) {
      return; // 格点がなければ 以降の処理は行わない
    }
    // 節点荷重データを入手
    const nodeLoadData = this.load.getNodeLoadJson(0);

    // 要素荷重データを入手
    const memberLoadData = this.load.getMemberLoadJson(0);

    // 荷重図を非表示のまま作成する
    for (const id of Object.keys(this.AllCaseLoadList)) {

      const LoadList = this.AllCaseLoadList[id];
      this.currentIndex = id; // カレントデータをセット

      // 節点荷重 --------------------------------------------
      if (id in nodeLoadData) {
        const targetNodeLoad = nodeLoadData[id];
        // 節点荷重の最大値を調べる
        this.setMaxNodeLoad(targetNodeLoad);
        // 節点荷重を作成する
        this.createPointLoad(
          targetNodeLoad,
          this.nodeData,
          LoadList.ThreeObject,
          LoadList.pointLoadList
        );
      }

      // 要素荷重 --------------------------------------------
      // 要素データを入手
      this.newMemberData = null;
      if (Object.keys(this.memberData).length > 0) {
        if (id in memberLoadData) {
          const targetMemberLoad = memberLoadData[id];
          // 要素荷重の最大値を調べる
          this.setMaxMemberLoad(targetMemberLoad);
          // 要素荷重を作成する
          this.createMemberLoad(
            targetMemberLoad,
            this.nodeData,
            this.memberData,
            LoadList.ThreeObject,
            LoadList.memberLoadList
          );
        }
      }

      // 重なりを調整する
      this.setOffset(id);
      // 重なりを調整する
      this.onResize(id);
    }

    this.currentIndex = '-1';
  }

  // 表示ケースを変更する
  public changeCase(changeCase: number): void {
    const id: string = changeCase.toString();

    if (this.currentIndex === id) {
      // 同じなら何もしない
      return;
    }

    if (changeCase < 1) {
      // 非表示にして終わる
      for (const key of Object.keys(this.AllCaseLoadList)) {
        const targetLoad = this.AllCaseLoadList[key];
        const ThreeObject: THREE.Object3D = targetLoad.ThreeObject;
        ThreeObject.visible = false;
      }
      this.scene.render();
      this.currentIndex = id;
      return;
    }

    // 初めての荷重ケースが呼び出された場合
    if (!(id in this.AllCaseLoadList)) {
      this.addCase(id);
    }

    // 荷重の表示非表示を切り替える
    for (const key of Object.keys(this.AllCaseLoadList)) {
      const targetLoad = this.AllCaseLoadList[key];
      const ThreeObject: THREE.Object3D = targetLoad.ThreeObject;
      ThreeObject.visible = key === id ? true : false;
    }

    // カレントデータをセット
    this.currentIndex = id;

    this.scene.render();
  }

  // ケースを追加する
  private addCase(id: string): void {
    const ThreeObject = new THREE.Object3D();
    ThreeObject.name = id;
    ThreeObject.visible = false; // ファイルを読んだ時点では、全ケース非表示
    this.AllCaseLoadList[id] = {
      ThreeObject,
      pointLoadList: {},
      memberLoadList: {},
      pMax: 0, // 最も大きい集中荷重値
      mMax: 0, // 最も大きいモーメント
      wMax: 0, // 最も大きい分布荷重
      rMax: 0, // 最も大きいねじり分布荷重
      qMax: 0  // 最も大きい軸方向分布荷重
    };

    this.scene.add(ThreeObject); // シーンに追加
  }

  //シートの選択行が指すオブジェクトをハイライトする
  public selectChange(index_row: number, index_column: number): void {
    const id: string = this.currentIndex;

    if (this.currentRow === index_row) {
      if (this.currentCol === index_column) {
        //選択行の変更がないとき，何もしない
        return
      }
    }

    const ThreeObject: THREE.Object3D = this.AllCaseLoadList[id].ThreeObject;
    // 一旦全てのテキストを削除
    this.dispose();

    for (let item of ThreeObject.children) {

      if(!('editor' in item)) continue;

      const editor = item['editor'];
      const column = ( index_column > 8) ?
        ['tx', 'ty', 'tz', 'rx', 'ry', 'rz'][index_column - 9] : '';

      const key = editor.id + '-' + index_row.toString() + '-' + column;

      if(item.name.indexOf(key) !== -1){
        editor.setColor(item, "select");
      } else {
        editor.setColor(item, "clear");
      }
    }

    this.currentRow = index_row;
    this.currentCol = index_column;

    setTimeout(() => {
      this.scene.render();
    }, 100);
  }

  // ケースの荷重図を消去する
  public removeCase(id: string): void {
    if (!(id in this.AllCaseLoadList)) {
      return;
    }

    const data = this.AllCaseLoadList[id];
    this.removeMemberLoadList(data);
    this.removePointLoadList(data);

    const ThreeObject = data.ThreeObject;
    this.scene.remove(ThreeObject);

    delete this.AllCaseLoadList[id];

    this.scene.render();
  }


  // 節点の入力が変更された場合 新しい入力データを保持しておく
  public changeNode(jsonData): void {
    this.newNodeData = jsonData;
  }

  // 要素の入力が変更された場合 新しい入力データを保持しておく
  public changeMember(jsonData): void {
    this.newMemberData = jsonData;
  }

  // 節点や要素が変更された部分を描きなおす
  public reDrawNodeMember(): void {

    if (this.newNodeData === null && this.newMemberData === null) {
      return;
    }

    // 格点の変わった部分を探す
    const changeNodeList = {};
    if(this.nodeData !== null ){
      if (this.newNodeData !== null) {
        for (const key of Object.keys(this.nodeData)) {
          if (!(key in this.newNodeData)) {
            // 古い情報にあって新しい情報にない節点
            changeNodeList[key] = 'delete';
          }
        }
        for (const key of Object.keys(this.newNodeData)) {
          if (!(key in this.nodeData)) {
            // 新しい情報にあって古い情報にない節点
            changeNodeList[key] = 'add';
            continue;
          }
          const oldNode = this.nodeData[key];
          const newNode = this.newNodeData[key];
          if (oldNode.x !== newNode.x || oldNode.y !== newNode.y || oldNode.z !== newNode.z) {
            changeNodeList[key] = 'change';
          }
        }
      }
    } 

    const changeMemberList = {};
    if(this.memberData !== null){
      // 部材の変わった部分を探す
      if (this.newMemberData !== null) {
        for (const key of Object.keys(this.memberData)) {
          if (!(key in this.newMemberData)) {
            // 古い情報にあって新しい情報にない節点
            changeMemberList[key] = 'delete';
          }
        }
        for (const key of Object.keys(this.newMemberData)) {
          if (!(key in this.memberData)) {
            // 新しい情報にあって古い情報にない節点
            changeMemberList[key] = 'add';
            continue;
          }
          const oldMember = this.memberData[key];
          const newMember = this.newMemberData[key];
          if (oldMember.ni !== newMember.ni ||
            oldMember.nj !== newMember.nj) {
            changeMemberList[key] = 'change';
          }
        }
      }
    }
    // 格点の変更によって影響のある部材を特定する
    const targetMemberData = (this.newMemberData !== null) ? this.newMemberData : this.memberData;
    for (const key of Object.keys(targetMemberData)) {
      const newMember = targetMemberData[key];
      if (newMember.ni in changeNodeList || newMember.nj in changeNodeList) {
        changeMemberList[key] = 'node change'
      }
    }

    // 荷重を変更する
    const oldIndex = this.currentIndex;
    this.nodeData = (this.newNodeData !== null) ? this.newNodeData : this.nodeData;
    this.memberData = (this.newMemberData !== null) ? this.newMemberData : this.memberData;
    // 荷重データを入手
    const nodeLoadData = this.load.getNodeLoadJson(0);
    const memberLoadData = this.load.getMemberLoadJson(0);
    // 荷重を修正
    for (const id of Object.keys(this.AllCaseLoadList)) {
      this.currentIndex = id;
      let editFlg = false;
      if (this.currentIndex in nodeLoadData) {
        for (const load of nodeLoadData[this.currentIndex]) {
          if (load.n.toString() in changeNodeList)
            this.changeNodeLode(load.row, nodeLoadData);
          editFlg = true;
        }
      }
      if (this.currentIndex in memberLoadData) {
        for (const load of memberLoadData[this.currentIndex]) {
          if (load.m.toString() in changeMemberList) {
            this.changeMemberLode(load.row, memberLoadData);
            editFlg = true;
          }
        }
      }
      if (editFlg === true) {
        this.setOffset();
        this.onResize();
      }
    }

    this.newNodeData = null;
    this.newMemberData = null;
    this.currentIndex = oldIndex;
  }*/

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

    const cg_x = this.rotateX * Math.PI / 180;
    const cg_z = this.rotateZ * Math.PI / 180;

    this.myText.rotation.x = Math.PI / 2;
    this.myText.rotation.z = Math.PI / 2;

    if (axiss.x.z > 0) {
      /* rotate ver.*/
      
      this.myText.rotation.y = (axiss.x.x === 0) ? 0 : 
                               (axiss.x.x  >  0) ? Math.atan(axiss.x.y / axiss.x.x) :
                               (axiss.x.x  <  0) ? Math.atan(axiss.x.y / axiss.x.x) + Math.PI : 0;
      this.myText.rotation.z += Math.atan(axiss.x.z / Math.sqrt(axiss.x.x**2+axiss.x.y**2));
      if (this.height === 1) this.myText.rotation.y = Math.PI / 2 * 3;
    } else if (axiss.x.z < 0) {
      /* rotate ver.*/
      this.myText.rotation.y = (axiss.x.x >= 0) ? Math.atan(axiss.x.y / axiss.x.x) :
                                                  Math.atan(axiss.x.y / axiss.x.x) + Math.PI ;
      if (axiss.x.x === 0) this.myText.rotation.y = Math.PI / 2 ; 
      this.myText.rotation.z += Math.atan(axiss.x.z / Math.sqrt(axiss.x.x**2+axiss.x.y**2));
    } else {
      /* lookAt ver.
      this.myText.lookAt(-axiss.y.x, -axiss.y.y, -axiss.y.z);
      this.myText.rotation.z += Math.PI/2;
      */

      /* rotate ver.*/
      this.myText.rotation.y = Math.atan(axiss.x.y / axiss.x.x);
      if (axiss.x.x < 0) this.myText.rotation.y += Math.PI;
    }
    this.myText.rotateY(cg_x)
    
  }

  /*// 節点荷重を変更
  private changeNodeLode(row: number, nodeLoadData: any): void {

    const LoadList = this.AllCaseLoadList[this.currentIndex];

    if (this.currentIndex in nodeLoadData) {
      // 節点荷重の最大値を調べる
      const tempNodeLoad = nodeLoadData[this.currentIndex];
      this.setMaxNodeLoad(tempNodeLoad);

      // 対象行(row) に入力されている部材番号を調べる
      const targetNodeLoad = tempNodeLoad.filter(load => load.row === row);

      this.removePointLoadList(LoadList, row);

      this.createPointLoad(
        targetNodeLoad,
        this.nodeData,
        LoadList.ThreeObject,
        LoadList.pointLoadList
      );
    } else {
      // ケースが存在しなかった
      this.removePointLoadList(LoadList);
      for (const key of Object.keys(LoadList.pointLoadList)) {
        LoadList.pointLoadList[key] = { tx: [], ty: [], tz: [], rx: [], ry: [], rz: [] };
      }
    }
  }


  // 要素荷重を変更
  private changeMemberLode(row: number, memberLoadData: any): void {

    const LoadList = this.AllCaseLoadList[this.currentIndex];

    if (this.currentIndex in memberLoadData) {
      // 対象業(row) に入力されている部材番号を調べる
      const tempMemberLoad = memberLoadData[this.currentIndex];
      // 要素荷重の最大値を調べる
      this.setMaxMemberLoad(tempMemberLoad);

      // 対象行(row) に入力されている部材番号を調べる
      const targetMemberLoad = tempMemberLoad.filter(load => load.row === row);
      // 同じ行にあった荷重を一旦削除
      this.removeMemberLoadList(LoadList, row);

      this.createMemberLoad(
        targetMemberLoad,
        this.nodeData,
        this.memberData,
        LoadList.ThreeObject,
        LoadList.memberLoadList
      );
    } else {
      // ケースが存在しなかった
      this.removeMemberLoadList(LoadList);
      for (const key of Object.keys(LoadList.memberLoadList)) {
        LoadList.memberLoadList[key] = { gx: [], gy: [], gz: [], x: [], y: [], z: [], t: [], r: [] };
      }
    }
  }

  // 要素荷重を削除する
  private removeMemberLoadList(LoadList, row = null): void {

    for (const key of Object.keys(LoadList.memberLoadList)) { 
      const list = LoadList.memberLoadList[key];
      for (const key2 of ["gx", "gy", "gz", "x", "y", "z", "t", "r"]) {
        for (let i = list[key2].length - 1; i >= 0; i--) {
          const item = list[key2][i];
          if(row !== null && item.row !== row) {
            continue;
          }
          LoadList.ThreeObject.remove(item);
          list[key2].splice(i, 1);
        }
      }
    }
  }

  
  

  // 要素荷重の矢印を描く
  private createMemberLoad(
    memberLoadData: any[],
    nodeData: object,
    memberData: object,
    ThreeObject: THREE.Object3D,
    memberLoadList: any
  ): void {

    if (memberLoadData === undefined) {
      return;
    }

    // memberLoadData情報を書き換える可能性があるので、複製する
    const targetMemberLoad = JSON.parse(
      JSON.stringify({
        temp: memberLoadData,
      })
    ).temp;

    // 分布荷重の矢印をシーンに追加する
    for (const load of targetMemberLoad) {
      // 部材データを集計する
      if (!(load.m in memberData)) {
        continue;
      }
      const mNo: string = load.m.toString();
      const m = memberData[mNo];
      // 節点データを集計する
      if (!(m.ni in nodeData && m.nj in nodeData)) {
        continue;
      }

      if (load.P1 === 0 && load.P2 === 0) {
        continue;
      }

      // 部材の座標軸を取得
      const i = nodeData[m.ni];
      const j = nodeData[m.nj];
      const nodei = new THREE.Vector3(i.x, i.y, i.z);
      const nodej = new THREE.Vector3(j.x, j.y, j.z);
      const localAxis = this.three_member.localAxis(
        i.x, i.y, i.z, j.x, j.y, j.z, m.cg);

      // リストに登録する
      const target =
        mNo in memberLoadList
          ? memberLoadList[mNo]
          : { localAxis, x: [], y: [], z: [], gx: [], gy: [], gz: [], r: [], t: [] };

      // 荷重値と向き -----------------------------------
      let P1: number = load.P1;
      let P2: number = load.P2;
      let direction: string = load.direction;
      if (direction === null || direction === undefined) {
        direction = '';
      } else {
        direction = direction.trim();
        direction = direction.toLowerCase();
      }
      if (localAxis.x.y === 0 && localAxis.x.z === 0) {
        //console.log(load.m, m, 'は x軸に平行な部材です')
        if (direction === "gx") direction = "x";
        if (direction === "gy") direction = "y";
        if (direction === "gz") direction = "z";
      } else if (localAxis.x.x === 0 && localAxis.x.z === 0) {
        //console.log(load.m, m, 'は y軸に平行な部材です')
        if (direction === "gx") {
          direction = "y";
          P1 = -P1;
          P2 = -P2;
        }
        if (direction === "gy") direction = "x";
        if (direction === "gz") direction = "z";
      } else if (localAxis.x.x === 0 && localAxis.x.y === 0) {
        //console.log(load.m, m, 'は z軸に平行な部材です')
        if (direction === "gx") {
          direction = "y";
          P1 = -P1;
          P2 = -P2;
        }
        if (direction === "gy") direction = "z";
        if (direction === "gz") {
          direction = "x";
          P1 = -P1;
          P2 = -P2;
        }
      }

      let arrow: THREE.Group = null;

      // 分布荷重 y, z -------------------------------
      // mark=2, direction=x
      if (load.mark === 2) {

            // 分布荷重
            arrow = this.loadEditor[ThreeLoadDistribute.id].create(
            nodei, nodej, localAxis,
            direction, load.L1, load.L2, P1, P2, load.row);

      // リストに登録する
      if (arrow === null) {
        continue
      };

      arrow["row"] = load.row;
      target[direction].push(arrow);
      ThreeObject.add(arrow);
      memberLoadList[mNo] = target;

    }
  }

  }*/
}
