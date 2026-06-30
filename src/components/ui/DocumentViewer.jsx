import React, { useEffect, useState } from 'react';
import { X, Download, FileText, Image, AlertCircle, Loader2 } from 'lucide-react';

/**
 * DocumentViewer
 * Modal de previsualización de documentos (PDF e imágenes).
 *
 * Props:
 *  - isOpen    {boolean}
 *  - onClose   {Function}
 *  - docMeta   {Object}    — metadatos: { id, name, type, unitNo, size, uploadedAt }
 *  - onLoad    {Function}  — async ({ id }) => { url, type } para cargar el blob
 *  - onDownload{Function}  — async (id) => void
 */
export function DocumentViewer({ isOpen, onClose, docMeta, onLoad, onDownload }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // Cargar blob cuando el modal abre
  useEffect(() => {
    if (!isOpen || !docMeta) return;

    let objectUrl = null;

    const load = async () => {
      setLoading(true);
      setError(null);
      setPreviewUrl(null);
      try {
        const result = await onLoad(docMeta.id);
        if (result) {
          objectUrl = result.url;
          setPreviewUrl(result.url);
        }
      } catch (e) {
        setError('No se pudo cargar el archivo para previsualización.');
      } finally {
        setLoading(false);
      }
    };

    load();

    // Revocar la URL al cerrar el modal
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
    };
  }, [isOpen, docMeta, onLoad]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !docMeta) return null;

  const isPDF   = docMeta.type === 'application/pdf';
  const isImage = docMeta.type?.startsWith('image/');
  const sizeKB  = docMeta.size ? (docMeta.size / 1024).toFixed(1) : '?';

  const uploadedDate = docMeta.uploadedAt
    ? new Date(docMeta.uploadedAt).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative z-10 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {isPDF
              ? <FileText size={20} className="text-rose-500 shrink-0" />
              : <Image size={20} className="text-blue-500 shrink-0" />
            }
            <div className="min-w-0">
              <h3 className="font-bold text-zinc-950 dark:text-zinc-50 text-sm truncate">
                {docMeta.name}
              </h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                Unidad {docMeta.unitNo} &nbsp;·&nbsp; {sizeKB} KB &nbsp;·&nbsp; {uploadedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            {/* Download button */}
            <button
              onClick={() => onDownload(docMeta.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              title="Descargar archivo"
            >
              <Download size={13} />
              Descargar
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center min-h-[300px]">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-zinc-400">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <p className="text-sm font-medium">Cargando documento...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center gap-3 text-zinc-400 p-8 text-center">
              <AlertCircle size={32} className="text-rose-500" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{error}</p>
              <button
                onClick={() => onDownload(docMeta.id)}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download size={13} />
                Descargar para abrir
              </button>
            </div>
          )}

          {previewUrl && !loading && isPDF && (
            <iframe
              src={previewUrl}
              title={docMeta.name}
              className="w-full h-full min-h-[600px] border-0"
              style={{ height: 'calc(92vh - 80px)' }}
            />
          )}

          {previewUrl && !loading && isImage && (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto"
                 style={{ maxHeight: 'calc(92vh - 80px)' }}>
              <img
                src={previewUrl}
                alt={docMeta.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
              />
            </div>
          )}

          {previewUrl && !loading && !isPDF && !isImage && (
            <div className="flex flex-col items-center gap-3 text-zinc-400 p-8 text-center">
              <FileText size={48} className="text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Vista previa no disponible para este tipo de archivo
              </p>
              <p className="text-xs text-zinc-400">{docMeta.type || 'Tipo desconocido'}</p>
              <button
                onClick={() => onDownload(docMeta.id)}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download size={13} />
                Descargar archivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
