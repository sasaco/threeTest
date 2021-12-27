import { Injectable } from '@angular/core';
import { SceneService } from "../../../three/scene.service";

import * as THREE from "three";

import * as createGeometry from "three-bmfont-text";
import * as loadFont from "load-bmfont";

@Injectable({
  providedIn: 'root'
})
export class ThreeBitmapFontsService {

  constructor(private scene: SceneService) {

  }

  public OnInit(){
    
    // var createGeometry = require('three-bmfont-text');
    // var loadFont = require('load-bmfont');
    console.log("Aaa");
    /*
    loadFont('fnt/DejaVu-sdf.fnt', function(err, font) {
      // create a geometry of packed bitmap glyphs, 
      // word wrapped to 300px and right-aligned
      var geometry = createGeometry({
        width: 300,
        align: 'right',
        font: font
      })
    
      // change text and other options as desired
      // the options sepcified in constructor will
      // be used as defaults
      geometry.update('Lorem ipsum\nDolor sit amet.')
      
      // the resulting layout has metrics and bounds
      console.log(geometry.layout.height)
      console.log(geometry.layout.descender)
        
      // the texture atlas containing our glyphs
      var textureLoader = new THREE.TextureLoader();
      textureLoader.load('fnt/DejaVu-sdf.png', function (texture) {
        // we can use a simple ThreeJS material
        var material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          color: 0xaaffff
        })
    
        // now do something with our mesh!
        var mesh = new THREE.Mesh(geometry, material)


        this.scene.add(mesh);
      })
    })
    */
  }
}
