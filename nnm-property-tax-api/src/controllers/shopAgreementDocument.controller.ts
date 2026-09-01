import type { Request, Response } from "express";
import { z } from "zod";
import { uploadShopAgreementDocument, getShopAgreementDocumentMeta } from "../services/shopAgreementDocument.service";
import { shopAgreementDocumentRepository } from "../repositories/shopAgreementDocument.repository";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/ApiError";

const shopNoParamSchema = z.object({ shopNo: z.string().trim().min(1).max(32) });
const uploadBodySchema = z.object({
  fileName: z.string().trim().min(1),
  // Base64-encoded PDF bytes - this app has no multipart/file-upload
  // middleware set up, so the file travels as a string in the normal
  // JSON body, same as the CSV bulk-upload endpoints elsewhere.
  fileDataBase64: z.string().min(1),
});

/** POST /api/v1/shops/:shopNo/agreement-document - operator or admin (see requireOperatorOrAdmin on the route) - the operator processing the signed agreement at the counter is the natural person to upload its scan, though a shop-relevant admin can too. Replaces any existing document for this shop. */
export const postUploadShopAgreementDocument = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = shopNoParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid shop number");
  const bodyParsed = uploadBodySchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Invalid input", bodyParsed.error.flatten().fieldErrors);

  let fileData: Buffer;
  try {
    fileData = Buffer.from(bodyParsed.data.fileDataBase64, "base64");
  } catch {
    throw ApiError.badRequest("Could not decode the uploaded file.");
  }

  const uploadedBy = req.admin?.displayName ?? req.operator!.displayName;
  const meta = await uploadShopAgreementDocument(paramsParsed.data.shopNo, fileData, bodyParsed.data.fileName, uploadedBy);
  res.status(200).json({ document: meta });
});

/** GET /api/v1/shops/:shopNo/agreement-document - metadata only (no PDF bytes), for showing upload info on the shop detail page. */
export const getShopAgreementDocumentMetaHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = shopNoParamSchema.safeParse(req.params);
  if (!parsed.success) throw ApiError.badRequest("Invalid shop number");
  const meta = await getShopAgreementDocumentMeta(parsed.data.shopNo);
  res.status(200).json({ document: meta });
});

/** GET /api/v1/admin/shops/:shopNo/agreement-document/file - the actual PDF bytes, served inline for viewing/downloading. */
export const getShopAgreementDocumentFile = asyncHandler(async (req: Request, res: Response) => {
  const parsed = shopNoParamSchema.safeParse(req.params);
  if (!parsed.success) throw ApiError.badRequest("Invalid shop number");
  const doc = await shopAgreementDocumentRepository.findFullByShopNo(parsed.data.shopNo);
  if (!doc) throw ApiError.notFound("No agreement document has been uploaded for this shop.");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${doc.file_name.replace(/"/g, "")}"`);
  res.status(200).send(doc.file_data);
});
