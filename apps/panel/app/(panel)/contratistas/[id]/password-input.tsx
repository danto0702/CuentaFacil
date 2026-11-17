'use client';
import { useState } from 'react';

// No 0/O, 1/l/I: the superadmin dictates or writes it to the contractor.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/** Password field with «Generar»: shows the password so the superadmin can copy it for the contractor. */
export function PasswordInput() {
  const [value, setValue] = useState('');
  const generate = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    setValue(Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join(''));
  };
  return (
    <label>
      Contraseña{' '}
      <input
        name="password"
        type="text"
        minLength={8}
        required
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ fontFamily: 'monospace', width: 180 }}
      />
      <button type="button" className="secondary" onClick={generate}>
        Generar
      </button>
    </label>
  );
}
