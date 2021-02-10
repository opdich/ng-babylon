import { NgModule } from '@angular/core';

// Structural
import { PlatformModule } from '@angular/cdk/platform';
import { FlexLayoutModule } from '@angular/flex-layout';

// Atomic
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Effects
import { NgScrollbarModule } from 'ngx-scrollbar';

@NgModule({
  exports: [
    PlatformModule,
    FlexLayoutModule,
    MatButtonModule,
    MatIconModule,
    NgScrollbarModule,
    MatProgressSpinnerModule,
  ],
})
export class MaterialModule {}
