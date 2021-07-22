import { Injectable } from "@angular/core";
import { SceneService } from "../../../three/scene.service";
import * as THREE from "three";
//import { ThreeLoadService } from "./three-load/three-load.service";

@Injectable({
  providedIn: "root",
})
export class ThreeMembersService {

  private geometry: THREE.CylinderBufferGeometry;

  public maxDistance: number;
  public minDistance: number;

  private memberList: THREE.Object3D;
  private axisList: THREE.Group[]; // 軸は、メンバーのスケールと関係ないので、分けて管理する
  private selectionItem: THREE.Object3D; // 選択中のアイテム
  private currentIndex: string;

  // 大きさを調整するためのスケール
  private rotateX: number;
  private rotateY: number;
  private rotateZ: number;
  private height: number;
  private params: any; // GUIの表示制御
  public gui: any;

  private group: any;

  constructor( private scene: SceneService,
               /*private three_load: ThreeLoadService*/) {

    this.geometry = new THREE.CylinderBufferGeometry();
    this.memberList = new THREE.Object3D();
    this.axisList = new Array();
    this.scene.add(this.memberList);
    this.currentIndex = null;

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
    this.gui = null;
  }

  // 初期化
  public OnInit(): void {
   
    const i = new THREE.Vector3(0,0,0);
    const j = new THREE.Vector3(1.0,0,0);;

    const v = new THREE.Vector3(j.x - i.x, j.y - i.y, j.z - i.z);
    const len: number = v.length();

    const x: number = (i.x + j.x) / 2;
    const y: number = (i.y + j.y) / 2;
    const z: number = (i.z + j.z) / 2;
    // 要素をシーンに追加
    const geometry = new THREE.CylinderBufferGeometry(0.01, 0.01, len, 5);
    //const geometry = new THREE.SphereBufferGeometry(0.02, 3, 3);

    // 要素をシーンに追加
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    mesh.name = "member";
    mesh.rotation.z = Math.acos(v.y / len);
    mesh.rotation.y = 0.5 * Math.PI + Math.atan2(v.x, v.z);
    mesh.position.set(x, y, z);

    this.memberList.children.push(mesh);
    this.memberList.name = "memberList";

    const cg = 0; // コードアングル 後で使う
    // ローカル座標を示す線を追加
    const group = new THREE.Group();
    const axis = this.localAxis(x, y, z, j.x, j.y, j.z, cg);
    const origin = new THREE.Vector3(x, y, z);
    const length = len * 0.2;

    // x要素軸
    const dirX = new THREE.Vector3(axis.x.x, axis.x.y, axis.x.z);
    const xline = new THREE.ArrowHelper(dirX, origin, length, 0xff0000);
    xline.name = "x";
    group.add(xline);
    // y要素軸
    const dirY = new THREE.Vector3(axis.y.x, axis.y.y, axis.y.z);
    const yline = new THREE.ArrowHelper(dirY, origin, length, 0x00ff00);
    yline.name = "y";
    group.add(yline);
    // z要素軸
    const dirZ = new THREE.Vector3(axis.z.x, axis.z.y, axis.z.z);
    const zline = new THREE.ArrowHelper(dirZ, origin, length, 0x0000ff);
    zline.name = "z";
    group.add(zline);

    group.name = mesh.name + "axis";
    group.visible = true;
    this.axisList.push(group);
    this.scene.add(group);


    //this.guiEnable();
  }

  // 要素の太さを決定する基準値
  public baseScale(): number {
    const scale = 1;
    return scale * 0.3;
  }

  // データが変更された時の処理
  public changeData(rotateZ, height): void {

    this.rotateZ = rotateZ;
    this.height = height;

    const i = new THREE.Vector3(0,0,0);
    const j = new THREE.Vector3(1.0,0,0);;
    const v = new THREE.Vector3(j.x - i.x, j.y - i.y, j.z - i.z);
    const len: number = v.length();

    const base_rotate_x = 0;
    const base_rotate_y = 0.5 * Math.PI + Math.atan2(v.x, v.z);
    const base_rotate_z = Math.acos(v.y / len);

    const cg_z = this.rotateZ * Math.PI / 180;

    const new_rotate_z = base_rotate_z - cg_z;

    //部材中央の点座標を入手
    const height_c = this.height / 2;
    let new_position_x = 0.5 * Math.sin(new_rotate_z);
    let new_position_y = 0.5 * Math.cos(new_rotate_z);
    let new_position_z = 0;
    const a = new_position_y / new_position_x; // y = axのaを算出
    new_position_x = Math.sqrt((0.5**2 - height_c**2) / (1 + a**2)) * Math.sign(new_position_x);
    new_position_y = Math.sqrt(Math.abs(0.5**2 - height_c**2 - new_position_x**2)) * Math.sign(new_position_y);
    new_position_z = height_c;

    this.memberList.children[0].position.x = new_position_x;
    this.memberList.children[0].position.y = new_position_y;
    this.memberList.children[0].position.z = new_position_z;

    if (this.height > 0) {
      const axiss = this.localAxis(0, 0, 0, new_position_x*2, new_position_y*2, new_position_z*2 ,0)
      const x = new_position_x + axiss.z.x;
      const y = new_position_y + axiss.z.y;
      const z = new_position_z + axiss.z.z;
      this.memberList.children[0].lookAt(x, y, z);
      this.axisList[0].lookAt(axiss.z.x, axiss.z.y, axiss.z.z);
      this.axisList[0].rotation.z += Math.PI / 2;
    } else if (this.height < 0) {
      const axiss = this.localAxis(0, 0, 0, new_position_x*2, new_position_y*2, new_position_z*2 ,0)
      const x = new_position_x + axiss.z.x;
      const y = new_position_y + axiss.z.y;
      const z = new_position_z + axiss.z.z;
      this.memberList.children[0].lookAt(x, y, z);
      this.memberList.children[0].rotation.z += Math.PI
      this.axisList[0].lookAt(axiss.z.x, axiss.z.y, axiss.z.z);
      this.axisList[0].rotation.z += Math.PI / 2 * 3;
    } else {
      this.memberList.children[0].rotation.x = base_rotate_x;
      this.memberList.children[0].rotation.y = base_rotate_y;
      this.memberList.children[0].rotation.z = new_rotate_z;
      this.axisList[0].rotation.x = 0;
      this.axisList[0].rotation.y = 0;
      this.axisList[0].rotation.z = cg_z;
    }
  }

  // guiを表示する
  /*public guiEnable(): void {
    if (this.gui !== null) {
      return;
    }
    
    this.gui = this.scene.gui.addFolder('try')
    this.gui.add(this.params, 'rotateZ', 0, 360)
      .step(10)
      .onChange((value) => {
        this.rotateZ = value;
        this.changeData();
        //this.three_load.changeData(this.rotateZ, this.height);
        this.scene.render();
    });
    this.gui.add(this.params, 'height', -1.0, 1.0)
      .step(0.1)
      .onChange((value) => {
        this.height = value;
        this.changeData();
        //this.three_load.changeData(this.rotateZ, this.height);
        this.scene.render();
    });
    this.gui.closed = false

  }*/


  // guiを非表示にする
  private guiDisable(): void {
    if (this.gui === null) {
      return;
    }
    this.scene.gui.remove(this.gui);
    this.gui = null;
  }

  // 部材座標軸を
  public localAxis( xi: number, yi: number, zi: number,
                    xj: number, yj: number, zj: number,
                    theta: number ): any {
    const xM: number[] = [1, 0, 0]; // x だけ1の行列
    const yM: number[] = [0, 1, 0]; // y だけ1の行列
    const zM: number[] = [0, 0, 1]; // z だけ1の行列

    // 座標変換ベクトル × 荷重ベクトル
    const t3 = this.tMatrix(xi, yi, zi, xj, yj, zj, theta);
    const tt = this.getInverse(t3);

    const X = new THREE.Vector3(
      tt[0][0] * xM[0] + tt[0][1] * xM[1] + tt[0][2] * xM[2],
      tt[1][0] * xM[0] + tt[1][1] * xM[1] + tt[1][2] * xM[2],
      tt[2][0] * xM[0] + tt[2][1] * xM[1] + tt[2][2] * xM[2],
    );
    const Y = new THREE.Vector3(
      tt[0][0] * yM[0] + tt[0][1] * yM[1] + tt[0][2] * yM[2],
      tt[1][0] * yM[0] + tt[1][1] * yM[1] + tt[1][2] * yM[2],
      tt[2][0] * yM[0] + tt[2][1] * yM[1] + tt[2][2] * yM[2],
    );
    const Z = new THREE.Vector3(
      tt[0][0] * zM[0] + tt[0][1] * zM[1] + tt[0][2] * zM[2],
      tt[1][0] * zM[0] + tt[1][1] * zM[1] + tt[1][2] * zM[2],
      tt[2][0] * zM[0] + tt[2][1] * zM[1] + tt[2][2] * zM[2],
    );
    const result = {
      x: X,
      y: Y,
      z: Z,
    };
    return result;
  }

  public tMatrix( xi: number, yi: number, zi: number,
                  xj: number, yj: number, zj: number,
                  theta: number ): any {

    const DX: number = xj - xi;
    const DY: number = yj - yi;
    const DZ: number = zj - zi;
    const EL: number = Math.sqrt(
      Math.pow(DX, 2) + Math.pow(DY, 2) + Math.pow(DZ, 2)
    );

    const ll: number = DX / EL;
    const mm: number = DY / EL;
    const nn: number = DZ / EL;

    const qq = Math.sqrt(Math.pow(ll, 2) + Math.pow(mm, 2));

    const t1: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const t2: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    // 座標変換ベクトルを用意
    t1[0][0] = 1;
    t1[1][1] = Math.cos(theta);
    t1[1][2] = Math.sin(theta);
    t1[2][1] = -Math.sin(theta);
    t1[2][2] = Math.cos(theta);

    if (DX === 0 && DY === 0) {
      t2[0][2] = nn;
      t2[1][0] = nn;
      t2[2][1] = 1;
    } else {
      t2[0][0] = ll;
      t2[0][1] = mm;
      t2[0][2] = nn;
      t2[1][0] = -mm / qq;
      t2[1][1] = ll / qq;
      t2[2][0] = (-ll * nn) / qq;
      t2[2][1] = (-mm * nn) / qq;
      t2[2][2] = qq;
    }

    // 座標変換ベクトル × 荷重ベクトル
    const t3 = this.dot(t1, t2);

    return t3;
  }

  public dot(a: number[][], B: number[][]): number[][] {
    const u: number = a.length;

    const AB = Array(u)
      .fill(0)
      .map((x) => Array(u).fill(0));
    // 行列の計算を行う
    for (let i = 0; i < u; i++) {
      for (let j = 0; j < u; j++) {
        let sum = 0;
        for (let k = 0; k < u; k++) {
          sum = sum + a[i][k] * B[k][j];
        }
        AB[i][j] = sum;
      }
    }
    return AB;
  }

  private getInverse(t3: number[][]): number[][] {
    const m = t3.length;
    const n = t3[0].length;
    const tt = Array(m)
      .fill(0)
      .map((x) => Array(n).fill(0));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        tt[j][i] = t3[i][j];
      }
    }
    return tt;
  }

}
