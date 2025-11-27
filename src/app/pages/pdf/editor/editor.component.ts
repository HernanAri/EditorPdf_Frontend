import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PdfFile } from '../upload/upload.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnChanges {

  @Input() file: PdfFile | null = null;
  @Input() allFiles: PdfFile[] = [];
  @Output() closePreview = new EventEmitter<void>();

  previewUrl: SafeResourceUrl | null = null;
  currentBlobUrl: string | null = null;
  selectedFileIndex = 0;
  selectedPages = '';
  newOrder = '';
  rotationPage: number | null = null;
  errorMessage = '';
  successMessage = '';
  processing = false;
  loadingPreview = false;

  constructor(
    private http: HttpClient, 
    private sanitizer: DomSanitizer
  ) {}

  ngOnChanges(changes: SimpleChanges) {
  if (this.file?.id) {
    this.loadPdfPreview(this.file.id);
  }
}

private loadPdfPreview(fileId: string): void {
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  });

  this.http.get(
    `${environment.apiUrl}/pdf-file/preview/${fileId}`,
    { headers, responseType: 'blob' }
  ).subscribe({
    next: (blob: Blob) => {
      // Crear una URL local del blob
      const url = URL.createObjectURL(blob);
      this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      console.log('✅ Preview cargado correctamente');
    },
    error: (err) => {
      console.error('❌ Error al cargar preview:', err);
      this.errorMessage = '❌ No se pudo cargar la vista previa';
    }
  });
}

// No olvides limpiar la URL cuando el componente se destruya
ngOnDestroy() {
  if (this.previewUrl) {
    const url = (this.previewUrl as any).changingThisBreaksApplicationSecurity;
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}

  changePreview(file: PdfFile, index: number): void {
    this.file = file;
    this.selectedFileIndex = index;
    if (file.id) {
      this.loadPdfPreview(file.id);
    }
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  close(): void {
    this.closePreview.emit();
  }

  downloadFile(): void {
    if (!this.file?.id) return;
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http.get(
      `${environment.apiUrl}/pdf-file/obtener/${this.file.id}`,
      { headers, responseType: 'blob' }
    ).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.file?.name || 'archivo.pdf';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = '❌ Error al descargar el archivo';
      }
    });
  }

  rotateFile(degrees: number): void {
    this.rotationPage = 1;
    this.girarPagina();
  }

  splitFile(): void {
    this.dividirPDF();
  }

  mergeFiles(): void {
    this.unirPDFs();
  }

  deletePages(): void {
    this.eliminarPaginas();
  }

  reorderPages(): void {
    this.reorganizarPaginas();
  }

  unirPDFs(): void {
  if (!this.allFiles.length || this.allFiles.length < 2) {
    this.errorMessage = '⚠️ Se necesitan al menos 2 archivos para unir';
    return;
  }

  this.processing = true;
  this.clearMessages();

  const fileIds = this.allFiles.map(f => f.id);
  
  console.log('📤 Enviando IDs para unir:', fileIds);

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  this.http.post(
    `${environment.apiUrl3}/unir`,
    { archivos: fileIds },  // ← CAMBIAR "files" por "archivos"
    { headers, responseType: 'blob' }
  ).subscribe({
    next: (blob: Blob) => {
      console.log('✅ PDF unido recibido, descargando...');
      
      // Descargar el PDF unido
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pdf_unido.pdf';
      link.click();
      window.URL.revokeObjectURL(url);

      this.successMessage = '✅ PDFs unidos y descargados correctamente';
      this.processing = false;
    },
    error: (err) => {
      console.error('❌ Error al unir PDFs:', err);
      this.errorMessage = err.error?.detail || '❌ Error al unir los PDFs';
      this.processing = false;
    }
  });
}

  dividirPDF(): void {
    if (!this.file?.id || !this.selectedPages) return;

    this.processing = true;
    this.clearMessages();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http.post(
      `${environment.apiUrl3}/dividir-seleccion`,
      { fileId: this.file.id, paginas: this.selectedPages },
      { headers , responseType: 'blob' }
    ).subscribe({
      next: () => {
        this.successMessage = '✅ PDF dividido correctamente';
        this.processing = false;
      },
      error: () => {
        this.errorMessage = '❌ Error al dividir el PDF';
        this.processing = false;
      }
    });
  }

  girarPagina(): void {
    if (!this.file?.id || !this.rotationPage) return;

    this.processing = true;
    this.clearMessages();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http.post(
      `${environment.apiUrl3}/rotar`,
      { fileId: this.file.id, pagina: this.rotationPage },
      { headers }
    ).subscribe({
      next: () => {
        this.successMessage = '✅ Página girada correctamente';
        this.processing = false;
      },
      error: () => {
        this.errorMessage = '❌ Error al girar la página';
        this.processing = false;
      }
    });
  }

  eliminarPaginas(): void {
    if (!this.file?.id || !this.selectedPages) return;

    this.processing = true;
    this.clearMessages();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http.post(
      `${environment.apiUrl}/pdf-editor/eliminar`,
      { fileId: this.file.id, paginas: this.selectedPages },
      { headers }
    ).subscribe({
      next: () => {
        this.successMessage = '✅ Páginas eliminadas correctamente';
        this.processing = false;
      },
      error: () => {
        this.errorMessage = '❌ Error al eliminar páginas';
        this.processing = false;
      }
    });
  }

  reorganizarPaginas(): void {
    if (!this.file?.id || !this.newOrder) return;

    this.processing = true;
    this.clearMessages();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http.post(
      `${environment.apiUrl3}/reorganizar`,
      { fileId: this.file.id, nuevoOrden: this.newOrder },
      { headers }
    ).subscribe({
      next: () => {
        this.successMessage = '✅ Páginas reorganizadas correctamente';
        this.processing = false;
      },
      error: () => {
        this.errorMessage = '❌ Error al reorganizar las páginas';
        this.processing = false;
      }
    });
  }
}