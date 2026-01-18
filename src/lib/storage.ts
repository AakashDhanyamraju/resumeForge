// Supabase S3 Storage Client
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.SUPABASE_S3_REGION!,
    endpoint: `${process.env.SUPABASE_S3_ENDPOINT}/storage/v1/s3`,
    credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY!,
        secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY!,
    },
    forcePathStyle: true,
});

const BUCKET_NAME = process.env.SUPABASE_S3_BUCKET!;
const SUPABASE_STORAGE_URL = `${process.env.SUPABASE_S3_ENDPOINT}/storage/v1/object/public`;

export async function uploadTemplateImage(
    file: File,
    templateName: string
): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    // We use the template name exactly as is to match the frontend URL construction
    // e.g. src={`.../templates/${template.name}.png`}
    // So if templateName is "Professional Blue", image must be "Professional Blue.png"
    const key = `templates/${templateName}.png`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type || "image/png",
        ACL: "public-read",
    });

    await s3Client.send(command);

    return `${SUPABASE_STORAGE_URL}/${BUCKET_NAME}/${key}`;
}

export async function getTemplateImage(templateName: string) {
    const key = `templates/${templateName}.png`;
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    try {
        const response = await s3Client.send(command);
        return response.Body;
    } catch (error) {
        return null;
    }
}

export { s3Client, BUCKET_NAME, SUPABASE_STORAGE_URL };
