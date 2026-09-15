import "./admin-ui.css";
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="amf-admin-ui min-h-dvh">{children}</div>;
}
