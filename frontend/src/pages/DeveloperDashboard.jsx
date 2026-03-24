import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Select, Badge, StatCard, Spinner, TimeRangeToggle, StoryDetailModal, sprintToDate } from '../components/ui';

const API = 'http://localhost:5000/api';

const latestSprint = (stories) => {
    const ids = [...new Set(stories.map(s => s.sprint_id).filter(Boolean))];
    return ids.sort((a, b) => b.localeCompare(a))[0] ?? '';
};

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

export default function DeveloperDashboard() {
    const { user } = useAuth();

    const [allStories, setAllStories]       = useState([]);
    const [sprints, setSprints]             = useState([]);
    const [isLoading, setIsLoading]         = useState(true);
    const [selectedSprint, setSelectedSprint] = useState('');
    const [timeRange, setTimeRange]           = useState('sprint');
    const [selectedStory, setSelectedStory]   = useState(null);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [storiesRes, sprintsRes] = await Promise.all([
                fetch(`${API}/stories`,  { headers: { Authorization: `Bearer ${user.token}` } }),
                fetch(`${API}/sprints`,  { headers: { Authorization: `Bearer ${user.token}` } }),
            ]);
            const [storiesData, sprintsData] = await Promise.all([
                storiesRes.json(), sprintsRes.json()
            ]);

            const stories = Array.isArray(storiesData) ? storiesData : [];
            const sortedSprints = Array.isArray(sprintsData)
                ? [...sprintsData].sort((a, b) => b.localeCompare(a))
                : [];

            setAllStories(stories);
            setSprints(sortedSprints);
            setSelectedSprint(latestSprint(stories));
        } catch (e) {
            console.error('Failed to load developer dashboard', e);
        } finally {
            setIsLoading(false);
        }
    };

    const displayedStories = useMemo(
        () => applyTimeRange(allStories, timeRange, selectedSprint),
        [allStories, timeRange, selectedSprint]
    );

    const handleTimeRange = (range) => {
        setTimeRange(range);
        if (range === 'sprint') setSelectedSprint(latestSprint(allStories));
    };

    const exportCSV = () => {
        if (displayedStories.length === 0) return;
        const headers = ['Story ID', 'Sprint', 'Title', 'Type', 'State', 'Remarks'];
        const escape = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
        const rows = displayedStories.map(s =>
            [s.story_id, escape(s.sprint_id), escape(s.title), escape(s.work_item_type), escape(s.state), escape(s.status_remarks)].join(',')
        );
        const csvContent = [headers.join(','), ...rows].join('\r\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my_stories_${selectedSprint || timeRange}_${Date.now()}.csv`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Stats
    const totalStories  = displayedStories.length;
    const activeCount   = displayedStories.filter(s => s.state === 'Active').length;
    const resolvedCount = displayedStories.filter(s => s.state === 'Resolved' || s.state === 'Closed').length;
    const lastSprintLabel = latestSprint(allStories) || '—';

    const stateBadgeVariant = (state) => {
        switch (state) {
            case 'Active':   return 'warning';
            case 'Resolved': return 'success';
            case 'Closed':   return 'primary';
            case 'Removed':  return 'destructive';
            default:         return 'default';
        }
    };

    const sprintDropdownDisabled = timeRange !== 'sprint';

    return (
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">My Sprint Dashboard</h1>
                    <p className="text-[hsl(var(--muted-foreground))] mt-1">Personal view of your submitted stories.</p>
                </div>
                <Button id="export-csv-btn" onClick={exportCSV} disabled={displayedStories.length === 0}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Export CSV
                </Button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
                <StatCard label="My Stories" value={totalStories} color="primary"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/></svg>}
                />
                <StatCard label="Active" value={activeCount} color="warning"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                />
                <StatCard label="Resolved" value={resolvedCount} color="success"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                />
                <StatCard label="Last Sprint" value={lastSprintLabel} color="info"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>}
                />
            </div>

            {/* Time Range Toggle + Sprint Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 animate-fade-in">
                <TimeRangeToggle value={timeRange} onChange={handleTimeRange} />
                <div className="flex items-center gap-3">
                    <label className={`text-sm font-medium whitespace-nowrap ${sprintDropdownDisabled ? 'opacity-40' : ''}`}>
                        Sprint:
                    </label>
                    <Select
                        value={selectedSprint}
                        onChange={(e) => setSelectedSprint(e.target.value)}
                        disabled={sprintDropdownDisabled}
                        className={`w-44 ${sprintDropdownDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                        {sprints.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="">All Sprints</option>
                    </Select>
                </div>
            </div>

            {/* Stories Table */}
            <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Spinner className="w-8 h-8" />
                            <span className="ml-3 text-[hsl(var(--muted-foreground))]">Loading your stories...</span>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">ID</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Sprint</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Title</th>
                                    <th className="text-left p-3 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wider">Type</th>
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
                                        <td className="p-3 max-w-xs"><p className="truncate" title={s.title}>{s.title}</p></td>
                                        <td className="p-3">
                                            <Badge variant={s.work_item_type === 'Issue' ? 'destructive' : s.work_item_type === 'Feature' ? 'primary' : 'default'}>
                                                {s.work_item_type}
                                            </Badge>
                                        </td>
                                        <td className="p-3"><Badge variant={stateBadgeVariant(s.state)}>{s.state}</Badge></td>
                                        <td className="p-3 max-w-xs">
                                            <p className="truncate text-[hsl(var(--muted-foreground))]" title={s.status_remarks}>{s.status_remarks || '—'}</p>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" className="mb-3 opacity-50"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                <p className="text-[hsl(var(--muted-foreground))] font-medium">No stories found for this period</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">No stories assigned to you yet, or try a different time range</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {displayedStories.length > 0 && (
                    <div className="p-4 border-t border-[hsl(var(--border))] flex justify-between items-center text-sm text-[hsl(var(--muted-foreground))]">
                        <span>Showing {displayedStories.length} personal {displayedStories.length === 1 ? 'story' : 'stories'}</span>
                        <span>{timeRange === 'sprint' ? (selectedSprint || 'All sprints') : timeRange === '3mo' ? 'Last 3 months' : 'Last 1 year'}</span>
                    </div>
                )}
            </Card>

            {/* Story Detail Modal */}
            <StoryDetailModal story={selectedStory} onClose={() => setSelectedStory(null)} />
        </div>
    );
}
