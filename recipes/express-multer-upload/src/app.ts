import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 }, // 1 MB
  fileFilter: (_req, file, cb) => cb(null, ["image/png", "image/jpeg"].includes(file.mimetype)),
});

export function createApp() {
  const app = express();
  app.post("/avatar", upload.single("avatar"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "png_or_jpeg_required" });
    res.status(201).json({ name: req.file.originalname, size: req.file.size, type: req.file.mimetype });
  });
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) return res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: err.code });
    res.status(500).json({ error: "internal" });
  });
  return app;
}
