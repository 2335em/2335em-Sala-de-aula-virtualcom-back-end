import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, requireTeacher } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import path from "path";

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const materials = await prisma.material.findMany({
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true
          }
        }
      }
    });
    return res.json(materials);
  } catch (error) {
    console.error("Erro ao listar materiais:", error);
    return res.status(500).json({ message: "Erro ao listar materiais." });
  }
});

router.post("/", authMiddleware, requireTeacher, upload.single("file"), async (req, res) => {
  try {
    const { title, type, url, classId } = req.body;

    if (!title || !type || !classId) {
      return res.status(400).json({ message: "Título, tipo e turma são obrigatórios." });
    }

    let fileUrl = url || null;
    let fileName = null;

    if (req.file) {
      fileUrl = "/uploads/" + req.file.filename;
      fileName = req.file.originalname;
    }

    const material = await prisma.material.create({
      data: {
        title,
        type,
        url: fileUrl,
        classId,
        fileName
      }
    });

    return res.status(201).json(material);
  } catch (error) {
    console.error("Erro ao criar material:", error);
    return res.status(500).json({ message: "Erro ao criar material." });
  }
});

router.put("/:id", authMiddleware, requireTeacher, upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, url, classId } = req.body;

    const updateData = {
      title,
      type,
      classId
    };

    if (req.file) {
      updateData.url = "/uploads/" + req.file.filename;
      updateData.fileName = req.file.originalname;
    } else if (url !== undefined) {
      updateData.url = url || null;
    }

    const material = await prisma.material.update({
      where: { id },
      data: updateData
    });

    return res.json(material);
  } catch (error) {
    console.error("Erro ao atualizar material:", error);
    return res.status(500).json({ message: "Erro ao atualizar material." });
  }
});

router.get("/:id/download", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id }
    });

    if (!material || !material.url) {
      return res.status(404).json({ message: "Arquivo não encontrado." });
    }

    const filePath = path.join(process.cwd(), "uploads", path.basename(material.url));

    res.setHeader("Content-Disposition", `attachment; filename="${material.fileName || path.basename(material.url)}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.sendFile(filePath);
  } catch (error) {
    console.error("Erro ao baixar material:", error);
    return res.status(500).json({ message: "Erro ao baixar material." });
  }
});

router.delete("/:id", authMiddleware, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id }
    });

    if (material && material.url) {
      const fs = await import("fs");
      const filePath = path.join(process.cwd(), "uploads", path.basename(material.url));
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.warn("Arquivo não encontrado para exclusão:", filePath);
      }
    }

    await prisma.material.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir material:", error);
    return res.status(500).json({ message: "Erro ao excluir material." });
  }
});

export default router;
