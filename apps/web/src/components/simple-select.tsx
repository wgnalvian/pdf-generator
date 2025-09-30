export type OptionSimpleSelect<T> = {
  label: string;
  value: T;
};

type Props<T> = {
  label?: string;
  options: OptionSimpleSelect<T>[];
  value?: T;
  onChange?: (value: T) => void;
  serialize?: (val: T) => string;
  deserialize?: (val: string) => T;
};

export default function SimpleSelect<T>({
  label,
  options,
  value,
  onChange,
  serialize = (v) => String(v),
  deserialize = (v) => v as unknown as T,
}: Props<T>) {
  return (
    <div className="w-full max-w-sm">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        value={value !== undefined ? serialize(value) : ""}
        onChange={(e) => onChange?.(deserialize(e.target.value))}
        className="block w-full bg-white text-black p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        {options.map((opt) => (
          <option key={serialize(opt.value)} value={serialize(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
