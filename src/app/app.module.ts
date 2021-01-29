import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { EngineModule } from './engine/engine.module';
import { SharedModule } from './shared/shared.module';
import { UIModule } from './ui/ui.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    EngineModule,
    SharedModule,
    UIModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
