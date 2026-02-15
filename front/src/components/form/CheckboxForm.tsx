interface CheckboxFormProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export default function CheckboxForm({ label, checked, onChange }: CheckboxFormProps) {
    return (
        <div className="flex items-center gap-3 my-2">
            <input
                id={label}
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="
                    w-4 h-4 rounded-md
                    border-1 border-black
                    cursor-pointer
                    transition-all duration-200
                    hover:border-gray-500 
                    "               
            />
            <label 
                className="text-xs font-small cursor-pointer select-none text-dark-lighter dark:text-neutral-lightest" 
                htmlFor={label}
            >
                {label}
            </label>
        </div>
    );
}