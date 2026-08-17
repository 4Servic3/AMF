"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { getAdminNotifications, AdminNotification } from "@/app/admin/actions/notifications";

export function AdminNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<{ count: number, notifications: AdminNotification[] }>({ count: 0, notifications: [] });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAdminNotifications().then(setData).catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-cream-100 hover:text-white hover:bg-plum-800 rounded-lg relative transition-colors"
      >
        <Bell size={20} />
        {data.count > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-gold-500 rounded-full border-2 border-plum-900" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white text-ink rounded-md shadow-lg border border-border py-2 z-50">
          <div className="px-4 py-2 border-b border-border flex justify-between items-center">
            <h3 className="font-semibold text-sm">Notificações</h3>
            <span className="text-xs bg-cream-100 text-plum-900 px-2 py-0.5 rounded-full font-medium">
              {data.count} novas
            </span>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted">
                Nenhuma notificação no momento.
              </div>
            ) : (
              data.notifications.map(notification => (
                <Link 
                  key={notification.id} 
                  href={notification.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 hover:bg-cream-50 transition-colors border-b border-border last:border-0"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-plum-900">{notification.title}</span>
                    {!notification.read && <span className="w-2 h-2 bg-gold-500 rounded-full mt-1.5 shrink-0" /> }
                  </div>
                  <p className="text-xs text-muted mb-1">{notification.description}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
