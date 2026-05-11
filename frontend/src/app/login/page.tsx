'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BASE_URL } from "../../../src/config"
import { toast } from 'react-toastify'

interface UserProfile {
  email: string
  name: string
  contact: string
  linkedIn: string
  company?: string
  position?: string
  appPassword?: string
}

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [showProfileForm, setShowProfileForm] = useState(false)
    const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google')
    const [googleClientId, setGoogleClientId] = useState<string>('')
    const [loginCredentials, setLoginCredentials] = useState({
        email: '',
        password: ''
    })
    const [profile, setProfile] = useState<UserProfile>({
        email: '',
        name: '',
        contact: '',
        linkedIn: '',
        company: '',
        position: '',
        appPassword: ''
    })
    const router = useRouter()

    // Fetch Google client ID from backend
    useEffect(() => {
        const fetchGoogleConfig = async () => {
            try {
                console.log('Fetching Google config from:', `${BASE_URL}/api/google-config`)
                const res = await fetch(`${BASE_URL}/api/google-config`)
                console.log('Response status:', res.status)
                if (res.ok) {
                    const config = await res.json()
                    console.log('Google config received:', config)
                    if (config.clientId && config.clientId !== 'your_google_client_id_here') {
                        setGoogleClientId(config.clientId)
                    } else {
                        console.error('Google client ID not configured properly')
                        toast.error('Google Sign-In not configured. Please contact administrator.')
                    }
                } else {
                    console.error('Failed to fetch Google config:', res.status)
                    toast.error('Failed to load Google Sign-In configuration')
                }
            } catch (err) {
                console.error('Failed to fetch Google config:', err)
                toast.error('Failed to load Google Sign-In configuration')
            }
        }
        fetchGoogleConfig()
    }, [])

    const handleGoogleSignIn = useCallback(async (response: { credential: string }) => {
        setIsLoading(true)
        try {
            // Decode the JWT token to get user info
            const payload = JSON.parse(atob(response.credential.split('.')[1]))
            
            // Check if user exists in our database
            const checkUserRes = await fetch(`${BASE_URL}/api/userlogin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: payload.email,
                    googleId: payload.sub,
                    name: payload.name,
                    picture: payload.picture
                })
            })

            const userData = await checkUserRes.json()

            if (checkUserRes.status === 200) {
                // User exists, load their profile
                if (userData.profile) {
                    setProfile(userData.profile)
                    localStorage.setItem('userEmail', userData.profile.email)
                    localStorage.setItem('userName', userData.profile.name)
                    localStorage.setItem('contact', userData.profile.contact || '')
                    localStorage.setItem('linkedIn', userData.profile.linkedIn || '')
                    localStorage.setItem('company', userData.profile.company || '')
                    localStorage.setItem('position', userData.profile.position || '')
                    if (userData.profile.appPassword) {
                        localStorage.setItem('appPassword', userData.profile.appPassword)
                    }
                    toast.success('Login successful!')
                    router.push('/dashboard')
                } else {
                    // User exists but no profile, create one
                    setProfile({
                        email: payload.email,
                        name: payload.name,
                        contact: '',
                        linkedIn: '',
                        company: '',
                        position: '',
                        appPassword: ''
                    })
                    setShowProfileForm(true)
                }
            } else if (checkUserRes.status === 201) {
                // New user, create profile
                setProfile({
                    email: payload.email,
                    name: payload.name,
                    contact: '',
                    linkedIn: '',
                    company: '',
                    position: '',
                    appPassword: ''
                })
                setShowProfileForm(true)
            } else {
                toast.error('Login failed. Please try again.')
            }
        } catch (err) {
            console.error('Google Sign-In error:', err)
            toast.error('Google Sign-In failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [router])

    // Initialize Google Sign-In
    useEffect(() => {
        if (!googleClientId) {
            console.log('Google client ID not available yet')
            return
        }

        console.log('Initializing Google Sign-In with client ID:', googleClientId)

        // Load Google Identity Services for real Google Sign-In
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        document.head.appendChild(script)

        script.onload = () => {
            console.log('Google script loaded')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const google = (window as any).google
            if (google && google.accounts && google.accounts.id) {
                console.log('Google object available, initializing...')
                google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: handleGoogleSignIn
                })
                google.accounts.id.renderButton(
                    document.getElementById('google-signin-button'),
                    { 
                        theme: 'outline', 
                        size: 'large', 
                        width: '100%'
                    }
                )
                console.log('Google Sign-In initialized successfully')
            } else {
                console.error('Google object not available after script load')
                toast.error('Failed to initialize Google Sign-In')
            }
        }

        script.onerror = () => {
            console.error('Failed to load Google script')
            toast.error('Failed to load Google Sign-In script')
        }

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script)
            }
        }
    }, [googleClientId, handleGoogleSignIn])

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Validate email and password
            if (!loginCredentials.email || !loginCredentials.password) {
                toast.error('Please enter both email and password')
                return
            }

            console.log('🔐 Attempting to authenticate user:', loginCredentials.email);

            // Authenticate user with backend
            const authRes = await fetch(`${BASE_URL}/api/authenticate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: loginCredentials.email,
                    password: loginCredentials.password
                })
            })

            if (authRes.status === 200) {
                const userData = await authRes.json()
                console.log('✅ Authentication successful:', userData);

                // Load user profile if it exists
                if (userData.profile) {
                    setProfile(userData.profile)
                    localStorage.setItem('userEmail', userData.profile.email)
                    localStorage.setItem('userName', userData.profile.name)
                    localStorage.setItem('contact', userData.profile.contact || '')
                    localStorage.setItem('linkedIn', userData.profile.linkedIn || '')
                    localStorage.setItem('company', userData.profile.company || '')
                    localStorage.setItem('position', userData.profile.position || '')
                    if (userData.profile.appPassword) {
                        localStorage.setItem('appPassword', userData.profile.appPassword)
                    }
                    toast.success('Login successful!')
                    router.push('/dashboard')
                } else {
                    // User authenticated but no profile exists, create one
                    setProfile({
                        email: userData.email,
                        name: userData.name,
                        contact: '',
                        linkedIn: '',
                        company: '',
                        position: '',
                        appPassword: ''
                    })
                    setShowProfileForm(true)
                }
            } else {
                const error = await authRes.json()
                console.error('❌ Authentication failed:', error);
                toast.error(error.error || 'Invalid email or password')
            }
        } catch (err) {
            console.error('Email login error:', err)
            toast.error('Login failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch(`${BASE_URL}/api/userlogin/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            })

            if (res.ok) {
                // Save to localStorage
                localStorage.setItem('userEmail', profile.email)
                localStorage.setItem('userName', profile.name)
                localStorage.setItem('contact', profile.contact)
                localStorage.setItem('linkedIn', profile.linkedIn)
                if (profile.company) localStorage.setItem('company', profile.company)
                if (profile.position) localStorage.setItem('position', profile.position)
                if (profile.appPassword) localStorage.setItem('appPassword', profile.appPassword)

                toast.success('Profile saved successfully!')
                router.push('/dashboard')
            } else {
                const error = await res.json()
                toast.error(error.message || 'Failed to save profile')
            }
        } catch (err) {
            console.error('Profile save error:', err)
            toast.error('Failed to save profile. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-custom-lightblue px-4">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
                {!showProfileForm ? (
                    // Login Options
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome to SmartSender</h1>
                            <p className="text-gray-600 text-sm sm:text-base">Choose your login method</p>
                        </div>

                        {/* Login Method Tabs */}
                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setLoginMethod('google')}
                                className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition ${
                                    loginMethod === 'google' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Google Sign-In
                            </button>
                            <button
                                onClick={() => setLoginMethod('email')}
                                className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition ${
                                    loginMethod === 'email' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Email Login
                            </button>
                        </div>

                        {loginMethod === 'google' ? (
                            // Google Sign-In
                            <div className="space-y-4">
                                {googleClientId ? (
                                    <div id="google-signin-button" className="w-full"></div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <p className="mt-2 text-sm text-gray-600">Loading Google Sign-In...</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            If this takes too long, try using Email Login instead
                                        </p>
                                    </div>
                                )}
                                
                                <div className="text-center text-xs sm:text-sm text-gray-500">
                                    <p>Sign in with your Google account</p>
                                    <p>Your profile will be created automatically</p>
                                </div>
                            </div>
                        ) : (
                            // Email Login
                            <form onSubmit={handleEmailLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={loginCredentials.email}
                                        onChange={(e) => setLoginCredentials({...loginCredentials, email: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        required
                                        placeholder="your-email@gmail.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={loginCredentials.password}
                                        onChange={(e) => setLoginCredentials({...loginCredentials, password: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        required
                                        placeholder="Your password"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                                >
                                    {isLoading ? 'Signing In...' : 'Sign In with Email'}
                                </button>
                            </form>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <p className="mt-2 text-sm text-gray-600">Signing in...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Profile Creation Form
                    <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
                            <p className="text-gray-600 text-sm sm:text-base">Add your contact information for email signatures</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({...profile, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                required
                                placeholder="Your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                            <input
                                type="tel"
                                value={profile.contact}
                                onChange={(e) => setProfile({...profile, contact: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Your phone number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                            <input
                                type="url"
                                value={profile.linkedIn}
                                onChange={(e) => setProfile({...profile, linkedIn: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="https://linkedin.com/in/yourprofile"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
                            <input
                                type="text"
                                value={profile.company || ''}
                                onChange={(e) => setProfile({...profile, company: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Your company name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Position (Optional)</label>
                            <input
                                type="text"
                                value={profile.position || ''}
                                onChange={(e) => setProfile({...profile, position: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Your job title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gmail App Password (Optional)</label>
                            <input
                                type="password"
                                value={profile.appPassword || ''}
                                onChange={(e) => setProfile({...profile, appPassword: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Your Gmail App Password"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This will be used to send emails from your Gmail account. Get this from Google Account → Security → 2-Step Verification → App passwords
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                        >
                            {isLoading ? 'Saving Profile...' : 'Complete Profile'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}