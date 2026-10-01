import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UiProvider } from '../provider/provider';
import { TextField } from './text-field';

describe('TextField', () => {
  it('associates the label with the input', () => {
    render(<TextField label="Email" type="email" />, { wrapper: UiProvider });

    const input = screen.getByLabelText('Email');
    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('type')).toBe('email');
  });

  it('is valid and described by its helper text when no error is given', () => {
    render(<TextField label="Email" helperText="We never share it." />, { wrapper: UiProvider });

    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBe(screen.getByText('We never share it.').id);
  });

  it('marks the input invalid and points its error message at the error text', () => {
    render(<TextField label="Email" errorText="Enter a valid email." />, { wrapper: UiProvider });

    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-errormessage')).toBe(screen.getByText('Enter a valid email.').id);
  });

  it('marks the input required', () => {
    render(<TextField label="Name" required />, { wrapper: UiProvider });

    expect(screen.getByRole('textbox', { name: /Name/ }).hasAttribute('required')).toBe(true);
  });
});
