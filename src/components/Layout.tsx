import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen w-screen bg-gradient-to-b from-white to-purple-400">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto bg-gradient-to-b from-purple-200 via-purple-300 to-purple-400">
          {children}
        </main>
      </div>
    </div>
  );
};
