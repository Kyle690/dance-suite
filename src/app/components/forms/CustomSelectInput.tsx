import React from "react";

import { FormControl, FormHelperText, InputLabel, MenuItem, Select, SelectProps } from "@mui/material";

export type OptionType = {
    label:string;
    value:string;
    disabled?:boolean;
}

export type CustomSelectInputProps = SelectProps &{
  options?:OptionType[],
  label?:string,
  name:string,
  onChange:SelectProps<unknown>['onChange'],
  value:string|number|boolean |string[],
  helperText?:string|boolean,
}

const CustomSelectInput: React.FC<CustomSelectInputProps> = ({
    options,
    label,
    name,
    onChange,
    value,
    helperText,
    ...rest
}) => (
    <FormControl
        fullWidth={rest.fullWidth}
        required={rest.required}
        error={rest.error}
        variant={rest.variant}
    >
        {label && (
            <InputLabel
                required={rest.required} data-testid={`test-select-label-${name}`}
                id={`select-${name}`}
            >
                {label}
            </InputLabel>
        )}
        <Select
            labelId={`select-${name}`}
            id={name}
            data-testid={`test-select-${name}`}
            name={name}
            value={value}
            label={label}
            onChange={onChange}
            fullWidth
            {...rest}
        >
            {options?.map((option)=>(
                <MenuItem
                    key={option.label}
                    value={String(option.value)}
                    disabled={option.disabled}
                >
                    {option.label}
                </MenuItem>
            ))}
        </Select>
        {helperText && (
            <FormHelperText>{helperText}</FormHelperText>
        )}
    </FormControl>
)

export default CustomSelectInput;
