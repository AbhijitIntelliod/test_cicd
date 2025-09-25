const { Op } = require('sequelize');
const { sequelize, User, KycVerification } = require('../config/db.config');
const ApiError = require('../utils/ApiError');
const { generateSignedUrl } = require('../utils/file_upload');

class KycService {
  static async submitKyc(userId, kycData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { documentType, documentNumber, documentFiles } = kycData;

      // Check if user exists and is verified
      const user = await User.findOne({
        where: { 
          id: userId,
          status: 'active'
        }
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (!user.emailVerifiedAt) {
        throw new ApiError(400, 'Email must be verified before KYC submission');
      }

      // Check for existing pending/approved KYC
      const existingKyc = await KycVerification.findOne({
        where: {
          userId,
          status: { [Op.in]: ['pending', 'under_review', 'approved'] }
        }
      });

      if (existingKyc) {
        if (existingKyc.status === 'approved') {
          throw new ApiError(400, 'KYC already approved');
        }
        throw new ApiError(400, 'KYC submission already in progress');
      }

      // Create KYC verification record
      const kycVerification = await KycVerification.create({
        userId,
        documentType,
        documentNumber,
        documentFiles,
        status: 'pending'
      }, { transaction });

      await transaction.commit();

      return {
        id: kycVerification.id,
        status: kycVerification.status,
        submittedAt: kycVerification.submittedAt
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async reviewKyc(kycId, reviewData, reviewerId) {
    const transaction = await sequelize.transaction();
    
    try {
      const { status, rejectionReason, notes } = reviewData;

      if (!['approved', 'rejected'].includes(status)) {
        throw new ApiError(400, 'Invalid review status');
      }

      const kycVerification = await KycVerification.findOne({
        where: {
          id: kycId,
          status: { [Op.in]: ['pending', 'under_review'] }
        }
      });

      if (!kycVerification) {
        throw new ApiError(404, 'KYC verification not found or already reviewed');
      }

      // Update KYC verification
      await kycVerification.update({
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
        notes,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        updatedAt: new Date()
      }, { transaction });

      if (status === 'approved') {
        // Update user KYC status
        await User.update({
          isKycVerified: true,
          updatedAt: new Date()
        }, {
          where: { id: kycVerification.userId },
          transaction
        });
      }

      await transaction.commit();

      return {
        id: kycVerification.id,
        status: kycVerification.status,
        reviewedAt: kycVerification.reviewedAt
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getKycReviewQueue(page = 1, limit = 50) {
    const offset = (page - 1) * limit;

    const { rows: kycVerifications, count } = await KycVerification.findAndCountAll({
      where: {
        status: { [Op.in]: ['pending', 'under_review'] }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'fullName', 'phoneNumber']
      }],
      order: [['submittedAt', 'ASC']],
      limit,
      offset
    });

    // Generate signed URLs for document files
    const kycVerificationsWithSignedUrls = await Promise.all(
      kycVerifications.map(async (kyc) => {
        const kycData = kyc.toJSON();
        
        if (kycData.documentFiles && Array.isArray(kycData.documentFiles)) {
          kycData.documentFiles = await Promise.all(
            kycData.documentFiles.map(async (file) => {
              try {
                // Generate signed URL that expires in 1 week
                const signedUrl = await generateSignedUrl(file.key, 604800);
                return {
                  ...file,
                  url: signedUrl,
                  originalUrl: file.url // Keep original URL for reference
                };
              } catch (error) {
                console.error('Error generating signed URL for file:', file.key, error);
                return file; // Return original file if signed URL generation fails
              }
            })
          );
        }
        
        return kycData;
      })
    );

    return {
      kycVerifications: kycVerificationsWithSignedUrls,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    };
  }

  static async getUserKycStatus(userId) {
    const user = await User.findOne({
      where: { id: userId },
      include: [
        {
          model: KycVerification,
          as: 'kycVerifications',
          order: [['createdAt', 'DESC']],
          limit: 1
        }
      ]
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const latestKyc = user.kycVerifications?.[0];

    if (latestKyc && latestKyc.documentFiles && Array.isArray(latestKyc.documentFiles)) {
      latestKyc.documentFiles = await Promise.all(
        latestKyc.documentFiles.map(async (file) => {
          try {
            // Generate signed URL that expires in 1 week
            const signedUrl = await generateSignedUrl(file.key, 604800);
            return {
              ...file,
              url: signedUrl,
              originalUrl: file.url // Keep original URL for reference
            };
          } catch (error) {
            console.error('Error generating signed URL for file:', file.key, error);
            return file; // Return original file if signed URL generation fails
          }
        })
      );
    }

    return {
      userId: user.id,
      email: user.email,
      isKycVerified: user.isKycVerified,
      latestKyc: latestKyc || null
    };
  }

  static async getKycById(kycId, userId) {
    const kycVerification = await KycVerification.findOne({
      where: { id: kycId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'fullName']
      }]
    });

    if (!kycVerification) {
      throw new ApiError(404, 'KYC verification not found');
    }

    // Check if user can access this KYC (own KYC or admin)
    if (kycVerification.userId !== userId) {
      // Check if user is admin (this would need to be implemented based on your role system)
      throw new ApiError(403, 'Access denied');
    }

    const kycData = kycVerification.toJSON();

    // Generate signed URLs for document files
    if (kycData.documentFiles && Array.isArray(kycData.documentFiles)) {
      kycData.documentFiles = await Promise.all(
        kycData.documentFiles.map(async (file) => {
          try {
            const signedUrl = await generateSignedUrl(file.key, 604800);
            return {
              ...file,
              url: signedUrl,
              originalUrl: file.url
            };
          } catch (error) {
            console.error('Error generating signed URL for file:', file.key, error);
            return file;
          }
        })
      );
    }

    return kycData;
  }

  static async updateKycStatus(kycId, status, userId) {
    const kycVerification = await KycVerification.findOne({
      where: { id: kycId }
    });

    if (!kycVerification) {
      throw new ApiError(404, 'KYC verification not found');
    }

    // Only allow status updates for pending/under_review KYCs
    if (!['pending', 'under_review'].includes(kycVerification.status)) {
      throw new ApiError(400, 'Cannot update status of already reviewed KYC');
    }

    await kycVerification.update({
      status,
      updatedAt: new Date()
    });

    return {
      id: kycVerification.id,
      status: kycVerification.status,
      updatedAt: kycVerification.updatedAt
    };
  }

  static async getKycStatistics() {
    const stats = await KycVerification.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const totalCount = await KycVerification.count();
    
    // Get recent submissions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSubmissions = await KycVerification.count({
      where: {
        submittedAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Get average review time
    const reviewedKycs = await KycVerification.findAll({
      where: {
        status: { [Op.in]: ['approved', 'rejected'] },
        reviewedAt: { [Op.ne]: null }
      },
      attributes: ['submittedAt', 'reviewedAt']
    });

    let averageReviewTime = 0;
    if (reviewedKycs.length > 0) {
      const totalReviewTime = reviewedKycs.reduce((sum, kyc) => {
        const reviewTime = new Date(kyc.reviewedAt) - new Date(kyc.submittedAt);
        return sum + reviewTime;
      }, 0);
      averageReviewTime = Math.round(totalReviewTime / reviewedKycs.length / (1000 * 60 * 60)); // in hours
    }

    return {
      totalSubmissions: totalCount,
      recentSubmissions,
      averageReviewTimeHours: averageReviewTime,
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {})
    };
  }

  static async resubmitKyc(userId, kycData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { documentType, documentNumber, documentFiles } = kycData;

      // Check if user has a rejected KYC
      const rejectedKyc = await KycVerification.findOne({
        where: {
          userId,
          status: 'rejected'
        },
        order: [['createdAt', 'DESC']]
      });

      if (!rejectedKyc) {
        throw new ApiError(400, 'No rejected KYC found to resubmit');
      }

      // Check for existing pending/under_review KYC
      const existingKyc = await KycVerification.findOne({
        where: {
          userId,
          status: { [Op.in]: ['pending', 'under_review'] }
        }
      });

      if (existingKyc) {
        throw new ApiError(400, 'KYC submission already in progress');
      }

      // Create new KYC verification record
      const kycVerification = await KycVerification.create({
        userId,
        documentType,
        documentNumber,
        documentFiles,
        status: 'pending'
      }, { transaction });

      await transaction.commit();

      return {
        id: kycVerification.id,
        status: kycVerification.status,
        submittedAt: kycVerification.submittedAt
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async deleteKycDocument(kycId, fileKey, userId) {
    const { deleteFromS3 } = require('../utils/file_upload');
    
    const kycVerification = await KycVerification.findOne({
      where: { id: kycId }
    });

    if (!kycVerification) {
      throw new ApiError(404, 'KYC verification not found');
    }

    // Check if user can modify this KYC
    if (kycVerification.userId !== userId) {
      throw new ApiError(403, 'Access denied');
    }

    // Only allow deletion for pending/under_review KYCs
    if (!['pending', 'under_review'].includes(kycVerification.status)) {
      throw new ApiError(400, 'Cannot modify documents of already reviewed KYC');
    }

    const documentFiles = kycVerification.documentFiles;
    if (!Array.isArray(documentFiles) || documentFiles.length <= 1) {
      throw new ApiError(400, 'Cannot delete the last document');
    }

    // Find and remove the file
    const fileIndex = documentFiles.findIndex(file => file.key === fileKey);
    if (fileIndex === -1) {
      throw new ApiError(404, 'Document not found');
    }

    // Delete from S3
    try {
      await deleteFromS3(fileKey);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      // Continue with database update even if S3 deletion fails
    }

    // Update document files array
    const updatedFiles = documentFiles.filter(file => file.key !== fileKey);
    await kycVerification.update({
      documentFiles: updatedFiles,
      updatedAt: new Date()
    });

    return {
      id: kycVerification.id,
      remainingDocuments: updatedFiles.length
    };
  }

  static async getKycHistory(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { rows: kycVerifications, count } = await KycVerification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'documentType', 'status', 'submittedAt', 'reviewedAt', 'rejectionReason']
    });

    return {
      kycVerifications,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    };
  }
}

module.exports = KycService;
