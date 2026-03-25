import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Label, Select, Alert, Spinner, Textarea, Badge } from '../components/ui';

const API = `${import.meta.env.VITE_API_BASE_URL}/api`;

export default function DeveloperForm() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        story_id: '',
        sprint_id: '',
        work_item_type: 'User Story',
        title: '',
        assigned_to: '',
        state: 'New',
        tags: '',
        test_plan_url: '',
        test_run_url: '',
        status_remarks: ''
    });
    const [teamInfo, setTeamInfo] = useState({ name: '', area_path: '' });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [recentStories, setRecentStories] = useState([]);

    useEffect(() => {
        // Fetch user team details
        fetch(`${API}/me`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.team) setTeamInfo(data.team);
            })
            .catch(() => {});

        // Fetch recent stories for this team
        fetchRecent();
    }, [user]);

    const fetchRecent = () => {
        fetch(`${API}/stories`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => setRecentStories(Array.isArray(data) ? data.slice(0, 5) : []))
            .catch(() => {});
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        setIsLoading(true);

        try {
            const response = await fetch(`${API}/stories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Submission failed');
            }

            setMessage({ text: '✅ Story submitted successfully!', type: 'success' });
            setFormData({
                ...formData,
                story_id: '',
                title: '',
                assigned_to: '',
                tags: '',
                test_plan_url: '',
                test_run_url: '',
                status_remarks: ''
            });
            fetchRecent();
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const stateOptions = ['New', 'Active', 'Resolved', 'Closed', 'Removed'];

    return (
        <div className="max-w-5xl mx-auto p-6 lg:p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold">Submit Sprint Update</h2>
                <p className="text-[hsl(var(--muted-foreground))] mt-1">Submit or update user stories for your team's sprint.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2">
                    <Card className="animate-fade-in">
                        <div className="p-6">
                            {/* Team Info Banner */}
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-[hsl(243,75%,59%)/0.08] to-[hsl(262,83%,58%)/0.08] border border-[hsl(243,75%,59%)/0.15] mb-6">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(243,75%,59%)] to-[hsl(262,83%,58%)] flex items-center justify-center text-white flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </div>
                                <div>
                                    <p className="font-semibold">{teamInfo.name || 'Loading...'}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{teamInfo.area_path || '—'}</p>
                                </div>
                            </div>

                            {message.text && (
                                <Alert variant={message.type} className="mb-4 animate-slide-down">
                                    {message.text}
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Row 1: IDs */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Work Item ID *</Label>
                                        <Input id="story-id-input" name="story_id" type="number" value={formData.story_id} onChange={handleChange} placeholder="e.g. 205185" required />
                                    </div>
                                    <div>
                                        <Label>Sprint ID *</Label>
                                        <Input id="sprint-id-input" name="sprint_id" value={formData.sprint_id} onChange={handleChange} placeholder="e.g. Sprint 26-04" required />
                                    </div>
                                </div>

                                {/* Row 2: Type & State */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Work Item Type *</Label>
                                        <Select name="work_item_type" value={formData.work_item_type} onChange={handleChange}>
                                            <option value="User Story">User Story</option>
                                            <option value="Issue">Issue</option>
                                            <option value="Feature">Feature</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>State</Label>
                                        <Select name="state" value={formData.state} onChange={handleChange}>
                                            {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </Select>
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <Label>Title *</Label>
                                    <Input id="story-title-input" name="title" value={formData.title} onChange={handleChange} placeholder="Brief description of the work item" required />
                                </div>

                                {/* Row 3: Assigned To & Tags */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Assigned To</Label>
                                        <Input name="assigned_to" value={formData.assigned_to} onChange={handleChange} placeholder="Developer name" />
                                    </div>
                                    <div>
                                        <Label>Tags</Label>
                                        <Input name="tags" value={formData.tags} onChange={handleChange} placeholder="Comma separated (e.g. Bug, UI)" />
                                    </div>
                                </div>

                                {/* Row 4: URLs */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Test Plan URL</Label>
                                        <Input name="test_plan_url" type="url" value={formData.test_plan_url} onChange={handleChange} placeholder="https://..." />
                                    </div>
                                    <div>
                                        <Label>Test Run URL</Label>
                                        <Input name="test_run_url" type="url" value={formData.test_run_url} onChange={handleChange} placeholder="https://..." />
                                    </div>
                                </div>

                                {/* Status Remarks */}
                                <div>
                                    <Label>Status / Remarks</Label>
                                    <Textarea
                                        name="status_remarks"
                                        value={formData.status_remarks}
                                        onChange={handleChange}
                                        placeholder="Any qualitative notes about progress, blockers, etc."
                                    />
                                </div>

                                <Button id="submit-story-btn" type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <><Spinner className="mr-2" /> Submitting...</> : 'Submit Story'}
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>

                {/* Sidebar: Recent Stories */}
                <div className="lg:col-span-1">
                    <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="p-5">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-4">Recent Submissions</h3>
                            {recentStories.length > 0 ? (
                                <div className="space-y-3">
                                    {recentStories.map(s => (
                                        <div key={s.story_id} className="p-3 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80 transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">#{s.story_id}</span>
                                                <Badge variant={s.state === 'Active' ? 'warning' : s.state === 'Resolved' ? 'success' : s.state === 'Closed' ? 'primary' : 'default'}>
                                                    {s.state}
                                                </Badge>
                                            </div>
                                            <p className="text-sm font-medium truncate" title={s.title}>{s.title}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.sprint_id}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">No stories yet.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
