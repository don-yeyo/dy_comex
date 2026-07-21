import React, { useState, useRef } from 'react';
import { UploadCloud, Camera, Trash2, Eye, Image as ImageIcon, AlertCircle } from 'lucide-react';

/**
 * Compresor de imagen usando HTML5 Canvas.
 * Redimensiona a un máximo de 800px de ancho y exporta en JPEG 70% calidad.
 */
const compressFile = (file) => {
  return new Promise((resolve, reject) => {
    if (file.type && !file.type.startsWith('image/')) {
      return reject(new Error('El archivo debe ser una imagen.'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: Math.round(dataUrl.length * 0.75), // Tamaño aproximado en bytes
          dataUrl
        });
      };
      img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Componente Pro Uploader Multi-Archivo con Drag & Drop, Cámara y Previsualización.
 * 
 * Props:
 *   value: string (JSON array de objetos de imagen o dataUrls) o Array
 *   onChange: (val: string) => void
 *   maxFiles: number (default: 5)
 */
export default function ProImageUploader({ value, onChange, maxFiles = 5 }) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const fileInputRef = useRef(null);

  // Parsear imágenes del prop value
  const parseImages = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => {
          if (typeof item === 'string') {
            return { id: String(idx), name: `Foto ${idx + 1}.jpg`, dataUrl: item };
          }
          return item;
        });
      }
      return [{ id: '1', name: 'Foto 1.jpg', dataUrl: String(val) }];
    } catch {
      return [{ id: '1', name: 'Foto 1.jpg', dataUrl: String(val) }];
    }
  };

  const images = parseImages(value);

  const updateImages = (newImages) => {
    if (onChange) {
      if (newImages.length === 0) {
        onChange(null);
      } else {
        onChange(JSON.stringify(newImages));
      }
    }
  };

  const handleFiles = async (fileList) => {
    setErrorMsg(null);
    const files = Array.from(fileList);
    if (files.length === 0) return;

    if (images.length + files.length > maxFiles) {
      setErrorMsg(`Podés subir un máximo de ${maxFiles} fotos por registro.`);
      return;
    }

    try {
      const processed = await Promise.all(files.map(f => compressFile(f)));
      const updated = [...images, ...processed];
      updateImages(updated);
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error al procesar las imágenes.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (id) => {
    const updated = images.filter(img => img.id !== id);
    updateImages(updated);
  };

  return (
    <div className="pro-uploader-wrapper">
      {/* Dropzone Container */}
      <div
        className={`pro-uploader-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
        <div className="pro-uploader-icon">
          <UploadCloud size={28} />
        </div>
        <div className="pro-uploader-text">
          <strong>Arrastrá y soltá fotos aquí</strong> o tocá para buscar
        </div>
        <div className="pro-uploader-sub">
          Podés subir o sacar fotos desde tu celular/cámara (Máx. {maxFiles} fotos en JPG/PNG)
        </div>
      </div>

      {errorMsg && (
        <div className="pro-uploader-error">
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      {/* Grid de Previsualización */}
      {images.length > 0 && (
        <div className="pro-uploader-grid">
          {images.map((img) => (
            <div key={img.id} className="pro-uploader-card">
              <img src={img.dataUrl} alt={img.name || 'Foto'} className="pro-uploader-thumb" />
              <div className="pro-uploader-actions">
                <button
                  type="button"
                  className="pro-uploader-btn view"
                  onClick={(e) => { e.stopPropagation(); setLightboxImage(img.dataUrl); }}
                  title="Ver imagen completa"
                >
                  <Eye size={13} />
                </button>
                <button
                  type="button"
                  className="pro-uploader-btn remove"
                  onClick={(e) => { e.stopPropagation(); handleRemove(img.id); }}
                  title="Eliminar foto"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="pro-uploader-name">{img.name || 'Foto'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="modal-backdrop" onClick={() => setLightboxImage(null)} style={{ zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' }}>
          <div style={{ position: 'relative', maxWidth: '92vw', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightboxImage} alt="Vista previa" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
            <button
              type="button"
              className="icon-btn"
              onClick={() => setLightboxImage(null)}
              style={{ position: 'absolute', top: -12, right: -12, background: 'var(--surface)', borderRadius: '50%', padding: 6, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
