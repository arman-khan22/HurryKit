import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hurrykit.com';

export const metadata: Metadata = {
  title: 'Open Source Licences & Notices | Hurrykit',
  description:
    'Attributions, copyright notices, and open source licenses for the libraries and WebAssembly codecs that power Hurrykit.',
  alternates: { canonical: `${SITE_URL}/licences` },
};

type LicenceItem = {
  name: string;
  version: string;
  licence: string;
  source: string;
  description: string;
  notice: string;
};

const LICENCES: LicenceItem[] = [
  {
    name: 'FFmpeg',
    version: 'n6.0 (WASM build)',
    licence: 'LGPL-2.1-or-later',
    source: 'https://ffmpeg.org',
    description: 'Leading multimedia framework for audio and video decoding, remuxing, and transcoding.',
    notice: 'FFmpeg is licensed under the GNU Lesser General Public License (LGPL) version 2.1 or later. FFmpeg is a trademark of Fabrice Bellard, originator of the FFmpeg project.',
  },
  {
    name: '@ffmpeg/ffmpeg & @ffmpeg/util',
    version: '0.12.x',
    licence: 'MIT',
    source: 'https://github.com/ffmpegwasm/ffmpeg.wasm',
    description: 'WebAssembly wrapper bringing FFmpeg capabilities to modern web browsers.',
    notice: 'Copyright (c) 2019 Jerome Wu. Permission is hereby granted, free of charge, to any person obtaining a copy of this software...',
  },
  {
    name: 'heic2any',
    version: '0.0.4',
    licence: 'MIT / LGPL (libheif)',
    source: 'https://github.com/alexcorvi/heic2any',
    description: 'Converts HEIC/HEIF images to JPEG/PNG in the browser via WebAssembly libheif.',
    notice: 'Copyright (c) 2019 Alex Corvi. Built on libheif (GNU LGPL v3).',
  },
  {
    name: '@jsquash/avif',
    version: '1.3.x',
    licence: 'Apache-2.0 / BSD-2-Clause',
    source: 'https://github.com/jamsinclair/jSquash',
    description: 'WebAssembly port of libavif for high-quality decoding and encoding of AVIF images.',
    notice: 'Copyright 2020 Google LLC / James Sinclair. Licensed under the Apache License, Version 2.0.',
  },
  {
    name: 'utif.js',
    version: '3.1.x',
    licence: 'MIT',
    source: 'https://github.com/photopea/UTIF.js',
    description: 'Fast TIFF decoder and encoder written in JavaScript.',
    notice: 'Copyright (c) 2018 Ivan Kuckir. Permission is hereby granted, free of charge, to any person obtaining a copy...',
  },
  {
    name: 'JSZip',
    version: '3.10.x',
    licence: 'MIT / GPLv3 dual',
    source: 'https://stuk.github.io/jszip/',
    description: 'Create, read and edit .zip files with JavaScript.',
    notice: 'Copyright (c) 2009-2016 Stuart Knightley, David Duponchel, Franz Buchinger, António Afonso.',
  },
  {
    name: 'Zustand',
    version: '5.0.x',
    licence: 'MIT',
    source: 'https://github.com/pmndrs/zustand',
    description: 'Bear necessities for state management in React.',
    notice: 'Copyright (c) 2019 Paul Henschel. Permission is hereby granted, free of charge...',
  },
  {
    name: 'Zod',
    version: '3.25.x',
    licence: 'MIT',
    source: 'https://github.com/colinhacks/zod',
    description: 'TypeScript-first schema validation with static type inference.',
    notice: 'Copyright (c) 2020 Colin McDonnell. Permission is hereby granted, free of charge...',
  },
  {
    name: 'Next.js & React',
    version: '15.x / 19.x',
    licence: 'MIT',
    source: 'https://nextjs.org',
    description: 'The React Framework for the Web by Vercel and Meta.',
    notice: 'Copyright (c) 2026 Vercel, Inc. / Meta Platforms, Inc.',
  },
];

export default function LicencesPage() {
  const breadcrumbs = [
    { name: 'Home', item: SITE_URL },
    { name: 'Licences', item: `${SITE_URL}/licences` },
  ];

  return (
    <div className="container py-8 max-w-3xl">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mt-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-4">
          Open Source Licences & Notices
        </h1>
        <p className="text-lg text-[var(--muted)] mb-8">
          Hurrykit is made possible by extraordinary open-source software, codecs, and browser standards. We are deeply grateful to the authors, maintainers, and communities who built them.
        </p>

        <div className="space-y-6">
          {LICENCES.map((item) => (
            <div key={item.name} className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h2 className="text-lg font-bold text-[var(--text)]">{item.name}</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--muted)]">
                  {item.licence}
                </span>
              </div>
              <p className="text-sm text-[var(--muted)] mb-2">{item.description}</p>
              <p className="text-xs font-mono text-[var(--muted)] bg-[var(--surface-raised)] p-3 rounded border border-[var(--border)] leading-relaxed">
                {item.notice}
              </p>
              <div className="mt-3 text-xs">
                <a
                  href={item.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--image)] hover:underline inline-flex items-center gap-1"
                >
                  Source Repository →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
