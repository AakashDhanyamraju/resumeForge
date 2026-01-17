import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

type Mode = 'login' | 'signup';

interface Props {
    mode: Mode;
    onSubmit: (data: any) => Promise<void>;
    loading?: boolean;
}

export default function EmailPasswordForm({ mode, onSubmit, loading }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const getPasswordStrength = (password: string) => {
        if (!password) return { score: 0, label: '' };
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return { score };
    };

    const strength = getPasswordStrength(formData.password);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-slate-400"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-slate-400"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-slate-400 pr-10"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {mode === 'signup' && formData.password && (
                    <div className="mt-2 flex gap-1 h-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                            <div
                                key={level}
                                className={`flex-1 rounded-full transition-colors ${level <= strength.score
                                    ? strength.score < 3
                                        ? 'bg-red-500'
                                        : strength.score < 4
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                    : 'bg-slate-700'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {mode === 'signup' && (
                    <p className="text-xs text-slate-400 mt-1">
                        At least 8 chars, uppercase, lowercase, number & symbol
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-sky-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === 'login' ? (
                    'Sign In with Email'
                ) : (
                    'Create Account'
                )}
            </button>
        </form>
    );
}
