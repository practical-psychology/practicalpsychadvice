import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Practical Psychology Advice | Andy Horowitz',
  description:
    'Official 10-book Practical Psychology series. Explore focused guides on charisma, motivation, self-awareness, social skills, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/css/tailwind.min.css" />
        <meta name="robots" content="noindex" />
      </head>
      <body>{children}</body>
    </html>
  );
}
