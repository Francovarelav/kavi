import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import vision from "@google-cloud/vision";
initializeApp();
const db = getFirestore();
const storage = getStorage();
const client = new vision.ImageAnnotatorClient();
// Export ElevenLabs webhook
export { searchCars } from "./elevenLabsWebhook.js";
async function updateRuleByStoragePath(storagePath, data) {
    const snap = await db.collection("rules").where("storagePath", "==", storagePath).limit(1).get();
    if (snap.empty)
        return;
    const docRef = snap.docs[0].ref;
    await docRef.set(data, { merge: true });
}
export const ocrOnRulesUpload = functions.storage
    .object()
    .onFinalize(async (object) => {
    const filePath = object.name || "";
    const contentType = object.contentType || "";
    if (!filePath.startsWith("rules/"))
        return;
    try {
        if (contentType.startsWith("image/")) {
            const [result] = await client.textDetection(`gs://${object.bucket}/${filePath}`);
            const text = result.fullTextAnnotation?.text?.trim() || "";
            await updateRuleByStoragePath(filePath, {
                contentText: text,
                status: "ready",
            });
            return;
        }
        if (contentType === "application/pdf") {
            const gcsSource = { uri: `gs://${object.bucket}/${filePath}` };
            const outputPrefix = `rules_ocr_output/${Date.now()}_${filePath.replace(/\//g, "_")}`;
            const gcsDestination = { uri: `gs://${object.bucket}/${outputPrefix}/` };
            const request = {
                requests: [
                    {
                        inputConfig: { mimeType: "application/pdf", gcsSource },
                        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
                        outputConfig: { gcsDestination, batchSize: 10 },
                    },
                ],
            };
            const [operation] = await client.asyncBatchAnnotateFiles(request);
            await operation.promise();
            const [files] = await storage.bucket(object.bucket).getFiles({ prefix: outputPrefix });
            let fullText = "";
            for (const f of files) {
                if (!f.name.endsWith(".json"))
                    continue;
                const [contents] = await f.download();
                const json = JSON.parse(contents.toString());
                const responses = json.responses || [];
                for (const r of responses) {
                    const t = r.fullTextAnnotation?.text;
                    if (t)
                        fullText += t + "\n";
                }
            }
            await updateRuleByStoragePath(filePath, {
                contentText: fullText.trim(),
                status: "ready",
            });
            return;
        }
        await updateRuleByStoragePath(filePath, {
            contentText: "",
            status: "ready",
        });
    }
    catch (err) {
        console.error("OCR error:", err);
        await updateRuleByStoragePath(filePath, {
            status: "ready",
            ocrError: true,
        });
    }
});
