'use client';

import { useState } from "react";

interface InputFormProps {
    label: string;
    type: string;
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
}

export default function InputForm({ label, type, placeholder, value, onChange, error }: InputFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const inputClasses = error
        ? "border border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 text-red-900"
        : "border border-gray-300 bg-white hover:border-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10";

    return (
        <div className="w-full flex flex-col gap-1 items-center text-left">
            <label className="text-left text-sm w-full font-medium text-dark-lighter dark:text-neutral-lightest" htmlFor={label}>{label}</label>
            <div className="relative w-full">
                <input
                    id={label}
                    type={inputType}
                    placeholder={placeholder ?? `Entrez votre ${label}`}
                    value={value}
                    onChange={onChange}
                    className={`w-full py-2.5 px-3 rounded-lg outline-none transition-all duration-300 ease-in-out placeholder:text-dark-lighter placeholder:text-sm placeholder:font-medium selection:bg-green-100 selection:text-green-900 ${inputClasses}`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
            {error && (
                <div className="flex items-start gap-1.5 w-full animate-in slide-in-from-top-1 duration-300">
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor" 
                        className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                    >
                        <path 
                            fillRule="evenodd" 
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" 
                            clipRule="evenodd" 
                        />
                    </svg>
                    <p className="text-red-600 text-xs font-medium leading-relaxed">{error}</p>
                </div>
            )}
        </div>
    );
}