import { useState } from 'react'
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiShield } from 'react-icons/fi'
import logoJph from '../assets/ocplogo.png'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'

function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

const handleSubmit = async (e) => {
  e.preventDefault();

  setError("");

  if (!fullName.trim()) {
    setError("Veuillez saisir votre nom complet");
    return;
  }

  if (!email.trim()) {
    setError("Veuillez saisir votre adresse e-mail");
    return;
  }

  if (password.length < 6) {
    setError("Le mot de passe doit contenir au moins 6 caractères");
    return;
  }

  if (password !== confirmPassword) {
    setError("Les mots de passe ne correspondent pas");
    return;
  }

  if (!acceptTerms) {
    setError("Vous devez accepter les conditions d'utilisation");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    console.log("REGISTER STATUS :", response.status);
    console.log("REGISTER RESPONSE :", data);

    if (response.status === 409) {
      setError(
        data.message ||
          "Cette adresse e-mail est déjà utilisée."
      );
      return;
    }

    if (!response.ok) {
      setError(
        data.message ||
          `Erreur serveur (${response.status})`
      );
      return;
    }

    navigate("/verify-email", {
      state: {
        email: email.trim().toLowerCase(),
      },
    });
  } catch (err) {
    console.error("❌ ERREUR REGISTER :", err);

    setError(
      "Impossible de contacter le serveur. Vérifiez que l'API est disponible."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-card fade-in">
      <div className="logo-container">
        <img
          src={logoJph}
          alt="Logo JPH"
          className="logo-jph"
        />
      </div>

      <h1 className="welcome-title">
        Créer un <span className="highlight-green">compte</span>
      </h1>

      <br />

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      <form
        className="login-form"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* NOM COMPLET */}
        <div className="form-group">
          <label htmlFor="fullName">
            Nom complet
          </label>

          <div className="input-wrapper">
            <FiUser className="input-icon" />

            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Votre nom complet"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
        </div>

        {/* EMAIL */}
        <div className="form-group">
          <label htmlFor="email">
            Adresse e-mail
          </label>

          <div className="input-wrapper">
            <FiMail className="input-icon" />

            <input
              type="email"
              id="email"
              name="email"
              placeholder="exemple@ocpgroup.ma"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>

        {/* MOT DE PASSE */}
        <div className="form-group">
          <label htmlFor="password">
            Mot de passe
          </label>

          <div className="input-wrapper">
            <FiLock className="input-icon" />

            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              placeholder="Créer un mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              aria-label={
                showPassword
                  ? 'Masquer le mot de passe'
                  : 'Afficher le mot de passe'
              }
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {/* CONFIRMATION MOT DE PASSE */}
        <div className="form-group">
          <label htmlFor="confirmPassword">
            Confirmer le mot de passe
          </label>

          <div className="input-wrapper">
            <FiLock className="input-icon" />

            <input
              type={
                showConfirmPassword
                  ? 'text'
                  : 'password'
              }
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirmer votre mot de passe"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
              aria-label={
                showConfirmPassword
                  ? 'Masquer le mot de passe'
                  : 'Afficher le mot de passe'
              }
            >
              {showConfirmPassword ? (
                <FiEyeOff />
              ) : (
                <FiEye />
              )}
            </button>
          </div>
        </div>

        {/* CONDITIONS */}
        <div className="form-options">
          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) =>
                setAcceptTerms(e.target.checked)
              }
              required
            />

            <span className="checkbox-custom"></span>

            J'accepte les conditions d'utilisation
          </label>
        </div>

        {/* BOUTON */}
        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading
            ? 'Création en cours...'
            : 'Créer un compte'}
        </button>

        <div className="divider">
          <span>OU</span>
        </div>

        <p className="signup-text">
          Vous avez déjà un compte ?{' '}

          <Link
            to="/login"
            className="signup-link"
          >
            Se connecter
          </Link>
        </p>
      </form>

      {/* FOOTER */}
      <div className="login-footer">
        <p className="security-text">
          <FiShield className="security-icon" />
          Sécurité et confidentialité garanties
        </p>

        <p className="copyright-text">
          &copy; {new Date().getFullYear()} OCP Group.
          Tous droits réservés.
        </p>
      </div>
    </div>
  )
}

export default SignupForm