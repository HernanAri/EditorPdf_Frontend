import { Component } from '@angular/core';
import { UploadComponent, PdfFile } from '../upload/upload.component';
import { EditorComponent } from '../editor/editor.component';
import { ConvertidorComponent } from '../convertidor/convertidor.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

type ToolMode = 'none' | 'editor' | 'convertidor';

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
  activeFile: PdfFile | null = null;
  selectedFile: PdfFile | null = null;
  currentTool: ToolMode = 'none';
  selectedFileIndex: number = 0;
  activeTool: 'editor' | 'convertidor' | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tool']) {
        this.activeTool = params['tool'];
      }
    });
  }

  onFilesUploaded(files: PdfFile[]) {
    this.uploadedFiles = files;
    
    if (files.length > 0) {
      this.selectedFile = files[0];
      this.selectedFileIndex = 0;
    }
    
    files.forEach(f => {
      if (!f.file) {
        console.error("❌ Falta el File real en:", f.name);
      }
    });
  }
  
  onFileSelected(file: PdfFile) {
  this.activeFile = file;
}

  selectFile(file: PdfFile, index: number) {
    this.selectedFile = file;
    this.selectedFileIndex = index;
  }

  openEditor() {
    if (this.uploadedFiles.length === 0) {
      alert('⚠️ Primero debes subir archivos PDF');
      return;
    }
    this.currentTool = 'editor';
  }

  openConverter() {
    if (this.uploadedFiles.length === 0) {
      alert('⚠️ Primero debes subir archivos PDF');
      return;
    }
    this.currentTool = 'convertidor';
  }

  closeTool() {
    this.currentTool = 'none';
  }
}