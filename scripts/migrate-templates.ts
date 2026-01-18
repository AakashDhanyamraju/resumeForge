
import { PrismaClient } from "@prisma/client";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const prisma = new PrismaClient();

async function main() {
    const templatesDir = join(process.cwd(), "templates");
    const files = await readdir(templatesDir);
    const texFiles = files.filter(f => f.endsWith(".tex"));

    console.log(`Found ${texFiles.length} templates to migrate.`);

    for (const file of texFiles) {
        const name = file.replace(".tex", ""); // e.g., "classy-green"
        const content = await readFile(join(templatesDir, file), "utf-8");

        // Check if it already exists
        const existing = await prisma.template.findUnique({
            where: { name }
        });

        if (existing) {
            console.log(`Template ${name} already exists. Skipping...`);
            continue;
        }

        console.log(`Migrating ${name}...`);
        try {
            await prisma.template.create({
                data: {
                    name,
                    content,
                    isActive: true,
                    description: `Standard ${name.replace(/-/g, ' ')} template`,
                }
            });
            console.log(`Successfully migrated ${name}`);
        } catch (error) {
            console.error(`Failed to migrate ${name}:`, error);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
