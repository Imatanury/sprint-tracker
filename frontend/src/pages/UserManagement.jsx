import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Label, Select, Alert, Modal, Spinner, Badge } from '../components/ui';
import AdminResetPasswordModal from '../components/AdminResetPasswordModal';
import { KeyRound } from 'lucide-react';
import { API_BASE } from '../lib/api';
const API = `${API_BASE}/api`;

export default function UserManagement() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [resetTargetUser, setResetTargetUser] = useState(null);

    // New user form
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        role: 'Developer',
        team_id: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchTeams();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API}/users`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (!res.ok) {
                const text = await res.text();
                let message = 'An unexpected error occurred.';
                try { message = JSON.parse(text).message || message; } catch {}
                throw new Error(message);
            }
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to fetch users', e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const res = await fetch(`${API}/teams`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (!res.ok) {
                const text = await res.text();
                let message = 'An unexpected error occurred.';
                try { message = JSON.parse(text).message || message; } catch {}
                throw new Error(message);
            }
            const data = await res.json();
            setTeams(data);
        } catch (e) {
            console.error('Failed to fetch teams', e);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        try {
            const res = await fetch(`${API}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify(newUser)
            });

            if (!res.ok) {
                const text = await res.text();
                let message = 'An unexpected error occurred.';
                try { message = JSON.parse(text).message || message; } catch {}
                throw new Error(message);
            }
            const data = await res.json();

            setMessage({ text: `User "${data.username}" created successfully!`, type: 'success' });
            setShowModal(false);
            setNewUser({ username: '', password: '', role: 'Developer', team_id: '' });
            fetchUsers();
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        }
    };

    const handleDelete = async (userId, username) => {
        if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`${API}/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            });

            if (!res.ok) {
                const text = await res.text();
                let message = 'An unexpected error occurred.';
                try { message = JSON.parse(text).message || message; } catch {}
                throw new Error(message);
            }
            const data = await res.json();

            setMessage({ text: `User "${username}" deleted.`, type: 'success' });
            fetchUsers();
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        }
    };

    const roleBadge = (role) => {
        switch (role) {
            case 'Admin': return 'primary';
            case 'Lead': return 'warning';
            case 'Developer': return 'success';
            default: return 'default';
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-[hsl(var(--muted-foreground))] mt-1">Manage team members and their access roles.</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
                    Add User
                </Button>
            </div>

            {message.text && (
                <Alert variant={message.type} className="mb-4 animate-slide-down">
                    {message.text}
                </Alert>
            )}

            <Card className="animate-fade-in">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Spinner className="w-8 h-8" />
                            <span className="ml-3 text-[hsl(var(--muted-foreground))]">Loading users...</span>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">ID</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Username</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Role</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Team</th>
                                    <th className="text-right p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, i) => (
                                    <tr key={u.id}
                                        className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))]/50 transition-colors ${i % 2 === 0 ? '' : 'bg-[hsl(var(--secondary))]/30'}`}
                                    >
                                        <td className="p-3 font-mono text-xs">{u.id}</td>
                                        <td className="p-3 font-medium">{u.username}</td>
                                        <td className="p-3"><Badge variant={roleBadge(u.role)}>{u.role}</Badge></td>
                                        <td className="p-3 text-[hsl(var(--muted-foreground))]">{u.team_name || '—'}</td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setResetTargetUser({ id: u.id, username: u.username })}
                                                    className="text-[hsl(var(--muted-foreground))] hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-2"
                                                    title="Reset Password"
                                                >
                                                    <KeyRound size={16} />
                                                </Button>
                                                {u.id !== user.id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(u.id, u.username)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
                                                        title="Delete User"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="p-4 border-t border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
                    {users.length} users total
                </div>
            </Card>

            {/* Create User Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New User">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <Label>Username</Label>
                        <Input
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            placeholder="Enter username"
                            required
                        />
                    </div>
                    <div>
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    <div>
                        <Label>Role</Label>
                        <Select
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <option value="Developer">Developer</option>
                            <option value="Lead">Lead</option>
                            <option value="Admin">Admin</option>
                        </Select>
                    </div>
                    <div>
                        <Label>Team {newUser.role === 'Developer' ? '*' : '(optional)'}</Label>
                        <Select
                            value={newUser.team_id}
                            onChange={(e) => setNewUser({ ...newUser, team_id: e.target.value })}
                            required={newUser.role === 'Developer'}
                        >
                            <option value="">No team</option>
                            {teams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1">Create User</Button>
                    </div>
                </form>
            </Modal>

            <AdminResetPasswordModal 
                targetUser={resetTargetUser} 
                onClose={() => setResetTargetUser(null)} 
                onSuccess={(msg) => setMessage({ text: msg, type: 'success' })} 
            />
        </div>
    );
}
