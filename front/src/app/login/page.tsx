'use client';

import { useState } from "react";
import AuthFrame from "@/components/form/AuthFrame";
import InputForm from "../../components/form/inputForm";
import SubmitButtonForm from "../../components/form/SubmitButtonForm";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema } from "@/utils/validationSchemas";
import { z } from "zod";

export default function Login() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    // Validation avec Zod
    try {
      loginSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0] as string] = issue.message;
          }
        });
        setFieldErrors(errors);
        setLoading(false);
        return;
      }
    }

    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      setError(err.response?.data?.message || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame title="Se connecter">
      <form onSubmit={handleSubmit} className="grid gap-5">
        {error && <p role="alert" className="text-sm text-accent-red">{error}</p>}
        <InputForm label="Adresse e-mail" type="email" autoComplete="username" value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })} error={fieldErrors.email} />
        <InputForm label="Mot de passe" type="password" autoComplete="current-password" value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })} error={fieldErrors.password} />
        <SubmitButtonForm label={loading ? "Connexion…" : "Connexion"} disabled={loading} />
      </form>
      <p className="mt-6 text-sm text-muted">Pas encore de compte ? <a className="font-semibold text-accent-green underline" href="/register">S’inscrire</a></p>
    </AuthFrame>
  );
}
