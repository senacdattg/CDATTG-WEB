import Select from 'react-select';
import type { StylesConfig } from 'react-select';
import { selectStylesMulti, selectTheme } from './selectSearchTheme';

export interface SelectOptionString {
  value: string;
  label: string;
}

interface SelectSearchMultiStringProps {
  options: SelectOptionString[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
  ariaLabel?: string;
  inputId?: string;
}

/** Multi-select con chips (mismo diseño que SelectSearchMulti) para valores string. */
export function SelectSearchMultiString(props: Readonly<SelectSearchMultiStringProps>) {
  const {
    options,
    value,
    onChange,
    placeholder = 'Buscar...',
    isDisabled = false,
    ariaLabel,
    inputId,
  } = props;

  const selectedOptions = options.filter((o) => value.includes(o.value));
  const styles = selectStylesMulti as unknown as StylesConfig<SelectOptionString, true>;

  return (
    <div className="react-select-wrapper w-full">
      <Select<SelectOptionString, true>
        inputId={inputId}
        isMulti
        options={options}
        value={selectedOptions}
        onChange={(opts) => onChange(opts.map((o) => o.value))}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable
        isSearchable
        closeMenuOnSelect={false}
        noOptionsMessage={() => 'Sin opciones'}
        loadingMessage={() => 'Cargando...'}
        theme={selectTheme}
        styles={styles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        aria-label={ariaLabel}
        classNames={{
          control: () => 'w-full',
        }}
      />
    </div>
  );
}
