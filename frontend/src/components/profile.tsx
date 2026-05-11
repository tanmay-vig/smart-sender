'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { BASE_URL } from '../config'

interface UserProfile {
  email: string
  name: string
  contact: string
  linkedIn: string
  company?: string
  position?: string
  appPassword?: string
}

export default function ProfileComponent() {
  const [profile, setProfile] = useState<UserProfile>({
    email: '',
    name: '',
    contact: '',
    linkedIn: '',
    company: '',
    position: '',
    appPassword: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load profile from localStorage
    const userEmail = localStorage.getItem('userEmail')
    const userName = localStorage.getItem('userName')
    const contact = localStorage.getItem('contact')
    const linkedIn = localStorage.getItem('linkedIn')
    const company = localStorage.getItem('company')
    const position = localStorage.getItem('position')
    const appPassword = localStorage.getItem('appPassword')

    setProfile({
      email: userEmail || '',
      name: userName || '',
      contact: contact || '',
      linkedIn: linkedIn || '',
      company: company || '',
      position: position || '',
      appPassword: appPassword || ''
    })
  }, [])

  const handleSave = async () => {
    // Check if user is properly logged in
    if (!profile.email) {
      toast.error('Please log in first to update your profile')
      return
    }

    // Validate required fields
    if (!profile.name || profile.name.trim() === '') {
      toast.error('Name is required. Please enter your name.')
      return
    }

    if (!profile.email || profile.email.trim() === '') {
      toast.error('Email is required. Please log in again.')
      return
    }

    setLoading(true)
    try {
      console.log('Saving profile data:', { 
        email: profile.email, 
        name: profile.name, 
        contact: profile.contact, 
        linkedIn: profile.linkedIn, 
        company: profile.company, 
        position: profile.position,
        hasAppPassword: !!profile.appPassword
      });

      // Save to backend database
      const response = await fetch(`${BASE_URL}/api/userlogin/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 404) {
          throw new Error("User not found. Please log out and log in again to refresh your account.")
        }
        throw new Error(errorData.error || 'Failed to save profile')
      }

      const result = await response.json()
      console.log('Profile update result:', result)

      // Save to localStorage only after successful backend save
      localStorage.setItem('userEmail', profile.email)
      localStorage.setItem('userName', profile.name)
      localStorage.setItem('contact', profile.contact)
      localStorage.setItem('linkedIn', profile.linkedIn)
      if (profile.company) localStorage.setItem('company', profile.company)
      if (profile.position) localStorage.setItem('position', profile.position)
      if (profile.appPassword) localStorage.setItem('appPassword', profile.appPassword)

      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error: any) {
      console.error('Profile save error:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number
            </label>
            <input
              type="tel"
              value={profile.contact}
              onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Profile
            </label>
            <input
              type="url"
              value={profile.linkedIn}
              onChange={(e) => setProfile({ ...profile, linkedIn: e.target.value })}
              disabled={!isEditing}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <input
              type="text"
              value={profile.position}
              onChange={(e) => setProfile({ ...profile, position: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gmail App Password
            </label>
            <input
              type="password"
              value={profile.appPassword}
              onChange={(e) => setProfile({ ...profile, appPassword: e.target.value })}
              disabled={!isEditing}
              placeholder="Your Gmail App Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used to send emails from your Gmail account. Get this from Google Account → Security → 2-Step Verification → App passwords
            </p>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 