import './globals.css';

export const metadata = {
  title: 'Prompt.OS',
  description: 'พื้นที่พัฒนาพรอมต์ พร้อมการรันแบบสตรีมและการซิงก์ข้อมูลบนคลาวด์',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
