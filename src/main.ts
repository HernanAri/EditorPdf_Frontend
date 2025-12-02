import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';
import { importProvidersFrom } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(DragDropModule)
  ]
});


bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
