const KycService = require('../services/kyc.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { uploadToS3 } = require('../utils/file_upload');

const submitKyc = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Extract fields from body (multipart may deliver strings)
  const rawDocumentType = req.body.documentType;
  const rawDocumentNumber = req.body.documentNumber;
  let documentType = rawDocumentType;
  let documentNumber = rawDocumentNumber?.trim() || null;
  let documentFiles = [];

  // If files are uploaded via multipart, they are already streamed to S3 by multer-s3
  if (Array.isArray(req.files) && req.files.length > 0) {
    documentFiles = req.files.map((file) => ({
      url: file.location,
      key: file.key,
      size: file.size,
      mimetype: file.mimetype,
      originalName: file.originalname
    }));
  } else {
    // Fallback: accept documentFiles from JSON body
    let rawDocumentFiles = req.body.documentFiles;
    if (typeof rawDocumentFiles === 'string') {
      try {
        rawDocumentFiles = JSON.parse(rawDocumentFiles);
      } catch (e) {
        throw new ApiError(400, 'Invalid documentFiles JSON');
      }
    }
    documentFiles = rawDocumentFiles;
  }

  if (!documentType || !documentFiles || !Array.isArray(documentFiles)) {
    throw new ApiError(400, 'Document type and files are required');
  }

  if (!['passport', 'national_id', 'driver_license', 'other'].includes(documentType)) {
    throw new ApiError(400, 'Invalid document type');
  }

  if (documentFiles.length === 0) {
    throw new ApiError(400, 'At least one document file is required');
  }

  const result = await KycService.submitKyc(userId, {
    documentType,
    documentNumber,
    documentFiles
  });

  res.status(201).json(
    new ApiResponse(201, result, 'KYC documents submitted successfully')
  );
});

const reviewKyc = asyncHandler(async (req, res) => {
  const { kycId } = req.params;
  const { status, rejectionReason, notes } = req.body;
  const reviewerId = req.user.id; // Assuming admin user

  if (!status) {
    throw new ApiError(400, 'Review status is required');
  }

  if (status === 'rejected' && !rejectionReason) {
    throw new ApiError(400, 'Rejection reason is required when rejecting KYC');
  }

  const result = await KycService.reviewKyc(kycId, {
    status,
    rejectionReason: rejectionReason?.trim(),
    notes: notes?.trim()
  }, reviewerId);

  res.status(200).json(
    new ApiResponse(200, result, `KYC ${status} successfully`)
  );
});

const getKycReviewQueue = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  if (page < 1 || limit < 1 || limit > 100) {
    throw new ApiError(400, 'Invalid pagination parameters');
  }

  const result = await KycService.getKycReviewQueue(page, limit);

  res.status(200).json(
    new ApiResponse(200, result, 'KYC review queue retrieved successfully')
  );
});

const getUserKycStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await KycService.getUserKycStatus(userId);

  res.status(200).json(
    new ApiResponse(200, result, 'KYC status retrieved successfully')
  );
});

const getKycById = asyncHandler(async (req, res) => {
  const { kycId } = req.params;
  const userId = req.user.id;

  const result = await KycService.getKycById(kycId, userId);

  res.status(200).json(
    new ApiResponse(200, result, 'KYC details retrieved successfully')
  );
});

const updateKycStatus = asyncHandler(async (req, res) => {
  const { kycId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (!status || !['under_review', 'pending'].includes(status)) {
    throw new ApiError(400, 'Invalid status. Must be under_review or pending');
  }

  const result = await KycService.updateKycStatus(kycId, status, userId);

  res.status(200).json(
    new ApiResponse(200, result, 'KYC status updated successfully')
  );
});

const getKycStatistics = asyncHandler(async (req, res) => {
  const result = await KycService.getKycStatistics();

  res.status(200).json(
    new ApiResponse(200, result, 'KYC statistics retrieved successfully')
  );
});

const resubmitKyc = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Extract fields from body (multipart may deliver strings)
  const rawDocumentType = req.body.documentType;
  const rawDocumentNumber = req.body.documentNumber;
  let documentType = rawDocumentType;
  let documentNumber = rawDocumentNumber?.trim() || null;
  let documentFiles = [];

  // If files are uploaded via multipart, they are already streamed to S3 by multer-s3
  if (Array.isArray(req.files) && req.files.length > 0) {
    documentFiles = req.files.map((file) => ({
      url: file.location,
      key: file.key,
      size: file.size,
      mimetype: file.mimetype,
      originalName: file.originalname
    }));
  } else {
    // Fallback: accept documentFiles from JSON body
    let rawDocumentFiles = req.body.documentFiles;
    if (typeof rawDocumentFiles === 'string') {
      try {
        rawDocumentFiles = JSON.parse(rawDocumentFiles);
      } catch (e) {
        throw new ApiError(400, 'Invalid documentFiles JSON');
      }
    }
    documentFiles = rawDocumentFiles;
  }

  if (!documentType || !documentFiles || !Array.isArray(documentFiles)) {
    throw new ApiError(400, 'Document type and files are required');
  }

  if (!['passport', 'national_id', 'driver_license', 'other'].includes(documentType)) {
    throw new ApiError(400, 'Invalid document type');
  }

  if (documentFiles.length === 0) {
    throw new ApiError(400, 'At least one document file is required');
  }

  const result = await KycService.resubmitKyc(userId, {
    documentType,
    documentNumber,
    documentFiles
  });

  res.status(201).json(
    new ApiResponse(201, result, 'KYC documents resubmitted successfully')
  );
});

const deleteKycDocument = asyncHandler(async (req, res) => {
  const { kycId } = req.params;
  const { fileKey } = req.body;
  const userId = req.user.id;

  if (!fileKey) {
    throw new ApiError(400, 'File key is required');
  }

  const result = await KycService.deleteKycDocument(kycId, fileKey, userId);

  res.status(200).json(
    new ApiResponse(200, result, 'KYC document deleted successfully')
  );
});

const getKycHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 1 || limit < 1 || limit > 50) {
    throw new ApiError(400, 'Invalid pagination parameters');
  }

  const result = await KycService.getKycHistory(userId, page, limit);

  res.status(200).json(
    new ApiResponse(200, result, 'KYC history retrieved successfully')
  );
});

module.exports = {
  submitKyc,
  reviewKyc,
  getKycReviewQueue,
  getUserKycStatus,
  getKycById,
  updateKycStatus,
  getKycStatistics,
  resubmitKyc,
  deleteKycDocument,
  getKycHistory
};