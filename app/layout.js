import './globals.css';

export const metadata = {
  title: 'Patinhas de Ouro | Bate Ponto',
  description: 'Sistema inovador e automatizado para bater ponto e gerenciar horas.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
