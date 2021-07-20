import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SceneService } from './three/scene.service';
import { ThreeComponent } from './three/three.component';

@NgModule({
  declarations: [
    AppComponent,
    ThreeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    SceneService
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
