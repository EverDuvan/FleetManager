/**
 * useVehicleDocs.js
 * Hook React que expone CRUD de documentos para un vehículo específico.
 * Usa docStorage.js (IndexedDB) como capa de persistencia.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  saveDocument,
  getDocumentsByVin,
  deleteDocument,
  downloadDocument,
  createPreviewUrl,
} from '../utils/docStorage';

/**
 * @param {string|null} vin  — VIN del vehículo activo
 * @param {string}      unitNo — Número de unidad (para nombres de descarga)
 */
export function useVehicleDocs(vin, unitNo) {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [uploading, setUploading] = useState(false);

  // ── Cargar metadatos de documentos del vehículo activo ──
  const loadDocs = useCallback(async () => {
    if (!vin) { setDocs([]); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await getDocumentsByVin(vin);
      // Ordenar por más reciente primero
      result.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      setDocs(result);
    } catch (e) {
      setError('Error al cargar documentos: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [vin]);

  // Re-cargar cuando cambia el vehículo seleccionado
  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // ── Subir uno o más archivos ──
  const upload = useCallback(async (files) => {
    if (!vin || !files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await saveDocument(vin, unitNo, file);
      }
      await loadDocs();  // Refrescar lista
    } catch (e) {
      setError('Error al subir documento: ' + e.message);
    } finally {
      setUploading(false);
    }
  }, [vin, unitNo, loadDocs]);

  // ── Eliminar un documento ──
  const remove = useCallback(async (docId) => {
    setError(null);
    try {
      await deleteDocument(docId);
      setDocs(prev => prev.filter(d => d.id !== docId));
    } catch (e) {
      setError('Error al eliminar documento: ' + e.message);
    }
  }, []);

  // ── Descargar con nombre del vehículo ──
  const download = useCallback(async (docId) => {
    try {
      await downloadDocument(docId, unitNo);
    } catch (e) {
      setError('Error al descargar documento: ' + e.message);
    }
  }, [unitNo]);

  // ── Previsualizar (retorna URL temporal) ──
  const preview = useCallback(async (docId) => {
    try {
      return await createPreviewUrl(docId);
    } catch (e) {
      setError('Error al cargar vista previa: ' + e.message);
      return null;
    }
  }, []);

  return {
    docs,
    loading,
    uploading,
    error,
    upload,
    remove,
    download,
    preview,
    reload: loadDocs,
  };
}
