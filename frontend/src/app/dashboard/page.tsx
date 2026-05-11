'use client'

import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { BASE_URL } from "../../../src/config"
import ProfileComponent from '../../components/profile'
import ProtectedRoute from '../../components/ProtectedRoute'
import { toast } from 'react-toastify'

interface ExcelRow {
  sno: number
  email: string
  name?: string
  company?: string
  [key: string]: string | number | undefined
}

interface SentEmail {
  id: string
  toEmail: string
  subject: string
  recipientName: string
  company: string
  status: 'pending' | 'sent' | 'failed'
  errorMessage?: string
  sentAt: string
  attachmentCount: number
  attachments: Array<{ filename: string; size: number }>
}

interface ScheduledEmail {
  _id: string
  id: string
  subject: string
  scheduledFor: string
  fromEmail: string
  recipientCount?: number
  status?: string
  sentAt?: string
  errorMessage?: string
}

export default function DashboardPage() {

  const [excelData, setExcelData] = useState<ExcelRow[]>([])
  const [sending, setSending] = useState(false)
  const [fromEmail, setFromEmail] = useState('')
  const [user, setUser] = useState('')
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')
  const [linkendIn, setLinkedIn] = useState('')
  const [contact, setContact] = useState('')
  const [mailStatus, setMailStatus] = useState('')
  const [perEmailStatus, setPerEmailStatus] = useState<
    { email: string; status: string }[]
  >([])
  const [attachments, setAttachments] = useState<File[]>([]);
  const [scheduledFor, setScheduledFor] = useState('')
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([])
  const [showAddEmailForm, setShowAddEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState({ name: '', email: '', company: '' })
  const [selectedEmails, setSelectedEmails] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [duplicateEmails, setDuplicateEmails] = useState<string[]>([])
  const [currentTab, setCurrentTab] = useState<'contacts' | 'compose' | 'scheduled' | 'sent' | 'uploaded'>('contacts')
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  // AI-related state
  const [useAI, setUseAI] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiPreviews, setAiPreviews] = useState<{ recipientEmail: string; subject: string; html: string }[]>([])
  const [generatingAI, setGeneratingAI] = useState(false)
  const [showAIPreview, setShowAIPreview] = useState(false)

  // Load user data from localStorage
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail')
    const userName = localStorage.getItem('userName')
    const userContact = localStorage.getItem('contact')
    const userLinkedIn = localStorage.getItem('linkedIn')

    console.log('🔍 Loading user data from localStorage:', { userEmail, userName, userContact, userLinkedIn });

    if (userEmail) setFromEmail(userEmail)
    if (userName) setUser(userName)
    if (userContact) setContact(userContact)
    if (userLinkedIn) setLinkedIn(userLinkedIn)
  }, [])

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTabClick = (tabName: 'contacts' | 'compose' | 'scheduled' | 'sent' | 'uploaded') => {
    setCurrentTab(tabName);

    // Auto-load data when switching to specific tabs
    if (tabName === 'sent' && fromEmail) {
      loadSentEmails(fromEmail);
    }
    if (tabName === 'scheduled' && fromEmail) {
      loadScheduledEmails(fromEmail);
    }
  };

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail')
    const userName = localStorage.getItem('userName')
    const contact = localStorage.getItem('contact')
    const linkendIn = localStorage.getItem('linkedIn')
    if (userEmail) setFromEmail(userEmail)
    if (userName) setUser(userName)
    if (contact) setContact(contact)
    if (linkendIn) setLinkedIn(linkendIn)

    // Load scheduled emails on component mount
    if (userEmail) {
      loadScheduledEmails(userEmail)
      loadSentEmails(userEmail)
    }

    // Update current time every second
    const timeInterval = setInterval(() => {
      // setCurrentTime(new Date()) // This line was removed
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  // Calculate unique emails whenever excelData changes
  useEffect(() => {
    if (excelData.length > 0) {
      // Update unique emails set
      const uniqueEmailSet = new Set<string>()
      const duplicates: string[] = []

      excelData.forEach(row => {
        const email = row.email?.toLowerCase().trim()
        if (email) {
          if (uniqueEmailSet.has(email)) {
            duplicates.push(email)
          } else {
            uniqueEmailSet.add(email)
          }
        }
      })

      setDuplicateEmails(duplicates)
    } else {
      setDuplicateEmails([])
    }
  }, [excelData])


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type)

    try {
      const formData = new FormData()
      formData.append('files', file)

      console.log('Sending request to:', `${BASE_URL}/api/upload`)

      const res = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      console.log('Response status:', res.status)

      if (res.ok) {
        const json = await res.json()
        console.log('Upload response:', json)

        const dataWithSerial = json.data.map((row: Record<string, string | number>, index: number) => ({
          sno: index + 1,
          ...row
        }))

        setExcelData(dataWithSerial)
        toast.success(`Successfully uploaded ${dataWithSerial.length} contacts!`)

        // Update unique emails set
        const uniqueEmailSet = new Set<string>()
        const duplicates: string[] = []

        dataWithSerial.forEach((row: ExcelRow) => {
          const email = row.email?.toLowerCase().trim()
          if (email) {
            if (uniqueEmailSet.has(email)) {
              duplicates.push(email)
            } else {
              uniqueEmailSet.add(email)
            }
          }
        })

        setDuplicateEmails(duplicates)

        if (duplicates.length > 0) {
          toast.warning(`Found ${duplicates.length} duplicate emails. Consider removing them before sending.`)
        }
      } else {
        const errorText = await res.text()
        console.error('Upload failed:', res.status, errorText)
        toast.error('Upload failed. Please try again.')
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Upload failed. Please try again.')
    }
  }
  const loadScheduledEmails = async (userEmail: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/scheduled?fromEmail=${encodeURIComponent(userEmail)}`)

      if (res.ok) {
        const json = await res.json()
        setScheduledEmails(json.emails || [])
      } else {
        let errorMessage = 'Failed to load scheduled emails'

        try {
          const errorData = await res.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          console.error('Error parsing scheduled emails response:', parseError)
        }

        console.error('Failed to load scheduled emails:', { status: res.status, errorMessage })
        setScheduledEmails([])
      }
    } catch (err: any) {
      console.error('Failed to load scheduled emails:', err)
      setScheduledEmails([])
    }
  };

  const loadSentEmails = async (userEmail: string) => {
    try {
      console.log('🔄 Loading sent emails for:', userEmail);
      const res = await fetch(`${BASE_URL}/api/sent-emails?fromEmail=${encodeURIComponent(userEmail)}`);

      console.log('📡 Sent emails API response status:', res.status);

      if (res.ok) {
        const json = await res.json();
        console.log('✅ Sent emails loaded:', json);
        setSentEmails(json.emails || []);
      } else {
        let errorMessage = 'Failed to load sent emails'

        try {
          const errorData = await res.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          console.error('Error parsing sent emails response:', parseError)
        }

        console.error('❌ Failed to load sent emails:', { status: res.status, errorMessage })
        setSentEmails([])
      }
    } catch (err: any) {
      console.error('💥 Error loading sent emails:', err);
      setSentEmails([])
    }
  };

  const handleSendMail = async () => {
    if (selectedEmails.length === 0) {
      alert('Please select at least one email to send.')
      return
    }

    // Filter data to only include selected emails
    const selectedData = selectedEmails.map(index => excelData[index])

    // Deduplicate emails - keep only unique emails
    const uniqueEmailMap = new Map<string, ExcelRow>()

    selectedData.forEach(row => {
      const email = row.email?.toLowerCase().trim()
      if (email && !uniqueEmailMap.has(email)) {
        uniqueEmailMap.set(email, row)
      }
    })

    const uniqueSelectedData = Array.from(uniqueEmailMap.values())

    setSending(true)

    const formData = new FormData()
    formData.append('fromEmail', fromEmail)
    formData.append('user', user)
    formData.append('xlsxData', JSON.stringify(uniqueSelectedData))
    formData.append('subject', subject)
    formData.append('text', text)
    formData.append('linkenIn', linkendIn)
    formData.append('contact', contact)
    formData.append('company', 'Zopsmart Technologies')

    // AI mode params
    if (useAI && aiPrompt) {
      formData.append('useAI', 'true')
      formData.append('aiPrompt', aiPrompt)
    }

    // Add attachments
    attachments.forEach((file) => {
      formData.append('attachments', file)
    })

    try {
      const res = await fetch(`${BASE_URL}/api/sendmail`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const json = await res.json()
        const duplicateCount = selectedData.length - uniqueSelectedData.length
        const message = duplicateCount > 0
          ? `Emails sent successfully! ${uniqueSelectedData.length} unique emails sent, ${duplicateCount} duplicates filtered out.`
          : `Emails sent successfully! ${uniqueSelectedData.length} emails sent.`
        setMailStatus(message)
        setPerEmailStatus(json.result || [])
        toast.success(message)

        // Refresh sent emails list after successful sending
        loadSentEmails(fromEmail)
      } else {
        // Enhanced error handling for different status codes
        let errorMessage = 'Failed to send emails'

        try {
          const errorData = await res.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }

          // Handle specific error types
          if (res.status === 400) {
            errorMessage = `Bad Request: ${errorData.error || 'Invalid request data'}`
          } else if (res.status === 401) {
            errorMessage = 'Authentication failed. Please check your credentials.'
          } else if (res.status === 404) {
            errorMessage = 'User not found. Please log in again.'
          } else if (res.status === 500) {
            if (errorData.error?.includes('App password')) {
              errorMessage = 'Gmail App Password not configured. Please set it up in your profile.'
            } else if (errorData.error?.includes('authentication')) {
              errorMessage = 'Gmail authentication failed. Please verify your app password.'
            } else if (errorData.error?.includes('User not found')) {
              errorMessage = 'User not found. Please log in again.'
            } else {
              errorMessage = `Server Error: ${errorData.error || 'Internal server error'}`
            }
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
          errorMessage = `Failed to send emails (Status: ${res.status})`
        }

        console.error('Send mail error:', { status: res.status, errorMessage })
        setMailStatus(errorMessage)
        setPerEmailStatus([])
        toast.error(errorMessage)
      }
    } catch (err: any) {
      console.error('Send error:', err)

      // Enhanced error handling for network and other errors
      let errorMessage = 'Failed to send emails. Please try again.'

      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.'
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`
      }

      setMailStatus(errorMessage)
      setPerEmailStatus([])
      toast.error(errorMessage)
    } finally {
      setSending(false)
    }
  }

  const handleScheduleMail = async () => {
    if (selectedEmails.length === 0) {
      alert('Please select at least one email to schedule.')
      return
    }

    if (!scheduledFor) {
      alert('Please select a date and time to schedule the email.')
      return
    }

    // Filter data to only include selected emails
    const selectedData = selectedEmails.map(index => excelData[index])

    // Deduplicate emails - keep only unique emails
    const uniqueEmailMap = new Map<string, ExcelRow>()

    selectedData.forEach(row => {
      const email = row.email?.toLowerCase().trim()
      if (email && !uniqueEmailMap.has(email)) {
        uniqueEmailMap.set(email, row)
      }
    })

    const uniqueSelectedData = Array.from(uniqueEmailMap.values())

    setSending(true)

    const formData = new FormData()
    formData.append('fromEmail', fromEmail)
    formData.append('user', user)
    formData.append('xlsxData', JSON.stringify(uniqueSelectedData))
    formData.append('subject', subject)
    formData.append('text', text)
    formData.append('linkenIn', linkendIn)
    formData.append('contact', contact)
    formData.append('company', 'Zopsmart Technologies')
    formData.append('scheduledFor', scheduledFor)

    // AI mode params
    if (useAI && aiPrompt) {
      formData.append('useAI', 'true')
      formData.append('aiPrompt', aiPrompt)
    }

    // Add attachments
    attachments.forEach((file) => {
      formData.append('attachments', file)
    })

    try {
      const res = await fetch(`${BASE_URL}/api/schedule`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const duplicateCount = selectedData.length - uniqueSelectedData.length
        const message = duplicateCount > 0
          ? `Email scheduled successfully! ${uniqueSelectedData.length} unique emails scheduled, ${duplicateCount} duplicates filtered out.`
          : `Email scheduled successfully! ${uniqueSelectedData.length} emails scheduled.`
        setMailStatus(message)
        setScheduledFor('')
        toast.success(message)
        // Reload scheduled emails
        if (fromEmail) {
          loadScheduledEmails(fromEmail)
        }
      } else {
        // Enhanced error handling for scheduling
        let errorMessage = 'Failed to schedule email'

        try {
          const errorData = await res.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }

          if (res.status === 400) {
            errorMessage = `Invalid request: ${errorData.error || 'Please check your input data'}`
          } else if (res.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.'
          } else if (res.status === 404) {
            errorMessage = 'User not found. Please log in again.'
          } else if (res.status === 500) {
            errorMessage = `Server error: ${errorData.error || 'Internal server error'}`
          }
        } catch (parseError) {
          console.error('Error parsing schedule response:', parseError)
          errorMessage = `Failed to schedule email (Status: ${res.status})`
        }

        console.error('Schedule error:', { status: res.status, errorMessage })
        setMailStatus(errorMessage)
        toast.error(errorMessage)
      }
    } catch (err: any) {
      console.error('Schedule error:', err)

      let errorMessage = 'Failed to schedule email. Please try again.'

      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.'
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`
      }

      setMailStatus(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSending(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter instructions for the AI to generate emails')
      return
    }
    if (selectedEmails.length === 0) {
      toast.error('Please select at least one contact first')
      return
    }

    setGeneratingAI(true)
    setAiPreviews([])

    try {
      // Send a small sample of recipients for preview (first 3 selected)
      const previewRecipients = selectedEmails.slice(0, 3).map(index => ({
        name: excelData[index]?.name || '',
        email: excelData[index]?.email || '',
        company: excelData[index]?.company || '',
      }))

      const res = await fetch(`${BASE_URL}/api/generate-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromEmail,
          recipients: previewRecipients,
          prompt: aiPrompt,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        setAiPreviews(json.previews || [])
        setShowAIPreview(true)
        toast.success(`Generated ${json.previews?.length || 0} email preview(s)!`)
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to generate emails with AI')
      }
    } catch (err: any) {
      console.error('AI generation error:', err)
      toast.error('Failed to generate emails. Check your connection and try again.')
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleCancelScheduledEmail = async (emailId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/scheduled/${emailId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromEmail }),
      })

      if (res.ok) {
        setMailStatus('Scheduled email cancelled successfully.')
        toast.success('Scheduled email cancelled successfully.')
        // Reload scheduled emails
        if (fromEmail) {
          loadScheduledEmails(fromEmail)
        }
      } else {
        // Enhanced error handling for cancelling scheduled emails
        let errorMessage = 'Failed to cancel scheduled email'

        try {
          const errorData = await res.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }

          if (res.status === 404) {
            errorMessage = 'Scheduled email not found or already cancelled.'
          } else if (res.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.'
          } else if (res.status === 500) {
            errorMessage = `Server error: ${errorData.error || 'Internal server error'}`
          }
        } catch (parseError) {
          console.error('Error parsing cancel response:', parseError)
          errorMessage = `Failed to cancel scheduled email (Status: ${res.status})`
        }

        console.error('Cancel scheduled email error:', { status: res.status, errorMessage })
        setMailStatus(errorMessage)
        toast.error(errorMessage)
      }
    } catch (err: any) {
      console.error('Cancel scheduled email error:', err)

      let errorMessage = 'Failed to cancel scheduled email. Please try again.'

      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.'
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`
      }

      setMailStatus(errorMessage)
      toast.error(errorMessage)
    }
  };

  // Helper function to format date for datetime-local input in local timezone
  const formatLocalDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getTimeUntilScheduled = (scheduledTime: string) => {
    const scheduled = new Date(scheduledTime);
    const now = new Date();
    const diff = scheduled.getTime() - now.getTime();

    if (diff <= 0) return 'Due now';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleAddEmail = () => {
    if (!newEmail.email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Check if email already exists
    const emailExists = excelData.some(row => row.email?.toLowerCase() === newEmail.email.toLowerCase())
    if (emailExists) {
      toast.error('This email already exists in the list')
      return
    }

    const newContact: ExcelRow = {
      sno: excelData.length + 1,
      email: newEmail.email,
      name: newEmail.name,
      company: newEmail.company
    }

    setExcelData([...excelData, newContact])
    setNewEmail({ name: '', email: '', company: '' })
    setShowAddEmailForm(false)
    toast.success('Contact added successfully!')
  }

  const handleDeleteEmail = (index: number) => {
    const updatedData = excelData.filter((_, i) => i !== index)
    const renumberedData = updatedData.map((row, i) => ({
      ...row,
      sno: i + 1
    }))
    setExcelData(renumberedData)
    setSelectedEmails(selectedEmails.filter(i => i !== index))
    toast.success('Contact deleted successfully!')
  }

  const handleSelectEmail = (index: number) => {
    if (selectedEmails.includes(index)) {
      setSelectedEmails(selectedEmails.filter(i => i !== index))
    } else {
      setSelectedEmails([...selectedEmails, index])
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmails([])
      setSelectAll(false)
    } else {
      setSelectedEmails(excelData.map((_, index) => index))
      setSelectAll(true)
    }
  }

  const handleBulkDelete = () => {
    if (selectedEmails.length === 0) {
      toast.error('Please select emails to delete')
      return
    }

    if (confirm(`Are you sure you want to delete ${selectedEmails.length} contact(s)?`)) {
      const updatedData = excelData.filter((_, index) => !selectedEmails.includes(index))
      const renumberedData = updatedData.map((row, i) => ({
        ...row,
        sno: i + 1
      }))
      setExcelData(renumberedData)
      setSelectedEmails([])
      setSelectAll(false)
      toast.success(`${selectedEmails.length} contact(s) deleted successfully!`)
    } else {
      toast.info('Bulk delete cancelled')
    }
  }

  const handleRemoveDuplicates = () => {
    if (duplicateEmails.length === 0) {
      toast.error('No duplicate emails found.')
      return
    }

    if (confirm(`Are you sure you want to remove ${duplicateEmails.length} duplicate email(s)? This will keep only the first occurrence of each email.`)) {

      const uniqueData: ExcelRow[] = []
      const seenEmails = new Set<string>()

      excelData.forEach(row => {
        const email = row.email?.toLowerCase().trim()
        if (email && !seenEmails.has(email)) {
          seenEmails.add(email)
          uniqueData.push(row)
        }
      })

      const renumberedData = uniqueData.map((row, i) => ({
        ...row,
        sno: i + 1
      }))

      setExcelData(renumberedData)
      setSelectedEmails([])
      setSelectAll(false)
      toast.success(`${duplicateEmails.length} duplicate(s) removed successfully!`)
    } else {
      toast.info('Remove duplicates cancelled')
    }
  }



  const handleDownloadExcel = () => {
    if (excelData.length === 0) return

    const dataWithStatus = excelData.map((row) => {
      const match = perEmailStatus.find((entry) => entry.email === row.email)
      return {
        ...row,
        Status: match?.status || 'Pending',
      }
    })

    // Convert to worksheet
    const ws = XLSX.utils.json_to_sheet(dataWithStatus)

    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'EmailStatus')

    // Write file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(blob, 'SmartSender.xlsx')
  }

  return (
    <ProtectedRoute>
      <div className="p-4 sm:p-6 bg-custom-lightblue min-h-screen">
        <div className="max-w-5xl mx-auto">

          {/* Header with Profile Dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">SmartSender</h1>
              <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {fromEmail ? `Logged in as: ${fromEmail}` : 'Not logged in'}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">

              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 text-sm"
                >
                  <span className="text-gray-700">👤</span>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">Profile</span>
                  <span className="text-gray-400">▼</span>
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                      <ProfileComponent />
                      {/* Logout Button */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            // Clear all localStorage data
                            localStorage.clear()
                            // Redirect to login page
                            window.location.href = '/login'
                          }}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm mb-6 overflow-x-auto">
            <div className="flex space-x-1 p-1 min-w-max">
              <button
                onClick={() => handleTabClick('contacts')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${currentTab === 'contacts'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                📋 Contacts
              </button>
              <button
                onClick={() => handleTabClick('compose')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${currentTab === 'compose'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                ✉️ Compose
              </button>
              <button
                onClick={() => handleTabClick('scheduled')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${currentTab === 'scheduled'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                ⏰ Scheduled
              </button>
              <button
                onClick={() => handleTabClick('sent')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${currentTab === 'sent'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                📤 Sent
              </button>
              <button
                onClick={() => handleTabClick('uploaded')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${currentTab === 'uploaded'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                📥 Uploaded
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Upload Contacts</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload Excel or CSV file with contact information
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleDownloadExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  📥 Download Template
                </button>
              </div>
            </div>

            {mailStatus && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{mailStatus}</p>
              </div>
            )}
          </div>

          {/* Main Content Tabs */}
          <div className="mt-6 bg-white rounded-xl shadow-lg overflow-hidden">

            {/* Contacts Tab */}
            {currentTab === 'contacts' && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Contact List</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setShowAddEmailForm(!showAddEmailForm)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      ➕ Add Contact
                    </button>
                    {excelData.length > 0 && (
                      <>
                        <button
                          onClick={handleBulkDelete}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                        >
                          🗑️ Delete Selected
                        </button>
                        <button
                          onClick={handleRemoveDuplicates}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm"
                        >
                          🔄 Remove Duplicates
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Duplicate Warning */}
                {duplicateEmails.length > 0 && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-orange-600 mr-2">⚠️</span>
                      <p className="text-sm text-orange-800">
                        Found {duplicateEmails.length} duplicate email(s). Consider removing duplicates before sending.
                      </p>
                    </div>
                  </div>
                )}

                {/* Add Contact Form */}
                {showAddEmailForm && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Contact</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Name"
                        value={newEmail.name}
                        onChange={(e) => setNewEmail({ ...newEmail, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newEmail.email}
                        onChange={(e) => setNewEmail({ ...newEmail, email: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Company"
                        value={newEmail.company}
                        onChange={(e) => setNewEmail({ ...newEmail, company: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleAddEmail}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        Add Contact
                      </button>
                      <button
                        onClick={() => setShowAddEmailForm(false)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Contacts Table */}
                {excelData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {excelData.map((row, index) => (
                          <tr key={index} className={`hover:bg-gray-50 ${duplicateEmails.includes(row.email?.toLowerCase().trim() || '') ? 'bg-orange-50' : ''}`}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedEmails.includes(index)}
                                onChange={() => handleSelectEmail(index)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{row.sno}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{row.email}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{row.name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{row.company}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => handleDeleteEmail(index)}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No contacts uploaded yet. Upload an Excel/CSV file to get started.</p>
                  </div>
                )}
              </div>
            )}

            {/* Compose Mail Tab */}
            {currentTab === 'compose' && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Compose Email</h3>
                  <button
                    onClick={() => { setUseAI(!useAI); setAiPreviews([]); setShowAIPreview(false); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${useAI
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {useAI ? '✨ AI Mode ON' : '🤖 Enable AI'}
                  </button>
                </div>

                {/* AI Prompt Section */}
                {useAI && (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <label className="block text-sm font-medium text-purple-800 mb-2">
                      Describe the email you want to send
                    </label>
                    <p className="text-xs text-purple-600 mb-3">
                      Gemini AI will generate a unique, personalized email for each recipient using their name and company.
                    </p>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="e.g. Write a professional cold email asking about open backend developer positions. Mention my experience with Node.js, TypeScript, and microservices. Keep it concise and friendly."
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleGenerateAI}
                        disabled={generatingAI || selectedEmails.length === 0 || !aiPrompt.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                      >
                        {generatingAI ? '✨ Generating...' : '✨ Generate Preview'}
                      </button>
                      {selectedEmails.length === 0 && (
                        <span className="text-xs text-purple-600 self-center">Select contacts in the Contacts tab first</span>
                      )}
                    </div>

                    {/* AI Preview */}
                    {showAIPreview && aiPreviews.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <h4 className="text-sm font-medium text-purple-800">Preview ({aiPreviews.length} sample{aiPreviews.length > 1 ? 's' : ''}):</h4>
                        {aiPreviews.map((preview, idx) => (
                          <div key={idx} className="bg-white border border-purple-200 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">To: {preview.recipientEmail}</div>
                            <div className="text-sm font-medium text-gray-900 mb-2">Subject: {preview.subject}</div>
                            <div
                              className="text-sm text-gray-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: preview.html }}
                            />
                          </div>
                        ))}
                        <p className="text-xs text-purple-600">
                          Each recipient will get a uniquely personalized version. These are samples from your selected contacts.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Email Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                      <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="your-email@gmail.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                      <input
                        type="text"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Your name for email signature"
                      />
                    </div>

                    <div className={useAI ? 'opacity-50' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject {useAI && <span className="text-purple-600 text-xs">(AI will generate)</span>}
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={useAI}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                        placeholder={useAI ? "AI will generate a personalized subject for each recipient" : "Email subject"}
                      />
                    </div>

                    <div className={useAI ? 'opacity-50' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message {useAI && <span className="text-purple-600 text-xs">(AI will generate)</span>}
                      </label>
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={useAI}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                        placeholder={useAI ? "AI will generate a personalized message for each recipient" : "Your email message"}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                        <input
                          type="tel"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Your phone number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                        <input
                          type="url"
                          value={linkendIn}
                          onChange={(e) => setLinkedIn(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Your LinkedIn profile"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Schedule</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: '15min', minutes: 15 },
                          { label: '30min', minutes: 30 },
                          { label: '1hr', minutes: 60 },
                          { label: '2hr', minutes: 120 },
                          { label: '4hr', minutes: 240 },
                          { label: '10hr', minutes: 600 },
                          { label: '18hr', minutes: 1080 },
                          { label: '24hr', minutes: 1440 }
                        ].map((time) => (
                          <button
                            key={time.label}
                            onClick={() => {
                              const futureTime = new Date(Date.now() + time.minutes * 60000)
                              setScheduledFor(formatLocalDateTime(futureTime))
                            }}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition text-xs font-medium"
                          >
                            {time.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Schedule For</label>
                      <input
                        type="datetime-local"
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleSendMail}
                        disabled={sending || selectedEmails.length === 0 || (useAI && !aiPrompt.trim())}
                        className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition text-sm ${useAI ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'
                          }`}
                      >
                        {sending ? 'Sending...' : useAI ? '✨ Send with AI' : '📤 Send Now'}
                      </button>
                      <button
                        onClick={handleScheduleMail}
                        disabled={sending || selectedEmails.length === 0 || !scheduledFor || (useAI && !aiPrompt.trim())}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                      >
                        {sending ? 'Scheduling...' : '⏰ Schedule'}
                      </button>
                    </div>

                    {selectedEmails.length > 0 && (
                      <div className={`p-3 rounded-lg border ${useAI ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
                        <p className={`text-sm ${useAI ? 'text-purple-800' : 'text-blue-800'}`}>
                          {useAI ? '✨' : '📧'} {selectedEmails.length} contact(s) selected
                          {useAI ? ' — each will receive a unique AI-generated email' : ' for sending'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Scheduled Emails Section */}
            {currentTab === 'scheduled' && (
              <div className="p-6">

                <h3 className="text-lg font-semibold text-gray-800 mb-6">Scheduled Emails</h3>
                {scheduledEmails.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">⏰</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled emails found.</h3>
                    <p className="text-gray-500">You can schedule emails from the compose tab.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledEmails.map((email) => (
                      <div
                        key={email._id}
                        className={`p-4 rounded-lg border ${email.status === 'pending'
                            ? 'bg-yellow-50 border-yellow-200'
                            : email.status === 'sent'
                              ? 'bg-green-50 border-green-200'
                              : email.status === 'failed'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-gray-200'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{email.subject}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Scheduled for: {new Date(email.scheduledFor).toLocaleString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                            {email.status === 'pending' && (
                              <p className="text-sm text-yellow-600 font-medium">
                                ⏰ Sends in: {getTimeUntilScheduled(email.scheduledFor)}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              Status:
                              <span className={`ml-1 font-medium ${email.status === 'pending'
                                  ? 'text-yellow-600'
                                  : email.status === 'sent'
                                    ? 'text-green-600'
                                    : email.status === 'failed'
                                      ? 'text-red-600'
                                      : 'text-gray-600'
                                }`}>
                                {email.status || 'pending'}
                              </span>
                            </p>
                            {email.sentAt && (
                              <p className="text-sm text-gray-600">
                                Sent at: {new Date(email.sentAt).toLocaleString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            )}
                            {email.errorMessage && (
                              <p className="text-sm text-red-600 mt-1">
                                Error: {email.errorMessage}
                              </p>
                            )}
                          </div>
                          {email.status === 'pending' && (
                            <button
                              onClick={() => handleCancelScheduledEmail(email._id)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sent Emails Tab */}
            {currentTab === 'sent' && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Sent Email History</h3>
                  <button
                    onClick={() => loadSentEmails(fromEmail)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>

                {sentEmails.length > 0 ? (
                  <div className="space-y-4">
                    {sentEmails.map((email, index) => (
                      <div key={email.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={email.status === 'sent' ? 'text-green-600' : email.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}>
                                {email.status === 'sent' ? '✅' : email.status === 'failed' ? '❌' : '⏳'}
                              </span>
                              <h4 className="font-medium text-gray-900">{email.subject || 'No Subject'}</h4>
                              <span className={`text-xs px-2 py-1 rounded ${email.status === 'sent'
                                  ? 'bg-green-100 text-green-700'
                                  : email.status === 'failed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">To:</span> {email.toEmail}
                              </div>
                              <div>
                                <span className="font-medium">Name:</span> {email.recipientName || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Company:</span> {email.company || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Sent:</span> {email.sentAt ? new Date(email.sentAt).toLocaleString() : 'Unknown'}
                              </div>
                              {email.attachmentCount > 0 && (
                                <div>
                                  <span className="font-medium">Attachments:</span> {email.attachmentCount} file(s)
                                </div>
                              )}
                            </div>
                            {email.status === 'failed' && email.errorMessage && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                <span className="font-medium text-sm text-red-700">Error:</span>
                                <p className="text-sm text-red-600 mt-1">{email.errorMessage}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">📤</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sent emails yet</h3>
                    <p className="text-gray-500 text-sm">Send your first email to see the history here.</p>
                  </div>
                )}
              </div>
            )}

            {/* Uploaded Contacts Tab */}
            {currentTab === 'uploaded' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Uploaded Contacts</h3>
                {excelData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No uploaded contacts found.</h3>
                    <p className="text-gray-500">Upload an Excel/CSV file to see your contacts here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {excelData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{row.sno}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{row.email}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{row.name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{row.company}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}


          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}