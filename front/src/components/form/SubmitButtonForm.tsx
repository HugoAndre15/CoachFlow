export default function SubmitButtonForm({ label, disabled = false }: { label: string; disabled?: boolean }) {
  return <button type="submit" disabled={disabled}
    className="min-h-12 w-full rounded-lg bg-action px-4 py-2 text-sm font-semibold text-on-action hover:bg-action-hover disabled:opacity-60">
    {label}
  </button>;
}
