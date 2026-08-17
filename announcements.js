import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, requireTeacher } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
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
    return res.json(announcements);
  } catch (error) {
    console.error("Erro ao listar avisos:", error);
    return res.status(500).json({ message: "Erro ao listar avisos." });
  }
});

router.post("/", authMiddleware, requireTeacher, async (req, res) => {
  try {
    const { content, classId } = req.body;

    if (!content || !classId) {
      return res.status(400).json({ message: "Conteúdo e turma são obrigatórios." });
    }

    const announcement = await prisma.announcement.create({
      data: {
        content,
        classId
      }
    });

    return res.status(201).json(announcement);
  } catch (error) {
    console.error("Erro ao criar aviso:", error);
    return res.status(500).json({ message: "Erro ao criar aviso." });
  }
});

router.put("/:id", authMiddleware, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, classId } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        content,
        classId
      }
    });

    return res.json(announcement);
  } catch (error) {
    console.error("Erro ao atualizar aviso:", error);
    return res.status(500).json({ message: "Erro ao atualizar aviso." });
  }
});

router.delete("/:id", authMiddleware, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.announcement.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir aviso:", error);
    return res.status(500).json({ message: "Erro ao excluir aviso." });
  }
});

export default router;
