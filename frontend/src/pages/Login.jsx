import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Label, Alert, Spinner } from '../components/ui';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            login(data.token);

            const payload = JSON.parse(atob(data.token.split('.')[1]));
            if (payload.role === 'Developer') {
                navigate('/developer');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(243,75%,59%)] via-[hsl(262,83%,58%)] to-[hsl(280,80%,45%)] animate-gradient" />

            {/* Decorative circles */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-md px-4 animate-fade-in">
                {/* Logo / Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md mb-4 shadow-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Sprint Tracker</h1>
                    <p className="text-white/70 mt-2 text-sm">Unified Sprint Tracking Web Portal</p>
                </div>

                {/* Login Card */}
                <Card glass className="animate-pulse-glow">
                    <div className="p-8">
                        <h2 className="text-xl font-bold text-center mb-6">Welcome Back</h2>

                        {error && (
                            <Alert variant="error" className="mb-4 animate-slide-down">
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <Label>Username</Label>
                                <Input
                                    id="login-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <Label>Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                            <Button id="login-submit" type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <><Spinner className="mr-2" /> Signing in...</> : 'Sign In'}
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    );
}
