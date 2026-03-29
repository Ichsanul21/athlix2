import { useMemo } from 'react';
import Select from 'react-select';

const defaultGetOptionValue = (option) => option?.value;
const defaultGetOptionLabel = (option) => option?.label ?? '';

export default function DbSelect({
    options = [],
    value = '',
    onChange,
    placeholder = 'Pilih data...',
    isDisabled = false,
    isClearable = false,
    noOptionsMessage = () => 'Data tidak ditemukan',
    getOptionValue = defaultGetOptionValue,
    getOptionLabel = defaultGetOptionLabel,
    menuPortal = true,
    inputId,
    className = '',
}) {
    const selectedOption = useMemo(() => {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        const target = String(value);
        return options.find((option) => String(getOptionValue(option)) === target) || null;
    }, [options, value, getOptionValue]);

    const styles = {
        control: (base, state) => ({
            ...base,
            minHeight: 40,
            borderRadius: 12,
            borderColor: state.isFocused ? '#E61E32' : '#D4D4D8',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(230, 30, 50, 0.18)' : 'none',
            '&:hover': {
                borderColor: state.isFocused ? '#E61E32' : '#A1A1AA',
            },
        }),
        valueContainer: (base) => ({
            ...base,
            paddingTop: 2,
            paddingBottom: 2,
        }),
        menu: (base) => ({
            ...base,
            zIndex: 40,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #E4E4E7',
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 70,
        }),
        option: (base, state) => ({
            ...base,
            fontSize: 14,
            cursor: 'pointer',
            backgroundColor: state.isSelected ? '#E61E32' : state.isFocused ? '#FEF2F2' : '#FFFFFF',
            color: state.isSelected ? '#FFFFFF' : '#171717',
        }),
        placeholder: (base) => ({
            ...base,
            color: '#737373',
        }),
    };

    return (
        <div className={className}>
            <Select
                instanceId={inputId}
                inputId={inputId}
                options={options}
                value={selectedOption}
                onChange={(option) => {
                    if (!onChange) return;
                    onChange(option ? getOptionValue(option) : '');
                }}
                isDisabled={isDisabled}
                isClearable={isClearable}
                placeholder={placeholder}
                noOptionsMessage={noOptionsMessage}
                getOptionValue={(option) => String(getOptionValue(option))}
                getOptionLabel={(option) => getOptionLabel(option)}
                menuPortalTarget={menuPortal && typeof document !== 'undefined' ? document.body : null}
                styles={styles}
            />
        </div>
    );
}

