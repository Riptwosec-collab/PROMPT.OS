import './globals.css';

export const metadata = {
  title: 'Prompt.OS',
  description: 'Prompt development workspace with streaming runs and cloud sync',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
