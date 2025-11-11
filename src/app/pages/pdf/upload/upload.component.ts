import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: string;
  preview: SafeResourceUrl;
  pages: number;
  uploaded: boolean;
  tempPath?: string;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
  selectedFiles: PdfFile[] = [];
  selectedFile: PdfFile | null = null;
  errorMessages: string[] = [];
  isDragging = false;
  processing = false;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  handleDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  handleDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  // Selección de archivos
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
    }
  }

  // Procesar archivos
  private handleFiles(fileList: FileList) {
    this.errorMessages = [];
    const validFiles: PdfFile[] = [];

    Array.from(fileList).forEach((file) => {
      // Validar extensión
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        this.errorMessages.push(`❌ ${file.name} no es un archivo PDF válido.`);
        return;
      }

      // Validar tamaño (20 MB)
      if (file.size > 20 * 1024 * 1024) {
        this.errorMessages.push(`⚠️ ${file.name} excede el tamaño máximo de 20 MB.`);
        return;
      }

      // Crear objeto de archivo
      const pdfFile: PdfFile = {
        id: Date.now() + Math.random().toString(),
        file: file,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        preview: this.sanitizer.bypassSecurityTrustResourceUrl(
          URL.createObjectURL(file)
        ),
        pages: 0, // Se actualizará después de subir
        uploaded: false
      };

      validFiles.push(pdfFile);
    });

    this.selectedFiles = [...this.selectedFiles, ...validFiles];
  }

  // Seleccionar archivo para vista previa
  selectFile(file: PdfFile) {
    this.selectedFile = file;
  }

  // Remover archivo
  removeFile(id: string) {
    this.selectedFiles = this.selectedFiles.filter(f => f.id !== id);
    if (this.selectedFile?.id === id) {
      this.selectedFile = null;
    }
  }

  // Subir archivos
  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.errorMessages = ['❌ No hay archivos para subir.'];
      return;
    }

    this.processing = true;
    const formData = new FormData();

    this.selectedFiles.forEach((pdfFile) => {
      formData.append('file', pdfFile.file);
    });

    this.http.post<any>(`${environment.apiUrl}/pdf-file/subir`, formData)
      .subscribe({
        next: (response) => {
          console.log('Archivos subidos con éxito:', response);

          // Actualizar archivos con información del servidor
          if (response.files) {
            this.selectedFiles = this.selectedFiles.map((file, index) => ({
              ...file,
              uploaded: true,
              id: response.files[index]?.id || file.id,
              pages: response.files[index]?.pages || 0
            }));
          }

          alert('✅ Archivos subidos correctamente');
          this.processing = false;
        },
        error: (error) => {
          console.error('Error al subir archivos:', error);
          this.errorMessages = ['❌ Error al subir los archivos. Por favor, intenta nuevamente.'];
          this.processing = false;
        }
      });
  }

  // Funciones de edición
  rotateFile(degrees: number = 90) {
    if (!this.selectedFile) return;

    this.processing = true;
    this.http.post<any>(`${environment.apiUrl}/pdf-file/rotate`, {
      fileId: this.selectedFile.id,
      degrees: degrees
    }).subscribe({
      next: (response) => {
        console.log('PDF rotado:', response);
        alert('✅ PDF rotado correctamente');
        this.processing = false;
      },
      error: (error) => {
        console.error('Error al rotar:', error);
        alert('❌ Error al rotar PDF');
        this.processing = false;
      }
    });
  }

  splitFile() {
    if (!this.selectedFile) return;

    const pages = prompt('Ingrese las páginas a extraer (ej: 1-3, 5, 7-9):');
    if (!pages) return;

    this.processing = true;
    this.http.post<any>(`${environment.apiUrl}/pdf-file/split`, {
      fileId: this.selectedFile.id,
      pages: pages
    }).subscribe({
      next: (response) => {
        console.log('PDF dividido:', response);
        alert('✅ PDF dividido correctamente');
        this.processing = false;
      },
      error: (error) => {
        console.error('Error al dividir:', error);
        alert('❌ Error al dividir PDF');
        this.processing = false;
      }
    });
  }

  mergeFiles() {
    if (this.selectedFiles.length < 2) {
      alert('⚠️ Necesitas al menos 2 archivos para unir');
      return;
    }

    this.processing = true;
    const fileIds = this.selectedFiles.map(f => f.id);

    this.http.post<any>(`${environment.apiUrl}/pdf-file/merge`, {
      fileIds: fileIds
    }).subscribe({
      next: (response) => {
        console.log('PDFs unidos:', response);
        alert('✅ PDFs unidos correctamente');
        this.processing = false;
      },
      error: (error) => {
        console.error('Error al unir:', error);
        alert('❌ Error al unir PDFs');
        this.processing = false;
      }
    });
  }

  deletePages() {
    if (!this.selectedFile) return;

    const pages = prompt('Ingrese las páginas a eliminar (ej: 1, 3, 5-7):');
    if (!pages) return;

    this.processing = true;
    this.http.post<any>(`${environment.apiUrl}/pdf-file/delete-pages`, {
      fileId: this.selectedFile.id,
      pages: pages
    }).subscribe({
      next: (response) => {
        console.log('Páginas eliminadas:', response);
        alert('✅ Páginas eliminadas correctamente');
        this.processing = false;
      },
      error: (error) => {
        console.error('Error al eliminar páginas:', error);
        alert('❌ Error al eliminar páginas');
        this.processing = false;
      }
    });
  }

  convertToPDF() {
    // Implementar si necesitas convertir otros formatos a PDF
    alert('Función de conversión en desarrollo');
  }

  downloadFile() {
    if (!this.selectedFile) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(this.selectedFile.file);
    link.download = this.selectedFile.name;
    link.click();
  }
}
