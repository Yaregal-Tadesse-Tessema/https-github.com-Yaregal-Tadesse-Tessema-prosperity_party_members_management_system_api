"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
async function initMinio() {
    const s3Client = new client_s3_1.S3Client({
        region: 'us-east-1',
        endpoint: 'http://196.189.124.228:9000',
        credentials: {
            accessKeyId: 'L458FO8B14A0S02NAM6J',
            secretAccessKey: 'rhkZ6HrrxSuNbWmaE8UYJaCWKLTUkyepO9pUIX34',
        },
        forcePathStyle: true,
    });
    const bucketName = 'prosperityparty';
    try {
        console.log('Checking if bucket exists...');
        await s3Client.send(new client_s3_1.HeadBucketCommand({ Bucket: bucketName }));
        console.log('Bucket already exists');
    }
    catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            console.log('Bucket does not exist, creating...');
            await s3Client.send(new client_s3_1.CreateBucketCommand({ Bucket: bucketName }));
            console.log('Bucket created successfully');
        }
        else {
            console.error('Error checking bucket:', error);
            throw error;
        }
    }
}
initMinio().catch(console.error);
//# sourceMappingURL=init-minio.js.map