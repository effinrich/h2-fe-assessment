import { NativeSelect as ChakraNativeSelect } from "@chakra-ui/react";

export interface NativeSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Renders a platform `<select>`. For a visible label, place it inside `Field.Root` with a `Field.Label`. */
export interface NativeSelectProps extends Omit<ChakraNativeSelect.FieldProps, "children"> {
  /** Plain strings are used as both value and label. */
  items: Array<string | NativeSelectOption>;
  size?: ChakraNativeSelect.RootProps["size"];
  variant?: ChakraNativeSelect.RootProps["variant"];
  disabled?: boolean;
  invalid?: boolean;
}

export function NativeSelect({
  items,
  size,
  variant,
  disabled,
  invalid,
  ...fieldProps
}: NativeSelectProps) {
  return (
    <ChakraNativeSelect.Root size={size} variant={variant} disabled={disabled} invalid={invalid}>
      <ChakraNativeSelect.Field {...fieldProps}>
        {items.map((item) => {
          const option = typeof item === "string" ? { value: item, label: item } : item;
          return (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          );
        })}
      </ChakraNativeSelect.Field>
      <ChakraNativeSelect.Indicator />
    </ChakraNativeSelect.Root>
  );
}
