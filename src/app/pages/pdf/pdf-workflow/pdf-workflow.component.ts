import { Component } from '@angular/core';
import { UploadComponent } from '../upload/upload.component';
import { EditorComponent } from '../editor/editor.component';
import { ConvertidorComponent } from '../convertidor/convertidor.component';
import { PdfFile } from '../upload/upload.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

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
  uploadedFile: PdfFile | null = null;

  onFileUploaded(response: any) {
    console.log("Respuesta cruda del backend:", response);

    const saved = response.data.archivos_guardados[0];

    const file: PdfFile = {
      id: saved.saved_as,
      name: saved.filename,
      pages: 0,
      size: saved.size,
      tempPath: `${environment.apiUrl}/${saved.path.replace(/\\/g, "/")}`
    };

    console.log("Archivo preparado para Editor y Convertidor:", file);

    this.uploadedFile = file;  // 🔥 esto ya funciona correctamente
  }
}
