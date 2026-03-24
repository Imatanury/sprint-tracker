import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DeveloperForm from './pages/DeveloperForm';
import DeveloperDashboard from './pages/DeveloperDashboard';
import MasterDashboard from './pages/MasterDashboard';
import UserManagement from './pages/UserManagement';
import { Button, Spinner } from './components/ui';

/* ─────────────────────── SIDEBAR NAV ─────────────────────── */
const Sidebar = ({ collapsed, setCollapsed }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const isLead = user?.role === 'Lead';

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive
                ? 'bg-gradient-to-r from-[hsl(243,75%,59%)] to-[hsl(262,83%,58%)] text-white shadow-md'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
        }`;

    return (
        <aside className={`fixed left-0 top-0 h-full bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] z-40 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} flex flex-col`}>
            {/* Brand */}
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[hsl(243,75%,59%)] to-[hsl(262,83%,58%)] flex items-center justify-center text-white flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>
                    </svg>
                </div>
                {!collapsed && <span className="font-bold text-sm whitespace-nowrap">Sprint Tracker</span>}
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-3 space-y-1">
                {(isAdmin || isLead) && (
                    <NavLink to="/dashboard" className={linkClass}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                        {!collapsed && <span>Dashboard</span>}
                    </NavLink>
                )}
                {user?.role === 'Developer' && (
                    <>
                        <NavLink to="/developer/dashboard" className={linkClass}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                            {!collapsed && <span>Dashboard</span>}
                        </NavLink>
                        <NavLink to="/developer" className={linkClass}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
                            {!collapsed && <span>Submit Update</span>}
                        </NavLink>
                    </>
                )}
                {isAdmin && (
                    <NavLink to="/admin/users" className={linkClass}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        {!collapsed && <span>Users</span>}
                    </NavLink>
                )}
            </nav>

            {/* Collapse Toggle */}
            <div className="p-3 border-t border-[hsl(var(--border))]">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}>
                        <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
                    </svg>
                </button>
            </div>
        </aside>
    );
};

/* ─────────────────────── TOP HEADER ─────────────────────── */
const TopBar = () => {
    const { user, logout } = useAuth();

    return (
        <header className="h-14 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] flex items-center justify-end px-6 gap-4">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(243,75%,59%)] to-[hsl(262,83%,58%)] flex items-center justify-center text-white text-xs font-bold">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium leading-none">{user.username}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.role}</p>
                    </div>
                </div>
                <Button onClick={logout} variant="ghost" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                </Button>
            </div>
        </header>
    );
};

/* ─────────────────────── LAYOUT WRAPPER ─────────────────────── */
const AppLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-[hsl(var(--background))]">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <div className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-60'}`}>
                <TopBar />
                <main className="min-h-[calc(100vh-3.5rem)]">
                    {children}
                </main>
            </div>
        </div>
    );
};

/* ─────────────────────── PRIVATE ROUTE ─────────────────────── */
const PrivateRoute = ({ children, roles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner className="w-8 h-8" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to={user.role === 'Developer' ? '/developer/dashboard' : '/dashboard'} replace />;
    }

    return <AppLayout>{children}</AppLayout>;
};

/* ─────────────────────── APP ─────────────────────── */
function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/developer" element={
                        <PrivateRoute roles={['Developer']}>
                            <DeveloperForm />
                        </PrivateRoute>
                    } />

                    <Route path="/developer/dashboard" element={
                        <PrivateRoute roles={['Developer']}>
                            <DeveloperDashboard />
                        </PrivateRoute>
                    } />

                    <Route path="/dashboard" element={
                        <PrivateRoute roles={['Admin', 'Lead']}>
                            <MasterDashboard />
                        </PrivateRoute>
                    } />

                    <Route path="/admin/users" element={
                        <PrivateRoute roles={['Admin']}>
                            <UserManagement />
                        </PrivateRoute>
                    } />

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
