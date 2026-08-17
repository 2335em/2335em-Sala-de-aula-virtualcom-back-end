import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, requireTeacher } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        grade: true,
        createdAt: true
      }
    });
    return res.json(classes);
  } catch (error) {
    console.error("Erro ao listar turmas:", error);
    return res.status(500).json({ message: "Erro ao listar turmas." });
  }
});

router.post("/", authMiddleware, requireTeacher, async (req, res) => {
  try {
    const { name, grade } = req.body;

    if (!name || !grade) {
      return res.status(400).json({ message: "Nome e ano são obrigatórios." });
    }

    const turma = await prisma.class.create({
      data: { name, grade }
    });

    return res.status(201).json(turma);
  } catch (error) {
    console.error("Erro ao criar turma:", error);
    return res.status(500).json({ message: "Erro ao criar turma." });
  }
});

router.put("/:id", authMiddleware, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade } = req.body;

    const turma = await prisma.class.update({
      where: { id },
      data: { name, grade }
    });

    return res.json(turma);
  } catch (error) {
    console.error("Erro ao atualizar turma:", error);
    return res.status(500).json({ message: "Erro ao atualizar turma." });
  }
});

router.delete("/:id", authMiddleware, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.class.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir turma:", error);
    return res.status(500).json({ message: "Erro ao excluir turma." });
  }
});

export default router;
