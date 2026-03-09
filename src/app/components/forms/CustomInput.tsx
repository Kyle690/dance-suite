import React, { FocusEventHandler } from "react";
import {
    Autocomplete,
    Checkbox,
    CheckboxProps,
    FormControlLabel,
    SelectProps,
    TextField,
    TextFieldProps
} from "@mui/material";
import CustomSelectInput,{ CustomSelectInputProps } from "./CustomSelectInput";
import { DatePicker, DatePickerProps } from "@mui/x-date-pickers";
import dayjs from "@/app/utils/dayjs";
import { Search } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Dayjs } from "dayjs";

export type CustomInputProps =
  CustomSelectInputProps
  & TextFieldProps
  & SelectProps
  & CheckboxProps
  & DatePickerProps<any>
  & {
  inputType?: 'text' | 'number' | 'email' | 'password' | 'select' | 'autocomplete' | 'date' | 'search' | 'textarea' | 'checkbox';
}

export type CustomInputValueType = string | number | boolean | Dayjs |string[];

const CustomInput: React.FC<CustomInputProps> = ({
    inputType,
    options,
    ...rest
}) => {
    const theme= useTheme();

    const handleDateChange = (date: Dayjs | null) => {
        const event = {
            target: {
                name: rest.name,
                value: date?.toString(),
            },
        };
        rest.onChange?.(event as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const event = {
            target: {
                name: rest.name,
                value: e.target.checked,
            },
        };
        rest.onChange?.(event as unknown as React.ChangeEvent<HTMLInputElement>);
    }


    if(inputType==='autocomplete'){
        return (
            <Autocomplete
                value={options?.find(option => option?.value === rest.value) ?? null}
                renderInput={(params)=>(
                    <TextField
                        {...params}
                        label={rest.label}
                        required={rest.required}
                        error={rest.error}
                        helperText={rest.helperText}
                        size={rest.size}
                        variant={rest?.variant}
                    />
                )}
                onChange={(event, newValue) => {
                    rest?.onChange?.(newValue ? newValue.value : '');
                }}
                getOptionLabel={(option) => option.label}
                options={options as any[]}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                disabled={rest.disabled}
                onBlur={rest.onBlur as FocusEventHandler<HTMLInputElement>}
                size={rest?.size}
                sx={rest?.sx}
            />
        )
    }

    if(inputType ==='search'){
        return (
            <TextField
                fullWidth
                InputProps={{
                    startAdornment:(
                        <Search sx={{ mr:2, ml:-2, color:theme.palette.grey["500"] }}/>
                    )
                }}
                {...rest}
            />
        )
    }

    if(inputType === 'select'){
        return (
            <CustomSelectInput
                {...rest}
                name={rest.name}
                label={rest.label}
                value={rest.value}
                onChange={rest.onChange}
                options={options}
                required={rest.required}
                error={rest.error}
                helperText={rest.helperText}
            />
        )
    }

    if(inputType=== 'date'){
        return (
            <DatePicker
                maxDate={rest?.maxDate}
                minDate={rest?.minDate}
                value={dayjs(rest.value as string)}
                onChange={handleDateChange}
                label={rest.label}
                slotProps={{
                    textField:{
                        fullWidth:true,
                        required:rest.required,
                        error:rest.error,
                        helperText:rest.helperText,
                        size:rest.size,
                        disabled:rest.disabled,
                    }
                }}

            />
        )
    }

    if(inputType ==='textarea'){
        return (
            <TextField
                fullWidth
                multiline
                rows={4}
                required={rest.required}
                error={rest.error}
                helperText={rest.helperText}
                {...rest}
            />
        )
    }

    if(inputType ==='checkbox'){
        return (
            <FormControlLabel
                required={rest.required}
                control={<Checkbox
                    required={rest.required}
                    value={rest.value}
                    checked={Boolean(rest.value)}
                    onChange={handleCheckboxChange}
                />}
                label={rest.label}
            />
        )
    }

    return (
        <TextField
            fullWidth
            required={rest.required}
            type={rest.type}
            error={rest.error}
            helperText={rest.helperText}
            {...rest}
        />
    );
};

export default CustomInput;
