import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadComponent } from './upload/upload.component';
import { EditorComponent } from './editor/editor.component';
import { ConvertidorComponent } from './convertidor/convertidor.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    UploadComponent,
    EditorComponent,
    ConvertidorComponent,
    RouterModule
  ]
})
export class PdfModule {}
