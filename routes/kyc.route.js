const express = require('express');
const kycController = require('../controllers/kyc.controller');
const { upload } = require('../utils/file_upload');
const { authenticate, requirePermission, requireRole } = require('../middlewares/auth.middleware');
const { validateKycSubmission, validateKycReview, validateKycStatusUpdate, validateDocumentDeletion } = require('../middlewares/validators/kyc.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User KYC routes - any authenticated user can submit and check their own status
router.post('/submit', upload.array('documents', 5), validateKycSubmission, kycController.submitKyc);
router.post('/resubmit', upload.array('documents', 5), validateKycSubmission, kycController.resubmitKyc);
router.get('/status', kycController.getUserKycStatus);
router.get('/history', kycController.getKycHistory);

// Admin KYC routes - require specific permissions for KYC review operations
router.get('/admin/review-queue', 
  requirePermission('kyc_verifications', 'read'),
  kycController.getKycReviewQueue
);

router.get('/admin/statistics', 
  requirePermission('kyc_verifications', 'read'),
  kycController.getKycStatistics
);

router.put('/admin/review/:kycId', 
  requirePermission('kyc_verifications', 'approve'), // This covers both approve and reject actions
  validateKycReview, 
  kycController.reviewKyc
);

router.put('/admin/status/:kycId', 
  requirePermission('kyc_verifications', 'update'),
  validateKycStatusUpdate,
  kycController.updateKycStatus
);

// User KYC detail routes - must come after admin routes to avoid conflicts
router.get('/:kycId', kycController.getKycById);

// User document management routes
router.delete('/:kycId/document', validateDocumentDeletion, kycController.deleteKycDocument);

module.exports = router;