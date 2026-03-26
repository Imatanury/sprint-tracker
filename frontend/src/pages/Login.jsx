import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';
import { Button, Input, Card, Label, Alert, Spinner } from '../components/ui';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isColdStartError, setIsColdStartError] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 3;
    const RETRY_DELAY_SECONDS = 30;

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isColdStartError) return;
        if (retryCountRef.current >= MAX_RETRIES) {
            setError('Server unavailable. Please try again in a few minutes.');
            setIsColdStartError(false);
            setCountdown(null);
            return;
        }

        let seconds = RETRY_DELAY_SECONDS;
        setCountdown(seconds);

        const interval = setInterval(() => {
            seconds -= 1;
            setCountdown(seconds);
            if (seconds <= 0) {
                clearInterval(interval);
                retryCountRef.current += 1;
                handleLogin();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isColdStartError]);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setIsColdStartError(false);
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');

            if (!response.ok) {
                if (!isJson) {
                    throw new Error('The server is waking up. Please wait 30 seconds and try again.');
                }
                const text = await response.text();
                let message = 'Login failed. Please try again.';
                try { message = JSON.parse(text).message || message; } catch {}
                throw new Error(message);
            }

            if (!isJson) {
                throw new Error('The server is waking up. Please wait 30 seconds and try again.');
            }

            const data = await response.json();

            login(data.token);

            const payload = JSON.parse(atob(data.token.split('.')[1]));
            if (payload.role === 'Developer') {
                navigate('/developer');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            if (err.message.includes('waking up')) {
                setIsColdStartError(true);
            } else {
                setError(err.message);
            }
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
                        
                        {isColdStartError && (
                            <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 animate-slide-down">
                                <p className="text-sm font-semibold mb-1 flex items-center">
                                    <Spinner className="w-4 h-4 mr-2 border-t-amber-800" /> Server is starting up...
                                </p>
                                <p className="text-xs mb-3">
                                    This takes up to 30 seconds on first load. Retrying in <span className="font-bold">{countdown}</span>s.
                                </p>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    className="w-full bg-white text-amber-800 border-amber-300 hover:bg-amber-100 hover:text-amber-900"
                                    onClick={() => {
                                        retryCountRef.current += 1;
                                        setCountdown(null);
                                        setIsColdStartError(false);
                                        handleLogin();
                                    }}
                                    disabled={isLoading}
                                >
                                    Retry Now
                                </Button>
                            </div>
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
