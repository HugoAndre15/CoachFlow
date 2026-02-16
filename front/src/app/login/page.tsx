'use client';

import { useState } from "react";
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
    <div className="h-screen flex items-center dark:bg-gradient-to-br dark:from-dark-lighter dark:to-dark bg-gradient-to-br from-white-100 to-white-200 relative overflow-hidden">
        {/* Formes décoratives avec effet blur - uniquement à gauche */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden md:w-1/2">
          {/* Forme verte */}
          <div className="absolute -top-60 left-50 w-96 h-96 bg-accent-green rounded-full blur-3xl opacity-20 dark:opacity-30"></div>
          
          {/* Forme bleue */}
          <div className="absolute -bottom-50 -left-20 w-110 h-110 bg-accent-blue rounded-full blur-3xl opacity-20 dark:opacity-30"></div>

          {/* Forme rouge */}
          <div className="absolute bottom-60 -right-50 w-120 h-120 bg-accent-red rounded-full blur-3xl opacity-20 dark:opacity-30"></div>
        </div>

        <div className="text-left items-centermd:items-start flex flex-col gap-16 w-full md:w-1/2 h-full py-8 items-center justify-center relative z-10">
            <form onSubmit={handleSubmit} className="min-w-1/2 flex flex-col items-start justify-center gap-8 mx-auto">
                <div className="">
                    <h1 className="text-3xl font-medium text-dark dark:text-neutral-lightest">
                        Bon retour parmi nous
                    </h1>
                    <h2 className="text-base font-medium text-dark-lighter dark:text-neutral">
                        Entrez vos informations pour vous connecter
                    </h2>
                </div>
                {error && (
                    <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-300">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 20 20" 
                            fill="currentColor" 
                            className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                        >
                            <path 
                                fillRule="evenodd" 
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" 
                                clipRule="evenodd" 
                            />
                        </svg>
                        <p className="text-red-700 text-sm font-medium leading-relaxed">{error}</p>
                    </div>
                )}
                <div className="w-full flex flex-col items-start gap-4 md:pr-12">
                    <InputForm 
                        label="Email" 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        error={fieldErrors.email}
                    />
                    <InputForm 
                        label="Mot de passe" 
                        type="password" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        error={fieldErrors.password}
                    />
                    <SubmitButtonForm 
                        label={loading ? "Connexion..." : "Connexion"}
                        disabled={loading}
                        type="submit"
                        colorClass="bg-green-500 hover:bg-green-600 focus:ring-green-400/20"
                    />
                    <div className="h-0.5 w-2/3 bg-dark-lighter dark:bg-neutral mx-auto my-4"></div>
                    <div>

                    </div>
                    <div className="text-sm mx-auto text-dark-lighter dark:text-neutral">
                        <p>Pas encore de compte ? <a className="text-accent-blue" href="/register">S&apos;inscrire</a></p>
                    </div>
                </div>
            </form>
        </div>
        <div className="w-1/2 h-full hidden md:block relative z-10">
            <img src="/assets/img/fond-stade-auth.jpg" alt="Description" className="rounded-l-[45px] object-cover object-left h-full w-full" />
        </div>
    </div>
  );
}