"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Camera, Loader2, Trash2, X } from "lucide-react";
import { fetchAssetPhotos, uploadAssetPhoto, deleteAssetPhoto, fetchAssetPhotoBlob, type AssetPhotoMeta } from "@/lib/attendance-api";

const IDENTIFICATION_SLOTS: { type: string; label: string }[] = [
  { type: "front", label: "Front" },
  { type: "rear", label: "Rear" },
  { type: "left", label: "Left side" },
  { type: "right", label: "Right side" },
  { type: "number_plate", label: "Number plate" },
  { type: "chassis_engine_plate", label: "Chassis/engine plate" },
];

const MAX_PHOTO_BYTES = 500 * 1024; // hard cap, must match the backend's enforced limit

/** Reads a File as a data URL. */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(file);
  });
}

/** Loads an image element from a data URL. */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image."));
    img.src = dataUrl;
  });
}

/** Draws an image onto a canvas at the given max dimension (preserving aspect ratio) and returns a JPEG data URL at the given quality. */
function drawToJpegDataUrl(img: HTMLImageElement, maxDimension: number, quality: number): string {
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process this image.");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Reads a File, compressing it down to (at most) MAX_PHOTO_BYTES if
 * it's above that threshold - a photo under the limit is uploaded
 * as-is, untouched. Compression re-encodes as JPEG, first by lowering
 * quality and then, if that alone isn't enough, by also shrinking the
 * image's dimensions - repeating with progressively lower settings
 * until it fits or a reasonable attempt limit is reached. Returns raw
 * base64 (no data-URL prefix) ready for upload, and the final byte
 * size actually used, so the caller can surface it if compression
 * still couldn't bring an unusually large or complex image under the
 * cap even at the lowest attempted settings.
 */
async function compressImageToBase64(file: File): Promise<{ base64: string; mimeType: string; sizeBytes: number }> {
  const originalDataUrl = await readFileAsDataUrl(file);
  const stripPrefix = (dataUrl: string) => dataUrl.slice(dataUrl.indexOf(",") + 1);
  const base64ByteLength = (b64: string) => Math.ceil((b64.length * 3) / 4);

  if (file.size <= MAX_PHOTO_BYTES) {
    return { base64: stripPrefix(originalDataUrl), mimeType: file.type, sizeBytes: file.size };
  }

  const img = await loadImage(originalDataUrl);
  const attempts: { maxDimension: number; quality: number }[] = [
    { maxDimension: 1600, quality: 0.8 },
    { maxDimension: 1600, quality: 0.6 },
    { maxDimension: 1200, quality: 0.6 },
    { maxDimension: 1200, quality: 0.4 },
    { maxDimension: 900, quality: 0.4 },
    { maxDimension: 900, quality: 0.3 },
    { maxDimension: 640, quality: 0.3 },
  ];

  let best: { dataUrl: string; bytes: number } | null = null;
  for (const { maxDimension, quality } of attempts) {
    const dataUrl = drawToJpegDataUrl(img, maxDimension, quality);
    const bytes = base64ByteLength(stripPrefix(dataUrl));
    if (!best || bytes < best.bytes) best = { dataUrl, bytes };
    if (bytes <= MAX_PHOTO_BYTES) break;
  }

  if (!best) throw new Error("Could not compress this photo.");
  return { base64: stripPrefix(best.dataUrl), mimeType: "image/jpeg", sizeBytes: best.bytes };
}

function Thumbnail({ photoId }: { photoId: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    fetchAssetPhotoBlob(photoId).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  if (!url) return <div className="flex h-24 w-full items-center justify-center rounded-md bg-slate-100 text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-24 w-full rounded-md object-cover" />;
}

/**
 * Photographs & Evidence (Module 11) - the 6 fixed identification
 * shots, plus any additional evidence photos. A photo can only be
 * uploaded once the asset exists (the DB row needs asset_id), so this
 * section is only usable after the asset has been created/selected -
 * matching how the rest of the baseline survey form already works.
 */
export function AssetPhotoSection({ assetId }: { assetId: number }) {
  const [photos, setPhotos] = useState<AssetPhotoMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  function load() {
    fetchAssetPhotos(assetId)
      .then(setPhotos)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load photos."));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  async function handleFileSelected(photoType: string, file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploadingSlot(photoType);
    try {
      const { base64, mimeType } = await compressImageToBase64(file);
      const fileName = mimeType === "image/jpeg" && !file.name.toLowerCase().endsWith(".jpg") && !file.name.toLowerCase().endsWith(".jpeg")
        ? file.name.replace(/\.[^.]+$/, "") + ".jpg"
        : file.name;
      await uploadAssetPhoto(assetId, { photoType, fileName, mimeType, fileDataBase64: base64 });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload this photo.");
    } finally {
      setUploadingSlot(null);
    }
  }

  async function handleDelete(photoId: number) {
    if (!window.confirm("Delete this photo?")) return;
    setError(null);
    try {
      await deleteAssetPhoto(photoId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this photo.");
    }
  }

  const photosByType = (type: string) => (photos ?? []).filter((p) => p.photo_type === type);

  return (
    <div>
      {error && (
        <div role="alert" className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!photos ? (
        <p className="text-xs text-slate-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {IDENTIFICATION_SLOTS.map((slot) => {
            const existing = photosByType(slot.type)[0];
            return (
              <div key={slot.type}>
                <label className="mb-1 block text-xs font-medium text-slate-600">{slot.label}</label>
                {existing ? (
                  <div className="relative">
                    <Thumbnail photoId={existing.id} />
                    <button
                      type="button"
                      onClick={() => handleDelete(existing.id)}
                      className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow hover:bg-white"
                      aria-label="Delete photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-slate-300 text-slate-400 hover:border-nnm-blue hover:text-nnm-blue">
                    {uploadingSlot === slot.type ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Camera className="h-5 w-5" />
                        <span className="text-[10px]">Upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      disabled={uploadingSlot !== null}
                      onChange={(e) => handleFileSelected(slot.type, e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}

      {photos && photosByType("other").length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-600">Additional photos</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photosByType("other").map((p) => (
              <div key={p.id} className="relative">
                <Thumbnail photoId={p.id} />
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow hover:bg-white"
                  aria-label="Delete photo"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <label className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-nnm-blue hover:underline">
        <Camera className="h-3.5 w-3.5" />
        Add another photo
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileSelected("other", e.target.files?.[0])} />
      </label>
    </div>
  );
}
