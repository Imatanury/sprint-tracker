import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Select, Badge, StatCard, Spinner, TimeRangeToggle, StoryDetailModal, sprintToDate, Alert } from '../components/ui';
import DataClearModal from '../components/DataClearModal';
import { Trash2 } from 'lucide-react';
import { API_BASE } from '../lib/api';
const API = `${API_BASE}/api`;

/** Sort sprint IDs descending, e.g. "Sprint 26-06" > "Sprint 26-05" */
const latestSprint = (stories) => {
    const ids = [...new Set(stories.map(s => s.sprint_id).filter(Boolean))];
    return ids.sort((a, b) => b.localeCompare(a))[0] ?? '';
};

/** Filter stories by time range. 'sprint' uses selectedSprint; others use sprintToDate. */
const applyTimeRange = (stories, range, selectedSprint) => {
    if (range === 'sprint') {
        return selectedSprint ? stories.filter(s => s.sprint_id === selectedSprint) : stories;
    }
    const now = new Date();
    const cutoff = new Date(now);
    if (range === '3mo') cutoff.setDate(now.getDate() - 90);
    if (range === '1yr') cutoff.setDate(now.getDate() - 365);
    return stories.filter(s => {
        const d = sprintToDate(s.sprint_id);
        return d && d >= cutoff;
    });
};

export default function MasterDashboard() {
    const { user } = useAuth();
    const role = user?.role;

    const [allStories, setAllStories]     = useState([]);
    const [teams, setTeams]               = useState([]);
    const [sprints, setSprints]           = useState([]);
    const [isLoading, setIsLoading]       = useState(true);

    // Filters
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedSprint, setSelectedSprint] = useState('');
    const [timeRange, setTimeRange]         = useState('sprint');

    // Detail panel
    const [selectedStory, setSelectedStory] = useState(null);
    const [showDataClearModal, setShowDataClearModal] = useState(false);
    const [dashboardMessage, setDashboardMessage] = useState({ text: '', type: '' });

    // Fetch everything once on mount
    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [storiesRes, teamsRes, sprintsRes] = await Promise.all([
                fetch(`${API}/stories`, { headers: { Authorization: `Bearer ${user.token}` } }),
                fetch(`${API}/teams`,   { headers: { Authorization: `Bearer ${user.token}` } }),
                fetch(`${API}/sprints`, { headers: { Authorization: `Bearer ${user.token}` } }),
            ]);
            const checkRes = async (res) => {
                if (!res.ok) {
                    const text = await res.text();
                    let msg = 'An unexpected error occurred.';
                    try { msg = JSON.parse(text).message || msg; } catch {}
                    throw new Error(msg);
                }
                return res.json();
            };

            const [storiesData, teamsData, sprintsData] = await Promise.all([
                checkRes(storiesRes), checkRes(teamsRes), checkRes(sprintsRes)
            ]);

            const stories = Array.isArray(storiesData) ? storiesData : [];
            const sortedSprints = Array.isArray(sprintsData)
                ? [...sprintsData].sort((a, b) => b.localeCompare(a))
                : [];

            setAllStories(stories);
            setTeams(Array.isArray(teamsData) ? teamsData : []);
            setSprints(sortedSprints);

            // Default to most recent sprint
            const recent = latestSprint(stories);
            setSelectedSprint(recent);
        } catch (e) {
            console.error('Failed to load dashboard data', e);
        } finally {
            setIsLoading(false);
        }
    };

    // Derived: apply team filter (Admin only), then time range / sprint filter
    const displayedStories = useMemo(() => {
        let s = allStories;
        if (role === 'Admin' && selectedTeams.length > 0) {
            s = s.filter(story => selectedTeams.includes(story.team_id));
        }
        return applyTimeRange(s, timeRange, selectedSprint);
    }, [allStories, selectedTeams, timeRange, selectedSprint, role]);

    const toggleTeam = (teamId) => {
        setSelectedTeams(prev =>
            prev.includes(teamId) ? prev.filter(t => t !== teamId) : [...prev, teamId]
        );
    };

    const handleTimeRange = (range) => {
        setTimeRange(range);
        if (range === 'sprint') {
            // re-select most recent sprint when switching back
            setSelectedSprint(latestSprint(allStories));
        }
    };

    const exportCSV = () => {
        if (displayedStories.length === 0) return;
        const headers = ['Story ID', 'Sprint', 'Team', 'Area Path', 'Type', 'Title', 'Assigned To', 'State', 'Tags', 'Test Plan URL', 'Test Run URL', 'Status/Remarks'];
        const escape = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
        const rows = displayedStories.map(s => [
            s.story_id, escape(s.sprint_id), escape(s.team_name), escape(s.area_path),
            escape(s.work_item_type), escape(s.title), escape(s.assigned_to),
            escape(s.state), escape(s.tags), escape(s.test_plan_url),
            escape(s.test_run_url), escape(s.status_remarks)
        ].join(','));
        const csvContent = [headers.join(','), ...rows].join('\r\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sprint_report_${selectedSprint || timeRange}_${Date.now()}.csv`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Stats — computed from displayedStories
    const totalStories   = displayedStories.length;
    const activeCount    = displayedStories.filter(s => s.state === 'Active').length;
    const resolvedCount  = displayedStories.filter(s => s.state === 'Resolved' || s.state === 'Closed').length;
    const teamsReporting = new Set(displayedStories.map(s => s.team_id)).size;

    const stateBadgeVariant = (state) => {
        switch (state) {
            case 'Active':   return 'warning';
            case 'Resolved': return 'success';
            case 'Closed':   return 'primary';
            case 'New':      return 'default';
            case 'Removed':  return 'destructive';
            default:         return 'default';
        }
    };

    const leadTeamName = role === 'Lead'
        ? (teams.find(t => t.id === user.team_id)?.name ?? `Team #${user.team_id}`)
        : null;

    const sprintDropdownDisabled = timeRange !== 'sprint';

    return (
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Master Dashboard</h1>
                    <p className="text-[hsl(var(--muted-foreground))] mt-1">
                        {role === 'Admin' && 'Track all team sprint progress at a glance.'}
                        {role === 'Lead'  && `Showing stories for your team: ${leadTeamName ?? '…'}`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {role === 'Admin' && (
                        <Button 
                            variant="outline" 
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40 dark:hover:bg-red-900/20"
                            onClick={() => setShowDataClearModal(true)}
                        >
                            <Trash2 size={16} className="mr-2" />
                            Manage Data
                        </Button>
                    )}
                    <Button id="export-csv-btn" onClick={exportCSV} disabled={displayedStories.length === 0}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        Export CSV
                    </Button>
                </div>
            </div>

            {dashboardMessage.text && (
                <Alert variant={dashboardMessage.type} className="mb-6 animate-slide-down">
                    {dashboardMessage.text}
                </Alert>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
                <StatCard label="Total Stories" value={totalStories} color="primary"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/></svg>}
                />
                <StatCard label="Active" value={activeCount} color="warning"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                />
                <StatCard label="Resolved" value={resolvedCount} color="success"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                />
                <StatCard label="Teams Reporting" value={teamsReporting} color="info"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                />
            </div>

            {/* Time Range Toggle */}
            <div className="flex items-center gap-4 mb-4 animate-fade-in">
                <TimeRangeToggle value={timeRange} onChange={handleTimeRange} />
                {timeRange !== 'sprint' && (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        Showing all sprints within the selected period
                    </span>
                )}
            </div>

            {/* Filters */}
            <Card className="mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="p-5">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-4">Filters</h3>
                    <div className="flex flex-col lg:flex-row gap-5">
                        {/* Admin: multi-select team filter */}
                        {role === 'Admin' && (
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-2">Filter by Team</label>
                                <div className="flex flex-wrap gap-2">
                                    {teams.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => toggleTeam(t.id)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                                                selectedTeams.includes(t.id)
                                                    ? 'bg-gradient-to-r from-[hsl(243,75%,59%)] to-[hsl(262,83%,58%)] text-white shadow-md'
                                                    : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]/80'
                                            }`}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                    {selectedTeams.length > 0 && (
                                        <button
                                            onClick={() => setSelectedTeams([])}
                                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Lead: static team badge */}
                        {role === 'Lead' && (
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-2">Your Team</label>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-[hsl(243,75%,59%)] to-[hsl(262,83%,58%)] text-white shadow-md">
                                    {leadTeamName ?? '…'}
                                </span>
                            </div>
                        )}

                        {/* Sprint filter */}
                        <div className="w-full lg:w-56">
                            <label className={`block text-sm font-medium mb-2 ${sprintDropdownDisabled ? 'opacity-40' : ''}`}>
                                Filter by Sprint
                            </label>
                            <Select
                                value={selectedSprint}
                                onChange={(e) => setSelectedSprint(e.target.value)}
                                disabled={sprintDropdownDisabled}
                                className={sprintDropdownDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                            >
                                {sprints.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                                <option value="">All Sprints</option>
                            </Select>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Data Table */}
            <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Spinner className="w-8 h-8" />
                            <span className="ml-3 text-[hsl(var(--muted-foreground))]">Loading stories...</span>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">ID</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Sprint</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Team</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Title</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Type</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Assigned</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">State</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedStories.length > 0 ? displayedStories.map((s, i) => (
                                    <tr
                                        key={s.story_id}
                                        onClick={() => setSelectedStory(s)}
                                        className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))]/70 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-[hsl(var(--secondary))]/30'}`}
                                    >
                                        <td className="p-3 font-mono text-xs">{s.story_id}</td>
                                        <td className="p-3">{s.sprint_id}</td>
                                        <td className="p-3"><span className="font-medium">{s.team_name}</span></td>
                                        <td className="p-3 max-w-xs"><p className="truncate" title={s.title}>{s.title}</p></td>
                                        <td className="p-3">
                                            <Badge variant={s.work_item_type === 'Issue' ? 'destructive' : s.work_item_type === 'Feature' ? 'primary' : 'default'}>
                                                {s.work_item_type}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-[hsl(var(--muted-foreground))]">{s.assigned_to || '—'}</td>
                                        <td className="p-3"><Badge variant={stateBadgeVariant(s.state)}>{s.state}</Badge></td>
                                        <td className="p-3 max-w-xs">
                                            <p className="truncate text-[hsl(var(--muted-foreground))]" title={s.status_remarks}>{s.status_remarks || '—'}</p>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="8" className="p-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" className="mb-3 opacity-50"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                <p className="text-[hsl(var(--muted-foreground))] font-medium">No stories found for this period</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Try adjusting the time range or sprint filter</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                {displayedStories.length > 0 && (
                    <div className="p-4 border-t border-[hsl(var(--border))] flex justify-between items-center text-sm text-[hsl(var(--muted-foreground))]">
                        <span>Showing {displayedStories.length} stories</span>
                        {role === 'Admin' && (
                            <span>{selectedTeams.length > 0 ? `${selectedTeams.length} team(s) selected` : 'All teams'} • {timeRange === 'sprint' ? (selectedSprint || 'All sprints') : timeRange === '3mo' ? 'Last 3 months' : 'Last 1 year'}</span>
                        )}
                        {role === 'Lead' && (
                            <span>{leadTeamName} • {timeRange === 'sprint' ? (selectedSprint || 'All sprints') : timeRange === '3mo' ? 'Last 3 months' : 'Last 1 year'}</span>
                        )}
                    </div>
                )}
            </Card>

            <StoryDetailModal story={selectedStory} onClose={() => setSelectedStory(null)} />

            <DataClearModal 
                isOpen={showDataClearModal} 
                onClose={() => setShowDataClearModal(false)} 
                sprints={sprints} 
                onSuccess={(msg) => {
                    setDashboardMessage({ text: msg, type: 'success' });
                    fetchAll();
                    setTimeout(() => setDashboardMessage({ text: '', type: '' }), 5000);
                }} 
            />
        </div>
    );
}
