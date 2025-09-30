import React from "react";

type Props<T> = {
  label?: string;
  value?: T;
  onChange?: (value: T) => void;
  serialize?: (val: T) => string;
  deserialize?: (val: string) => T;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
};

export default function TextInput<T = string>({
  label,
  value,
  onChange,
  serialize = (v) => String(v),
  deserialize = (v) => v as unknown as T,
  placeholder,
  type = "text",
  multiline = false,
  rows = 4,
  className = "",
}: Props<T>) {
  const stringValue = value !== undefined && value !== null ? serialize(value) : "";

  const commonClass =
    "block w-full bg-white text-black p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm " +
    className;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange?.(deserialize(e.target.value));
  };

  return (
    <div className="w-full max-w-sm">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {multiline ? (
        <textarea
          value={stringValue}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          className={commonClass}
        />
      ) : (
        <input
          value={stringValue}
          onChange={handleChange}
          placeholder={placeholder}
          type={type}
          className={commonClass}
        />
      )}
    </div>
  );
}
