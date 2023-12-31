import { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";
import multer from "multer";

export class UploadMiddleware {
    upload(fields: { cover: string, audio: string }) {
        const storage = multer.diskStorage({
            destination: (
                req: Request,
                file: Express.Multer.File,
                callback: (error: Error | null, destination: string) => void
            ) => {
                // Determine the destination based on the field name
                const destination = fields.cover === file.fieldname
                    ? path.join(__dirname, "..", "uploads", "image")
                    : path.join(__dirname, "..", "uploads", "audio");

                callback(null, destination);
            },
            filename: (
                req: Request,
                file: Express.Multer.File,
                callback: (error: Error | null, destination: string) => void
            ) => {
                const uniqueSuffix = uuidv4();
                const fileExtension = path.extname(file.originalname);
                callback(null, `${uniqueSuffix}${fileExtension}`);
            },
        });
        const upload = multer({ storage: storage });

        // Use .fields() to accept multiple files with different field names
        return upload.fields([
            { name: fields.cover, maxCount: 1 }, // Cover image
            { name: fields.audio, maxCount: 1 }, // Audio file
        ]);
    }

    uploadCover() {
        const storage = multer.diskStorage({
            destination: (
                req: Request,
                file: Express.Multer.File,
                callback: (error: Error | null, destination: string) => void
            ) => {
                callback(null, path.join(__dirname, "..", "uploads", "image"));
            },
            filename: (
                req: Request,
                file: Express.Multer.File,
                callback: (error: Error | null, destination: string) => void
            ) => {
                const uniqueSuffix = uuidv4();
                const fileExtension = path.extname(file.originalname);
                callback(null, `${uniqueSuffix}${fileExtension}`);
            },
        });
        const upload = multer({ storage: storage });

        // Use .fields() to accept multiple files with different field names
        return upload.fields([
            { name: "cover", maxCount: 1 }, // Cover image
        ]);
    }
}
