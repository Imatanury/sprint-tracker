import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal, Button, Input, Select, Alert, Spinner } from './ui';

import { API_BASE } from '../lib/api';
const API = `${API_BASE}/api`;

export default function DataClearModal({ isOpen, onClose, sprints, onSuccess }) {
    const { user } = useAuth();
    const [scope, setScope] = useState('sprint');
    const [selectedSprint, setSelectedSprint] = useState('');
    const [beforeDate, setBeforeDate] = useState('');
    const [confirmText, setConfirmText] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setScope('sprint');
            setSelectedSprint(sprints && sprints.length > 0 ? sprints[0] : '');
            setBeforeDate('');
            setConfirmText('');
            setMessage({ text: '', type: '' });
        }
    }, [isOpen, sprints]);

    const handleClose = () => {
        onClose();
    };

    const handleSubmit = async () => {
        if (confirmText !== 'DELETE') return;
        
        setMessage({ text: '', type: '' });
        setIsLoading(true);

        try {
            let url = '';
            let method = 'DELETE';
            let body = null;

            if (scope === 'sprint') {
                if (!selectedSprint) throw new Error('Please select a sprint.');
                url = `${API}/stories/sprint/${encodeURIComponent(selectedSprint)}`;
            } else if (scope === 'date') {
                if (!beforeDate) throw new Error('Please select a date.');
                url = `${API}/stories/before-date`;
                body = JSON.stringify({ beforeDate });
            } else if (scope === 'all') {
                url = `${API}/stories/all`;
            }

            const reqOptions = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                }
            };
            if (body) reqOptions.body = body;

            const res = await fetch(url, reqOptions);
            if (!res.ok) {
                const text = await res.text();
                let message = 'An unexpected error occurred.';
                try { message = JSON.parse(text).message || message; } catch {}
                throw new Error(message || 'Failed to delete data');
            }
            const data = await res.json();

            if (onSuccess) {
                onSuccess(`${data.deleted} stories deleted successfully.`);
            }
            handleClose();
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const isDeleteDisabled = confirmText !== 'DELETE' || isLoading;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="⚠️ Manage Sprint Data">
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                This action is permanent and cannot be undone.
            </p>

            {message.text && (
                <Alert variant={message.type} className="mb-4">
                    {message.text}
                </Alert>
            )}

            <div className="space-y-4 mb-6">
                <p className="font-semibold text-sm">Choose what to delete:</p>
                
                <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name="scope" value="sprint" checked={scope === 'sprint'} onChange={() => setScope('sprint')} className="mt-1" />
                    <div className="flex-1">
                        <span className="text-sm font-medium">Delete by Sprint</span>
                        {scope === 'sprint' && (
                            <div className="mt-2">
                                <Select value={selectedSprint} onChange={(e) => setSelectedSprint(e.target.value)}>
                                    {sprints && sprints.map(s => <option key={s} value={s}>{s}</option>)}
                                    {(!sprints || sprints.length === 0) && <option value="">No sprints available</option>}
                                </Select>
                            </div>
                        )}
                    </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name="scope" value="date" checked={scope === 'date'} onChange={() => setScope('date')} className="mt-1" />
                    <div className="flex-1">
                        <span className="text-sm font-medium">Delete by Date</span>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Delete all stories created before:</p>
                        {scope === 'date' && (
                            <div className="mt-2">
                                <Input type="date" value={beforeDate} onChange={(e) => setBeforeDate(e.target.value)} />
                            </div>
                        )}
                    </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name="scope" value="all" checked={scope === 'all'} onChange={() => setScope('all')} className="mt-1" />
                    <div className="flex-1">
                        <span className="text-sm font-medium">Clear All Data</span>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Permanently deletes every story record.</p>
                    </div>
                </label>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-4 rounded-lg mb-6">
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                    ⚠️ Type <span className="font-mono bg-red-100 dark:bg-red-900/40 px-1 rounded">DELETE</span> to confirm
                </p>
                <Input 
                    value={confirmText} 
                    onChange={(e) => setConfirmText(e.target.value)} 
                    placeholder="DELETE"
                    className="border-red-300 focus:ring-red-500"
                />
            </div>

            <div className="flex justify-between gap-3">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1">Cancel</Button>
                <Button type="button" variant="destructive" onClick={handleSubmit} disabled={isDeleteDisabled} className="flex-1">
                    {isLoading && <Spinner className="w-4 h-4 mr-2 border-t-white" />}
                    Delete Data
                </Button>
            </div>
        </Modal>
    );
}
