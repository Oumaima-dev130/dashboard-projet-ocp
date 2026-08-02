import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const router = express.Router();

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Cet e-mail est déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = generateCode();

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationCode: code,
      verificationCodeExpires: Date.now() + 10 * 60 * 1000,
    });

    await sendVerificationEmail(email, code);

    res.status(201).json({
      message: "Compte créé. Vérifiez votre e-mail pour le code de confirmation.",
      email: newUser.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Ce compte est déjà vérifié" });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Code incorrect" });
    }

    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: "Code expiré, demandez-en un nouveau" });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Compte vérifié avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Ce compte est déjà vérifié" });
    }

    const code = generateCode();
    user.verificationCode = code;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(email, code);

    res.status(200).json({ message: "Nouveau code envoyé" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "E-mail ou mot de passe incorrect" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Veuillez vérifier votre e-mail avant de vous connecter" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "E-mail ou mot de passe incorrect" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;