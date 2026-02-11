'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSignUp, setIsSignUp] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                alert('Check your email for the confirmation link!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                router.push('/dashboard')
                router.refresh()
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
                <p className="subtitle">{isSignUp ? 'Join us today' : 'Sign in to your account'}</p>

                <form onSubmit={handleAuth}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
                    </button>
                </form>

                <div className="toggle-auth">
                    <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
                    <button onClick={() => setIsSignUp(!isSignUp)} className="btn-link">
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>
            </div>

            <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        .login-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
          text-align: center;
        }
        h1 {
          color: #333;
          margin-bottom: 8px;
          font-size: 2rem;
        }
        .subtitle {
          color: #666;
          margin-bottom: 30px;
        }
        .input-group {
          text-align: left;
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 8px;
          color: #444;
          font-weight: 500;
        }
        input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        .btn-primary {
          width: 100%;
          padding: 14px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
        }
        .btn-primary:hover {
          background: #5a67d8;
          transform: translateY(-2px);
        }
        .btn-primary:disabled {
          background: #a3bffa;
          cursor: not-allowed;
        }
        .error-message {
          color: #e53e3e;
          background: #fff5f5;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }
        .toggle-auth {
          margin-top: 25px;
          font-size: 0.9rem;
          color: #666;
        }
        .btn-link {
          background: none;
          border: none;
          color: #667eea;
          font-weight: 600;
          margin-left: 5px;
          cursor: pointer;
        }
        .btn-link:hover {
          text-decoration: underline;
        }
      `}</style>
        </div>
    )
}
