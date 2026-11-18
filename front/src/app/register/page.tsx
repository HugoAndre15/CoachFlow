'use client';

import { useState } from "react";
import AuthFrame from "@/components/form/AuthFrame";
import InputForm from "../../components/form/inputForm";
import SubmitButtonForm from "../../components/form/SubmitButtonForm";
import { useAuth } from "@/contexts/AuthContext";
import { registerSchema } from "@/utils/validationSchemas";
import { z } from "zod";

export default function Register() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setLoading(true);

        // Validation avec Zod
        try {
            registerSchema.parse(formData);
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
            await register(formData);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

  return (
    <AuthFrame title="Créer mon espace">
      <form onSubmit={handleSubmit} className="grid gap-4">
        {error && <p role="alert" className="text-sm text-accent-red">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <InputForm label="Prénom" type="text" autoComplete="given-name" value={formData.firstName}
            onChange={e => setFormData({ ...formData, firstName: e.target.value })} error={fieldErrors.firstName} />
          <InputForm label="Nom" type="text" autoComplete="family-name" value={formData.lastName}
            onChange={e => setFormData({ ...formData, lastName: e.target.value })} error={fieldErrors.lastName} />
        </div>
        <InputForm label="Adresse e-mail" type="email" autoComplete="username" value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })} error={fieldErrors.email} />
        <InputForm label="Mot de passe" type="password" autoComplete="new-password" value={formData.password}
          hint="8 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial (@ $ ! % * ? & _ -)."
          onChange={e => setFormData({ ...formData, password: e.target.value })} error={fieldErrors.password} />
        <InputForm label="Confirmer le mot de passe" type="password" autoComplete="new-password" value={formData.passwordConfirmation}
          onChange={e => setFormData({ ...formData, passwordConfirmation: e.target.value })} error={fieldErrors.passwordConfirmation} />
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" required checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="size-5 accent-accent-green" />
          J’accepte les CGV et CGU
        </label>
        <SubmitButtonForm label={loading ? "Inscription…" : "Créer mon compte"} disabled={!acceptedTerms || loading} />
      </form>
      <p className="mt-6 text-sm text-muted">Déjà un compte ? <a className="font-semibold text-accent-green underline" href="/login">Se connecter</a></p>
    </AuthFrame>
  );
}
