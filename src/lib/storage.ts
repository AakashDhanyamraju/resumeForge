// Supabase S3 Storage Client
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { readdir, readFile, writeFile, mkdir, stat } from "fs/promises";
import { join, relative } from "path";
import { createReadStream } from "fs";
import { Readable } from "stream";

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

/**
 * Recursively uploads a directory to S3
 * @param localDir Absolute path to local directory
 * @param s3Prefix S3 prefix (folder path)
 */
export async function uploadDirectoryToS3(localDir: string, s3Prefix: string) {
    // Ensure s3Prefix ends with slash if it's a folder, or handle keys properly
    // Actually standard convention: s3Prefix = "templates/MyTemplate"

    async function walk(dir: string) {
        const files = await readdir(dir);
        for (const file of files) {
            const filePath = join(dir, file);
            const stats = await stat(filePath);

            if (stats.isDirectory()) {
                await walk(filePath);
            } else {
                const relativePath = relative(localDir, filePath);
                // Convert backslashes to forward slashes for S3 keys
                const s3Key = join(s3Prefix, relativePath).replace(/\\/g, "/");

                const fileContent = await readFile(filePath);

                // Determine content type roughly or default
                let contentType = "application/octet-stream";
                if (file.endsWith(".png")) contentType = "image/png";
                else if (file.endsWith(".jpg")) contentType = "image/jpeg";
                else if (file.endsWith(".tex")) contentType = "application/x-tex";
                else if (file.endsWith(".cls")) contentType = "application/x-tex";
                else if (file.endsWith(".ttf")) contentType = "font/ttf";
                else if (file.endsWith(".otf")) contentType = "font/otf";

                await s3Client.send(new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3Key,
                    Body: fileContent,
                    ContentType: contentType,
                    // Public read? Depends on bucket policy. Usually private for backend assets, 
                    // but we might want images to be public. For now keeping private/default 
                    // unless we specifically need public access. 
                    // Template preview images were public-read. 
                    // These assets are for backend compilation, so S3 default is fine (accessed via credentials).
                }));
                console.log(`Uploaded to S3: ${s3Key}`);
            }
        }
    }

    await walk(localDir);
}

/**
 * Downloads a directory from S3 to local filesystem
 * @param s3Prefix S3 prefix (folder path)
 * @param localDir Absolute path to local destination
 */
export async function downloadDirectoryFromS3(s3Prefix: string, localDir: string) {
    // List all objects
    let isTruncated = true;
    let continuationToken: string | undefined;

    while (isTruncated) {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: s3Prefix,
            ContinuationToken: continuationToken,
        });

        const response = await s3Client.send(command);

        if (response.Contents) {
            for (const obj of response.Contents) {
                if (!obj.Key) continue;

                // Compute local path
                // Remove prefix from key to get relative path
                // e.g. Key: templates/MyTemplate/fonts/font.ttf
                // s3Prefix: templates/MyTemplate
                // relative: /fonts/font.ttf

                // Ensure s3Prefix matches start of Key
                if (!obj.Key.startsWith(s3Prefix)) continue;

                const relativePath = obj.Key.substring(s3Prefix.length);
                // If relativePath starts with /, remove it
                const cleanRelative = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;

                if (!cleanRelative) continue; // It's the folder itself if S3 has folder object

                const localPath = join(localDir, cleanRelative);

                // Ensure parent directory exists
                const parentDir = join(localPath, "..");
                await mkdir(parentDir, { recursive: true });

                // Download
                const getCmd = new GetObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: obj.Key,
                });

                const getRes = await s3Client.send(getCmd);
                if (getRes.Body) {
                    // Convert stream to buffer
                    const buffer = Buffer.from(await getRes.Body.transformToByteArray());
                    await writeFile(localPath, buffer);
                }
            }
        }

        isTruncated = response.IsTruncated || false;
        continuationToken = response.NextContinuationToken;
    }
}

export { s3Client, BUCKET_NAME, SUPABASE_STORAGE_URL };
