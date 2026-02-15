import { z } from 'zod';

// Schéma de validation pour l'inscription
export const registerSchema = z.object({
    firstName: z.string()
        .min(2, 'Le prénom doit contenir au moins 2 caractères')
        .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
    lastName: z.string()
        .min(2, 'Le nom doit contenir au moins 2 caractères')
        .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
    email: z.string()
        .email('Veuillez entrer une adresse email valide'),
    password: z.string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
        .regex(/[@$!%*?&_-]/, 'Le mot de passe doit contenir au moins un caractère spécial'),
    passwordConfirmation: z.string()
        .min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.password === data.passwordConfirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['passwordConfirmation'],
});

// Schéma de validation pour la connexion
export const loginSchema = z.object({
    email: z.string()
        .email('Veuillez entrer une adresse email valide'),
    password: z.string()
        .min(1, 'Le mot de passe est requis'),
});

// Types TypeScript générés depuis les schémas
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
