import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';
import { importProvidersFrom } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(DragDropModule),
    provideHttpClient()
  ]
});


bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
