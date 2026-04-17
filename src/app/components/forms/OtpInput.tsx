'use client';
import React, { useRef, useCallback, ClipboardEvent, KeyboardEvent } from 'react';
import { Box, FormHelperText, Grid, useTheme } from '@mui/material';

interface OtpInputProps {
    value: string;
    onChange: (value: string) => void;
    length?: number;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    autoFocus?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({
    value,
    onChange,
    length = 6,
    error = false,
    helperText,
    disabled = false,
    autoFocus = false,
}) => {
    const theme = useTheme();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const digits = Array.from({ length }, (_, i) => value[i] ?? '');

    const focusIndex = useCallback((index: number) => {
        const clamped = Math.max(0, Math.min(length - 1, index));
        inputRefs.current[clamped]?.focus();
    }, [ length ]);

    const handleChange = useCallback((index: number, raw: string) => {
        // Accept only the last digit typed
        const digit = raw.replace(/\D/g, '').slice(-1);
        const next = digits.map((d, i) => (i === index ? digit : d));
        onChange(next.join(''));
        if (digit) focusIndex(index + 1);
    }, [ digits, onChange, focusIndex ]);

    const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            if (digits[index]) {
                const next = digits.map((d, i) => (i === index ? '' : d));
                onChange(next.join(''));
            } else {
                focusIndex(index - 1);
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            focusIndex(index - 1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            focusIndex(index + 1);
        }
    }, [ digits, onChange, focusIndex ]);

    const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        if (!pasted) return;
        const next = Array.from({ length }, (_, i) => pasted[i] ?? '');
        onChange(next.join(''));
        focusIndex(Math.min(pasted.length, length - 1));
    }, [ length, onChange, focusIndex ]);

    const borderColor = error
        ? theme.palette.error.main
        : theme.palette.divider;

    const focusBorderColor = error
        ? theme.palette.error.main
        : theme.palette.primary.main;

    return (
        <Box>
            <Grid container spacing={1.5}>
                {digits.map((digit, index) => (
                    <Grid key={index} size={12 / length}>
                        <Box
                            component="input"
                            ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={2}
                            value={digit}
                            autoFocus={autoFocus && index === 0}
                            disabled={disabled}
                            autoComplete={index === 0 ? 'one-time-code' : 'off'}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
                            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                            sx={{
                                width: '100%',
                                aspectRatio: '1 / 1',
                                textAlign: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                fontFamily: 'monospace',
                                color: 'text.primary',
                                bgcolor: 'background.paper',
                                border: `1.5px solid ${borderColor}`,
                                borderRadius: 1.5,
                                outline: 'none',
                                caretColor: 'transparent',
                                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                                cursor: disabled ? 'not-allowed' : 'text',
                                opacity: disabled ? 0.5 : 1,
                                '&:focus': {
                                    borderColor: focusBorderColor,
                                    boxShadow: `0 0 0 3px ${focusBorderColor}22`,
                                },
                                '&:not(:placeholder-shown)': {
                                    borderColor: error ? 'error.main' : 'text.secondary',
                                },
                            }}
                        />
                    </Grid>
                ))}
            </Grid>
            {helperText && (
                <FormHelperText
                    error={error}
                    sx={{ textAlign: 'center', mt: 1 }}
                >
                    {helperText}
                </FormHelperText>
            )}
        </Box>
    );
};

export default OtpInput;
