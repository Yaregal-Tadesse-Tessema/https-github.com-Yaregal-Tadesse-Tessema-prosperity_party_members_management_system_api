import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

async function initMinio() {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true,
  });

  const bucketName = 'prosperityparty';

  try {
    console.log('Checking if bucket exists...');
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log('Bucket already exists');
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log('Bucket does not exist, creating...');
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log('Bucket created successfully');
    } else {
      console.error('Error checking bucket:', error);
      throw error;
    }
  }
}

initMinio().catch(console.error);
