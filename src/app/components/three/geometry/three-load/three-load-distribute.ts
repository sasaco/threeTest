import { Injectable } from "@angular/core";
import * as THREE from "three";
import { Vector2 } from "three";

import { Text } from 'troika-three-text'

@Injectable({
  providedIn: "root",
})
export class ThreeLoadDistribute {
  static id = 'DistributeLoad';

  private face_mat_Red: THREE.MeshBasicMaterial;
  private face_mat_Green: THREE.MeshBasicMaterial;
  private face_mat_Blue: THREE.MeshBasicMaterial;

  private line_mat_Red: THREE.LineBasicMaterial;
  private line_mat_Green: THREE.LineBasicMaterial;
  private line_mat_Blue: THREE.LineBasicMaterial;
  private face_mat_Pick: THREE.MeshBasicMaterial
  private line_mat_Pick: THREE.LineBasicMaterial;

  constructor() {
    /*this.face_mat_Red = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xff0000,
      opacity: 0.3,
    });
    this.face_mat_Green = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      color: 0x00ff00,
      opacity: 0.3,
    });*/
    this.face_mat_Blue = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      color: 0x0000ff,
      opacity: 0.3,
    });
    //this.line_mat_Red = new THREE.LineBasicMaterial({ color: 0xff0000, vertexColors: true });
    //this.line_mat_Green = new THREE.LineBasicMaterial({ color: 0x00ff00, vertexColors: true });
    this.line_mat_Blue = new THREE.LineBasicMaterial({ color: 0x0000ff, vertexColors: true });
    //this.line_mat_Pick = new THREE.LineBasicMaterial({ color: 0xff0000, vertexColors: true });
    //this.face_mat_Pick = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, side: THREE.DoubleSide, opacity: 0.3 });
  }



  /// 等分布荷重を編集する
  // target: 編集対象の荷重,
  // nodei: 部材始点,
  // nodej: 部材終点,
  // localAxis: 部材座標系
  // direction: 荷重の向き(wy, wz, wgx, wgy, wgz)
  // L1: 始点からの距離
  // L2: 終点からの距離
  // P1: 始点側の荷重値
  // P2: 終点側の荷重値
  // row: 対象荷重が記述されている行数
  // offset: 配置位置（その他の荷重とぶつからない位置）
  // scale: スケール
  public create(nodei: THREE.Vector3, nodej: THREE.Vector3, localAxis: any,
    direction: string, pL1: number, pL2: number, P1: number, P2: number): THREE.Group {

    const offset: number = 0;
    const height: number = 0.5;

    // // 線の色を決める
    // //const my_color = this.getColor(direction);
    const my_color = 0x0000ff;

    const child = new THREE.Group();

    // // 長さを決める
    const p = this.getPoints(nodei, nodej, direction, pL1, pL2, P1, P2, height);
    const points: THREE.Vector3[] = p.points;

    // // 面
    child.add(this.getFace(my_color, points));

    // // 線
    child.add(this.getLine(my_color, points));

    // // 全体
    child.name = "child";
    child.position.y = offset;

    const group0 = new THREE.Group();
    group0.add(child);
    group0.name = "group";

    const group = new THREE.Group();
    group.add(group0);
    group["points"] = p.points;
    group["L1"] = p.L1;
    group["L"] = p.L;
    group["L2"] = p.L2;
    group["P1"] = P1;
    group["P2"] = P2;
    group["nodei"] = nodei;
    group["nodej"] = nodej;
    group["direction"] = direction;
    group["localAxis"] = localAxis;
    group["editor"] = this;
    group["value"] = p.P2;

    // // 全体の向きを修正する
    const XY = new Vector2(localAxis.x.x, localAxis.x.y).normalize();
    let A = Math.asin(XY.y)

    if (XY.x < 0) {
      A = Math.PI - A;
    }
    group.rotateZ(A);

    const lenXY = Math.sqrt(
      Math.pow(localAxis.x.x, 2) + Math.pow(localAxis.x.y, 2)
    );
    const XZ = new Vector2(lenXY, localAxis.x.z).normalize();
    group.rotateY(-Math.asin(XZ.y));
    if (localAxis.x.x === 0 && localAxis.x.y === 0) {
      // 鉛直の部材
      if (direction === "z") { group.rotateX(-Math.PI); }
    } else {
      if (direction === "z") { group.rotateX(-Math.PI / 2); }
    }

    // // 全体の位置を修正する
    group.position.set(nodei.x, nodei.y, nodei.z);

    // 例：DistributeLoad-3-y
    //group.name = ThreeLoadDistribute.id + "-" + row.toString() + '-' + direction.toString();

    return group;
  }

  // 座標
  private getPoints(
    nodei: THREE.Vector3,
    nodej: THREE.Vector3,
    direction: string,
    pL1: number,
    pL2: number,
    P1: number,
    P2: number,
    height: number
  ): any {
    const len = nodei.distanceTo(nodej);

    let LL: number = len;

    const L1 = (pL1 * len) / LL;
    const L2 = (pL2 * len) / LL;
    const L: number = len - L1 - L2;

    // 荷重原点
    let y0 = 0;

    // 荷重の各座標
    let x1 = L1;
    let x3 = L1 + L;
    let x2 = (x1 + x3) / 2;

    // y座標 値の大きい方が１となる
    const Pmax = Math.abs(P1) > Math.abs(P2) ? P1 : P2;

    let bigP = Math.abs(Pmax);
    const y1 = (P1 / bigP) * height + y0;
    const y3 = (P2 / bigP) * height + y0;
    let y2 = (y1 + y3) / 2;

    const sg1 = Math.sign(P1);
    const sg2 = Math.sign(P2);
    if (sg1 !== sg2 && sg1 * sg2 !== 0) {
      const pp1 = Math.abs(P1);
      const pp2 = Math.abs(P2);
      x2 = (L * pp1) / (pp1 + pp2) + x1;
      y2 = 0;
    }

    return {
      points: [
        new THREE.Vector3(x1, y0, 0),
        new THREE.Vector3(x1, y1, 0),
        new THREE.Vector3(x2, y2, 0),
        new THREE.Vector3(x3, y3, 0),
        new THREE.Vector3(x3, y0, 0),
      ],
      L1,
      L,
      L2,
      Pmax,
    };
  }

  // 面
  private getFace(my_color: number, points: THREE.Vector3[]): THREE.Mesh {
    let face_mat: THREE.MeshBasicMaterial;
    face_mat = this.face_mat_Blue;
    
    const face_geo = new THREE.Geometry();
    face_geo.vertices = points;

    face_geo.faces.push(new THREE.Face3(0, 1, 2));
    face_geo.faces.push(new THREE.Face3(2, 3, 4));
    face_geo.faces.push(new THREE.Face3(0, 2, 4));

    const mesh = new THREE.Mesh(face_geo, face_mat);
    mesh.name = "face";
    return mesh;
  }

  // 枠線
  private getLine(my_color: number, points: THREE.Vector3[]): THREE.Line {
    const line_mat = new THREE.LineBasicMaterial({ color: my_color });

    const line_geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(line_geo, line_mat);
    line.name = "line";

    return line;
  }

  // 大きさを反映する
  public setSize(group: any, scale: number): void {
    for (const item of group.children) {
      item.scale.set(1, scale, scale);
    }
  }


}
