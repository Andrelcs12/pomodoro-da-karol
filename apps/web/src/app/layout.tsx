import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pomodoro da Karolzinha",
  description:
    "O cantinho da Karolzinha para focar nos estudos do ENEM, acompanhar sessões e evoluir um bloco de cada vez.",
  openGraph: {
    title: "Pomodoro da Karolzinha",
    description:
      "Um cantinho de foco para estudar para o ENEM, um bloco de cada vez.",
    siteName: "Pomodoro da Karolzinha",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
