import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-neutral-950 text-neutral-200 selection:bg-amber-500/30">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className="flex-1 lg:ml-64 w-full">
                {/* Mobile Header */}
                <div className="lg:hidden sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-900 px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-neutral-900 rounded-xl text-neutral-400 hover:text-white transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="text-sm font-black text-white uppercase tracking-widest">X-ICON GARAGE</h1>
                </div>

                <div className="p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
