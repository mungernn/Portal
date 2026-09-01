import { shopAgreementDocumentRepository } from "../repositories/shopAgreementDocument.repository";
import { shopRepository } from "../repositories/shop.repository";
import { ApiError } from "../utils/ApiError";
import type { ShopAgreementDocumentMeta } from "../types/shop.types";

// The app's JSON body-parser limit is 10MB (see app.ts) - base64
// encoding a PDF grows its size by roughly a third, so 7MB raw stays
// safely under that limit with margin for the rest of the JSON
// payload, without needing to raise the global body-size limit (which
// would apply to every other endpoint too, not just this one).
const MAX_FILE_SIZE_BYTES = 7 * 1024 * 1024;

/** Validates and stores the signed agreement PDF for a shop - replaces any existing one (see the repository's upsert comment). */
export async function uploadShopAgreementDocument(
  shopNo: string,
  fileData: Buffer,
  fileName: string,
  uploadedBy: string,
): Promise<ShopAgreementDocumentMeta> {
  const shop = await shopRepository.findByShopNo(shopNo);
  if (!shop) throw ApiError.notFound(`Shop not found: ${shopNo}`);

  if (fileData.length === 0) throw ApiError.badRequest("The uploaded file appears to be empty.");
  if (fileData.length > MAX_FILE_SIZE_BYTES) {
    throw ApiError.badRequest(`File is too large - the limit is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`);
  }
  // %PDF magic bytes - a lightweight check that this is actually a PDF, not just a file renamed with a .pdf extension.
  const isPdf = fileData.length >= 4 && fileData.subarray(0, 4).toString("ascii") === "%PDF";
  if (!isPdf) throw ApiError.badRequest("Only PDF files are accepted.");

  return shopAgreementDocumentRepository.upsert(shopNo, fileData, fileName, fileData.length, uploadedBy);
}

export async function getShopAgreementDocumentMeta(shopNo: string): Promise<ShopAgreementDocumentMeta | null> {
  return shopAgreementDocumentRepository.findMetaByShopNo(shopNo);
}
