import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EngineComponent } from './engine/engine.component';
import { MaterialModule } from '../material.module';
import { SplashLoaderComponent } from './splash-loader/splash-loader.component';

@NgModule({
  declarations: [EngineComponent, SplashLoaderComponent],
  imports: [CommonModule, MaterialModule],
  exports: [EngineComponent, SplashLoaderComponent],
})
export class UIModule {}
