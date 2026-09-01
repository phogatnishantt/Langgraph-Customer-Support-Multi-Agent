import { useState } from "react";
import {
  Bot,
  Mail,
  Lock,
  LogIn,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import { login } from "../services/api";

import "./Login.css";


function Login({ onLogin }) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await login(
        email.trim(),
        password
      );

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      onLogin(data);

    } catch (err) {
      console.error(
        "Login failed:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      setError(
        detail ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-page">

      <div className="login-background-glow" />

      <div className="login-card">

        <div className="login-brand">

          <div className="login-brand-icon">
            <Bot size={22} />
          </div>

          <div>
            <h1>
              SupportAI
            </h1>

            <span>
              Autonomous Support Platform
            </span>
          </div>

        </div>


        <div className="login-header">

          <p className="eyebrow">
            Secure access
          </p>

          <h2>
            Welcome back
          </h2>

          <p>
            Sign in to access your
            customer support workspace.
          </p>

        </div>


        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <div className="form-field">

            <label htmlFor="email">
              Email
            </label>

            <div className="input-wrapper">

              <Mail size={16} />

              <input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
              />

            </div>

          </div>


          <div className="form-field">

            <label htmlFor="password">
              Password
            </label>

            <div className="input-wrapper">

              <Lock size={16} />

              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
              />

            </div>

          </div>


          {error && (

            <div className="login-error">

              <AlertCircle size={15} />

              <span>
                {error}
              </span>

            </div>

          )}


          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="login-spinner" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Sign in
              </>
            )}

          </button>

        </form>


        <div className="login-security">

          <ShieldCheck size={15} />

          <span>
            Secured with JWT authentication
          </span>

        </div>


        <div className="login-footer">
          Customer Support AI · Secure workspace
        </div>

      </div>

    </div>
  );
}


export default Login;