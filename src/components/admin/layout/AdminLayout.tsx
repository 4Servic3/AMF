"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
export default function AdminLayout({
  children,
  name,
  allowedKeys,
}: {
  children: React.ReactNode;
  name: string;
  allowedKeys: string[];
}) {
  const [open, setOpen] = useState(false),
    [collapsed, setCollapsed] = useState(false);
  return (
    <div className="amf-admin-ui flex h-dvh w-full overflow-hidden">
      <Sidebar
        isOpen={open}
        setIsOpen={setOpen}
        isCollapsed={collapsed}
        setIsCollapsed={setCollapsed}
        name={name}
        allowedKeys={allowedKeys}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          toggleSidebar={() => setOpen(!open)}
          allowedKeys={allowedKeys}
        />
        <main
          id="admin-content"
          className="amf-admin-main flex-1 overflow-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
