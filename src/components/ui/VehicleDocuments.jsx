import React, { useRef, useState } from 'react';
import { useVehicleDocs } from '../../hooks/useVehicleDocs';
import { DocumentViewer } from './DocumentViewer';
import {
  Upload, FileText, Image, File, Download, Trash2,
  Eye, Loader2, AlertCircle, FolderOpen, Plus
} from 'lucide-react';

// Mapa de tipo MIME → ícono y color
function FileIcon({ type }) {
  if (type === 'application/pdf')     return <FileText size={14} className="text-rose-500 shrink-0" />;
  if (type?.startsWith('image/'))     return <Image    size={14} className="text-blue-500  shrink-0" />;
  return <File size={14} className="text-zinc-400 shrink-0" />;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// Tipos de archivo permitidos
const ACCEPT = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/tiff',
].join(',');

/**
 * VehicleDocuments
 * Sección de documentos adjuntos dentro del SidePanel de un vehículo.
 *
 * Props:
 *  - vehicle     {Object}    — datos del vehículo seleccionado
 *  - permissions {Object}    — { isAdmin, isOperator }
 */
export function VehicleDocuments({ vehicle, permissions }) {
  const { docs, loading, uploading, error, upload, remove, download, preview } =
    useVehicleDocs(vehicle?.vin, vehicle?.unitNo);

  const fileInputRef     = useRef(null);
  const [dragging, setDragging]       = useState(false);
  const [viewerOpen, setViewerOpen]   = useState(false);
  const [viewerDoc, setViewerDoc]     = useState(null);

  // ── Manejadores de Drag & Drop ──────────────────────────────────────────────
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const handleDragLeave = ()  => setDragging(false);
  const handleDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) upload(files);
  };

  // ── Subir por input ─────────────────────────────────────────────────────────
  const handleFileInput = (e) => {
    if (e.target.files?.length > 0) upload(e.target.files);
    e.target.value = '';  // Reset para poder subir el mismo archivo otra vez
  };

  // ── Previsualizar ────────────────────────────────────────────────────────────
  const handlePreview = (doc) => {
    setViewerDoc({ ...doc, unitNo: vehicle.unitNo });
    setViewerOpen(true);
  };

  const handleViewerLoad = async (id) => {
    return await preview(id);
  };

  // ── Eliminar con confirmación ────────────────────────────────────────────────
  const handleDelete = (doc) => {
    if (window.confirm(`¿Eliminar el documento "${doc.name}"?`)) {
      remove(doc.id);
    }
  };

  if (!vehicle) return null;

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
          <FolderOpen size={14} />
          Registraciones ({docs.length})
        </h4>
        {permissions.isOperator && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={11} />
            Subir
          </button>
        )}
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Drag & Drop Zone — solo para operador/admin */}
      {permissions.isOperator && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 ${
            dragging
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20 scale-[1.01]'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={22} className="animate-spin text-blue-500" />
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Subiendo...</p>
            </>
          ) : (
            <>
              <Upload size={20} className={dragging ? 'text-blue-500' : 'text-zinc-400'} />
              <div className="text-center">
                <p className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Arrastra aquí o haz clic para subir
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  PDF, JPG, PNG — múltiples archivos permitidos
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-lg text-xs text-rose-700 dark:text-rose-400">
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !docs.length && (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Document list */}
      {!loading && docs.length > 0 && (
        <div className="space-y-2">
          {docs.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:bg-white dark:hover:bg-zinc-900/80 transition-colors group"
            >
              <FileIcon type={doc.type} />

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {doc.name}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {formatSize(doc.size)} &nbsp;·&nbsp; {formatDate(doc.uploadedAt)}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Preview */}
                <button
                  onClick={() => handlePreview(doc)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
                  title="Ver documento"
                >
                  <Eye size={13} />
                </button>

                {/* Download */}
                <button
                  onClick={() => download(doc.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
                  title={`Descargar como ${vehicle.unitNo}_registration.pdf`}
                >
                  <Download size={13} />
                </button>

                {/* Delete — solo operador/admin */}
                {permissions.isOperator && (
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    title="Eliminar documento"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && docs.length === 0 && (
        <div className="py-6 flex flex-col items-center gap-2 text-center">
          <FolderOpen size={28} className="text-zinc-300 dark:text-zinc-700" />
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            Sin documentos adjuntos
          </p>
          {permissions.isOperator && (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
              Usa el área de arriba para subir la registración
            </p>
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={viewerOpen}
        onClose={() => { setViewerOpen(false); setViewerDoc(null); }}
        docMeta={viewerDoc}
        onLoad={handleViewerLoad}
        onDownload={download}
      />
    </div>
  );
}
