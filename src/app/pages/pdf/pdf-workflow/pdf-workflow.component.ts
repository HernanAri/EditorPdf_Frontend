import { Component } from '@angular/core';
import { UploadComponent } from '../upload/upload.component';
import { EditorComponent } from '../editor/editor.component';
import { ConvertidorComponent } from '../convertidor/convertidor.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-workflow',
  standalone: true,
  imports: [UploadComponent, EditorComponent, ConvertidorComponent, FormsModule, CommonModule],
  templateUrl: './pdf-workflow.component.html',
  styleUrls: ['./pdf-workflow.component.scss']
})
export class PdfWorkflowComponent {
  uploadedFile: any = null;

  onFileUploaded(file: any) {
    this.uploadedFile = file;
  }
}
