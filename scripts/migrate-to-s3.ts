
import { uploadDirectoryToS3 } from "../src/lib/storage";
import { readdir, stat } from "fs/promises";
import { join } from "path";

async function main() {
    const templatesDir = join(process.cwd(), "templates");
    console.log(`Scanning ${templatesDir} for directories to migrate...`);

    const files = await readdir(templatesDir);

    for (const file of files) {
        const filePath = join(templatesDir, file);
        const stats = await stat(filePath);

        if (stats.isDirectory()) {
            console.log(`Found template directory: ${file}`);
            const s3Prefix = `templates/${file}`;
            console.log(`Migrating to s3://${process.env.SUPABASE_S3_BUCKET}/${s3Prefix}...`);

            try {
                await uploadDirectoryToS3(filePath, s3Prefix);
                console.log(`✅ Successfully migrated ${file}`);
            } catch (error) {
                console.error(`❌ Failed to migrate ${file}:`, error);
            }
        }
    }

    console.log("Migration complete.");
}

main().catch(console.error);
