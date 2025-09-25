const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const ApiError = require('./ApiError');

// AWS S3 configuration
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION
});

// Multer configuration for streaming directly to S3
const storage = multerS3({
  s3: s3Client,
  bucket: process.env.S3_BUCKET_NAME,
  acl: 'private',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const folder = 'kyc-documents';
    const fileName = `${folder}/${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, fileName);
  },
  metadata: (req, file, cb) => {
    cb(null, { originalName: file.originalname });
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new ApiError(400, 'Only .png, .jpg, .jpeg, and .pdf files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter
});

// Upload file to S3 (fallback for non-streaming/memory use cases)
const uploadToS3 = async (file, folder = 'kyc-documents') => {
  const fileName = `${folder}/${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
  
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private' // Private access - require signed URLs to view
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    const result = await s3Client.send(command);
    return {
      url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
      key: fileName,
      size: file.size,
      mimetype: file.mimetype,
      originalName: file.originalname
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new ApiError(500, 'File upload failed');
  }
};

// Generate signed URL for private file access
const generateSignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Signed URL Error:', error);
    throw new ApiError(500, 'Failed to generate file access URL');
  }
};

// Delete file from S3
const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    });
    await s3Client.send(command);
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new ApiError(500, 'Failed to delete file');
  }
};

module.exports = {
  upload,
  uploadToS3,
  generateSignedUrl,
  deleteFromS3
};