// Script to upload template preview images to Supabase S3 storage
import { S3Client, PutObjectCommand, ListBucketsCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const s3Client = new S3Client({
    region: "ap-southeast-1",
    endpoint: "https://bofeuhmhuhmsstiegeyp.supabase.co/storage/v1/s3",
    credentials: {
        accessKeyId: "d845a39c00e8d9c4c197ecd0a29b5c69",
        secretAccessKey: "5835b5b336b4efeb6aaaf9371082dff4c9b5bf5d37846c92543cec96517c5d76",
    },
    forcePathStyle: true, // Required for Supabase S3
});

const BUCKET_NAME = "ResumeForge";
const PREVIEWS_DIR = "./client/public/previews";

async function uploadImages() {
    try {
        console.log("Checking for existing buckets...");

        // List buckets to see what's available
        try {
            const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
            console.log("Available buckets:", bucketsResponse.Buckets?.map(b => b.Name).join(", ") || "None");
        } catch (e) {
            console.log("Could not list buckets (this is normal for Supabase)");
        }

        // Get all PNG files in the previews directory
        const files = readdirSync(PREVIEWS_DIR).filter(f => f.endsWith(".png"));
        console.log(`Found ${files.length} images to upload:`, files);

        for (const file of files) {
            const filePath = join(PREVIEWS_DIR, file);
            const fileContent = readFileSync(filePath);

            console.log(`Uploading ${file}...`);

            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: `templates/${file}`,
                Body: fileContent,
                ContentType: "image/png",
                ACL: "public-read", // Make images publicly accessible
            });

            await s3Client.send(command);
            console.log(`✓ Uploaded ${file}`);
        }

        console.log("\n✅ All images uploaded successfully!");
        console.log(`\nImages are available at:`);
        for (const file of files) {
            console.log(`  https://bofeuhmhuhmsstiegeyp.supabase.co/storage/v1/object/public/${BUCKET_NAME}/templates/${file}`);
        }
    } catch (error) {
        console.error("Upload error:", error);
        process.exit(1);
    }
}

uploadImages();
