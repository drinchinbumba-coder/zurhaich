import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Зурхайч - Өөрийгөө таних ухаан",
  description: "Монгол · Өрнийн · Тооны зурхай · Алганы үзэх · Хосын харилцаа · Мөнгөний зурхай · AI шинжилгээ",
  icons: { icon: "/zurhaich-logo.png", apple: "/zurhaich-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
