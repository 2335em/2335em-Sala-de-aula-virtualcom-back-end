import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { role, password } = req.body;

    if (!role || !password) {
      return res.status(400).json({ error: "Perfil e senha são obrigatórios." });
    }

    const normalizedRole = String(role).trim().toUpperCase();

    const roleMap = {
      PROFESSOR: "TEACHER",
      ESTUDANTE: "STUDENT",
      TEACHER: "TEACHER",
      STUDENT: "STUDENT"
    };
    const dbRole = roleMap[normalizedRole] || normalizedRole;

    const user = await prisma.user.findFirst({
      where: { role: dbRole }
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: "Perfil ou senha incorretos." });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Perfil ou senha incorretos." });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não está definido nas variáveis de ambiente.");
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        role: user.role
      }
    });
  } catch (error) {
    console.error("DETALHE DO ERRO NO LOGIN:", error.message, error.stack);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
});

export default router;