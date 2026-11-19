'use client';
import { usePathname, useRouter } from 'next/navigation';
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

/** Submit button that shows it is working (uploads of photos can take a few seconds). */
export function Submit({
  children,
  className = 'pt-btn',
  pending = 'Guardando…',
  confirm,
}: {
  children: ReactNode;
  className?: string;
  pending?: string;
  /** Asks before submitting (deletes). */
  confirm?: string;
}) {
  const { pending: busy } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={busy}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {busy ? pending : children}
    </button>
  );
}

const TABS: [string, string][] = [
  ['/', 'Inicio'],
  ['/informes', 'Informes'],
  ['/soportes', 'Soportes'],
  ['/documentos', 'Documentos'],
  ['/pagos', 'Pagos'],
  ['/datos', 'Mis datos'],
];

/** Tabs; the contract pages count as «Informes». Works with and without the /mi-cuenta prefix. */
export function Tabs() {
  const raw = usePathname() ?? '/';
  const path = raw.replace(/^\/mi-cuenta/, '') || '/';
  const current = path.startsWith('/contratos')
    ? '/informes'
    : (TABS.find(([href]) => href !== '/' && path.startsWith(href))?.[0] ?? '/');
  return (
    <nav className="pt-nav" aria-label="Secciones">
      <div className="pt-nav-in">
        {TABS.map(([href, label]) => (
          <a key={href} href={href} aria-current={href === current ? 'page' : undefined}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

/** Reloads the page data every few seconds (the link page waits for the WhatsApp message). */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}

/**
 * Photo picker that also takes images pasted from the clipboard (Ctrl+V / long press → Pegar) anywhere in its
 * form, or dropped on it. Pasted images join the files chosen, in the same <input name>, so the server actions
 * receive them as usual.
 */
export function PhotoInput({
  name = 'photos',
  required = false,
  label,
  style,
}: {
  name?: string;
  required?: boolean;
  label?: ReactNode;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ key: string; url: string }[]>([]);

  const sync = useCallback(() => {
    const files = Array.from(ref.current?.files ?? []);
    setPreviews((old) => {
      for (const p of old) URL.revokeObjectURL(p.url);
      return files.map((f, i) => ({ key: `${i}-${f.name}-${f.size}`, url: URL.createObjectURL(f) }));
    });
  }, []);

  const add = useCallback(
    (incoming: File[]) => {
      const input = ref.current;
      const images = incoming.filter((f) => f.type.startsWith('image/'));
      if (!input || !images.length) return false;
      const dt = new DataTransfer();
      for (const f of Array.from(input.files ?? [])) dt.items.add(f);
      const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      images.forEach((f, i) => {
        // Clipboard images come as «image.png»: give each a distinct name.
        const ext = f.type.split('/')[1] || 'png';
        dt.items.add(
          f.name && f.name !== 'image.png'
            ? f
            : new File([f], `pegada-${stamp}-${i + 1}.${ext}`, { type: f.type }),
        );
      });
      input.files = dt.files;
      sync();
      return true;
    },
    [sync],
  );

  useEffect(() => {
    // On the document, so it works whatever element of the form has the focus (or none, on desktop).
    const onPaste = (e: ClipboardEvent) => {
      const input = ref.current;
      const form = input?.form;
      if (!input || !form) return;
      const target = e.target instanceof Node ? e.target : null;
      const inForm = target ? form.contains(target) : false;
      // Outside any form, the first photo picker on the page takes it.
      const first = document.querySelector('input[type=file][data-paste]') === input;
      if (!inForm && !(first && (!target || target === document.body))) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (add(files)) e.preventDefault();
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [add]);

  const remove = (index: number) => {
    const input = ref.current;
    if (!input) return;
    const dt = new DataTransfer();
    Array.from(input.files ?? []).forEach((f, i) => {
      if (i !== index) dt.items.add(f);
    });
    input.files = dt.files;
    sync();
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drop target around a real file input
    <div
      className="pt-paste"
      style={style}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        if (add(Array.from(e.dataTransfer.files))) e.preventDefault();
      }}
    >
      <label style={{ marginBottom: 6 }}>
        {label}
        <input
          ref={ref}
          type="file"
          name={name}
          accept="image/*"
          multiple
          required={required}
          onChange={sync}
        />
      </label>
      <p className="pt-muted" style={{ margin: 0 }}>
        📋 También puedes pegar una foto copiada: haz clic aquí y presiona Ctrl+V (en el celular, mantén
        presionado y toca «Pegar» en el texto).
      </p>
      {previews.length > 0 && (
        <div className="pt-photos">
          {previews.map((p, i) => (
            <div key={p.key} className="pt-photo">
              {/* biome-ignore lint/performance/noImgElement: local preview of a file not uploaded yet */}
              <img src={p.url} alt="Foto por subir" />
              <button type="button" onClick={() => remove(i)} aria-label="Quitar foto">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
