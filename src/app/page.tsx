import React from 'react';

export default function Home(): React.ReactElement {
  return (
    <div className={`
      grid min-h-screen grid-rows-[20px_1fr_20px] items-center
      justify-items-center gap-16 p-8 pb-20
      font-[family-name:var(--font-geist-sans)]
      sm:p-20
    `}>
      <main className={`
        row-start-2 flex flex-col items-center gap-[32px]
        sm:items-start
      `}>
        Home
      </main>
      <footer className={`
        row-start-3 flex flex-wrap items-center justify-center gap-[24px]
      `}>
        <a
          href='https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app'
          rel='noopener noreferrer'
          target='_blank'
          className={`
            flex items-center gap-2
            hover:underline hover:underline-offset-4
          `}
        >
          Learn
        </a>
      </footer>
    </div>
  );
}
