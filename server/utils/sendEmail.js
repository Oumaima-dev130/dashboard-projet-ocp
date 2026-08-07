import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"OCP Group" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Vérification de votre compte OCP",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2 style="color: #00954a;">Bienvenue sur la plateforme OCP</h2>

        <p>Voici votre code de vérification :</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #1f2a24;
          margin: 16px 0;
        ">
          ${code}
        </div>

        <p>Ce code expire dans 10 minutes.</p>

        <p style="color: #6b7680; font-size: 12px;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.
        </p>
      </div>
    `,
  });
};