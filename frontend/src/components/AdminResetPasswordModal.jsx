import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal, Button, Input, Label, Alert, Spinner } from './ui';
import { Eye, EyeOff } from 'lucide-react';

const API = `${import.meta.env.VITE_API_BASE_URL}/api`;

export default function AdminResetPasswordModal({ targetUser, onClose, onSuccess }) {
    const { user } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Reset state when modal opens for a new user
    useEffect(() => {
        if (targetUser) {
            setNewPassword('');
            setConfirmPassword('');
            setShowNew(false);
            setShowConfirm(false);
            setMessage({ text: '', type: '' });
        }
    }, [targetUser]);

    const handleClose = () => {
        onClose();
    };

    const validate = () => {
        if (!newPassword || !confirmPassword) return 'All fields are required.';
        if (newPassword.length < 8) return 'New password must be at least 8 characters.';
        if (newPassword !== confirmPassword) return 'Passwords do not match.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        
        const error = validate();
        if (error) {
            setMessage({ text: error, type: 'error' });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API}/users/${targetUser.id}/password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ newPassword, confirmPassword })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to reset password');

            if (onSuccess) {
                 onSuccess(`Password for @${targetUser.username} has been reset.`);
            }
            handleClose();
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const PasswordInput = ({ label, value, onChange, show, setShow }) => (
        <div className="mb-4 relative">
            <Label>{label}</Label>
            <div className="relative flex items-center">
                <Input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required
                    className="pr-10"
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors focus:outline-none"
                    tabIndex="-1"
                >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </div>
    );

    return (
        <Modal isOpen={!!targetUser} onClose={handleClose} title={`Reset Password for @${targetUser?.username}`}>
            {message.text && (
                <Alert variant={message.type} className="mb-4">
                    {message.text}
                </Alert>
            )}
            <form onSubmit={handleSubmit}>
                <PasswordInput label="New Password" value={newPassword} onChange={setNewPassword} show={showNew} setShow={setShowNew} />
                <PasswordInput label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} setShow={setShowConfirm} />

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>Cancel</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Spinner className="w-4 h-4 mr-2" />}
                        Reset Password
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
