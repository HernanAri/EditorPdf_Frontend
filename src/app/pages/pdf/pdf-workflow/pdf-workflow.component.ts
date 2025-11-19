import { Component } from '@angular/core';
import { UploadComponent, PdfFile } from '../upload/upload.component';
import { EditorComponent } from '../editor/editor.component';
import { ConvertidorComponent } from '../convertidor/convertidor.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-workflow',
  standalone: true,
  imports: [
    UploadComponent,
    EditorComponent,
    ConvertidorComponent,
    FormsModule,
    CommonModule
  ],
  templateUrl: './pdf-workflow.component.html',
  styleUrls: ['./pdf-workflow.component.scss']
})
export class PdfWorkflowComponent {

  // Ahora es un ARRAY porque tu upload es múltiple
  uploadedFiles: PdfFile[] = [];

  // Recibe una lista de archivos desde upload
  onFilesUploaded(files: PdfFile[]) {
    console.log("📥 Archivos recibidos del UploadComponent:", files);

    this.uploadedFiles = files;

    // Validación
    files.forEach(f => {
      if (!f.file) {
        console.error("❌ Falta el File real en:", f.name);
      }
    })
}
