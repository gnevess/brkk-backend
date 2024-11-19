import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { HttpException } from "@nestjs/common";
import { r2Client } from "./r2-client";

export async function bucketRemove(key: string) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        });

        await r2Client.send(command);
        return { message: `File ${key} deleted successfully` };
    } catch (error) {
        throw new HttpException(error.message, 500);
    }
}