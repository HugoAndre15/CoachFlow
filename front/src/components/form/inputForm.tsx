"use client";

import { useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputFormProps extends Pick<ComponentProps<"input">, "type" | "value" | "onChange" | "autoComplete" | "placeholder"> {
  label: string;
  error?: string;
  hint?: string;
}

export default function InputForm({ label, type, error, hint, ...props }: InputFormProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return (
    <div className="grid min-w-0 gap-1">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <div className="relative">
        <input id={id} type={password && visible ? "text" : type} {...props}
          aria-invalid={!!error} aria-describedby={[hint && id + "-hint", error && id + "-error"].filter(Boolean).join(" ") || undefined}
          className={`min-h-11 w-full rounded-lg border bg-surface px-3 py-2 text-base text-ink focus:border-accent-green ${password ? "pr-12" : ""} ${error ? "border-accent-red" : "border-line"}`} />
        {password && (
          <button type="button" onClick={() => setVisible(!visible)}
            aria-label={`${visible ? "Masquer" : "Afficher"} le champ « ${label} »`}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-md text-muted hover:text-ink">
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hint && <p id={id + "-hint"} className="text-xs text-muted">{hint}</p>}
      {error && <p id={id + "-error"} role="alert" className="text-sm text-accent-red">{error}</p>}
    </div>
  );
}
