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

  uploadedFiles: PdfFile[] = [];
  archivosSeleccionados: PdfFile | null = null;

  // Recibe una lista de archivos desde upload
  onFilesUploaded(files: PdfFile[]) {
    console.log("📥 Archivos recibidos del UploadComponent:", files);

    this.uploadedFiles = files;
    this.archivosSeleccionados = files.length > 0 ? files[0] : null;
    
    // Validación
    files.forEach(f => {
      if (!f.file) {
        console.error("❌ Falta el File real en:", f.name);
      }
    });
  }

  selectFile(file: PdfFile) {
    this.archivosSeleccionados = file;
  }
}