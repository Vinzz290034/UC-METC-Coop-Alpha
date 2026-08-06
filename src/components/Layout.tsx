import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] w-full">
          <div className="w-full max-w-full animate-slide-in-right">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
