'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, MessageCircle, Mail, Send, Trash2, CheckSquare, Square, Pencil } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useTranslations } from 'next-intl'

// Define types for our chat system
type Message = {
  id: string
 conversation_id: string
  sender_id: string
  content: string
  created_at: string
 is_read: boolean
}

type Conversation = {
   id: string
   listing_id: string
   buyer_id: string
   seller_id: string
   created_at: string
   last_message_at: string
   last_message_text: string
  listing?: {
     title: string
     price: number
     images?: {
       image_url: string
       is_default: boolean
     }[]
   }
  buyer?: {
     display_name: string
     username: string
  }
   seller?: {
     display_name: string
     username: string
   }
   latest_message?: Message
   unread_count?: number
 }

import { getConversationsWithLatestMessage, getUnreadMessageCount, markConversationRead, getConversationMessages, sendMessage } from '@/lib/api'

function ChatContent() {
    const { user, loading: authLoading } = useAuth()
    const queryClient = useQueryClient()
    const searchParams = useSearchParams()
    const conversationId = searchParams.get('conversation')
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [view, setView] = useState<'conversations' | 'chat'>('conversations')
    const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set())
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const t = useTranslations('chat')

  const { data: conversations, isLoading, error, refetch } = useQuery({
    queryKey: ['user-conversations', user?.id],
    queryFn: () => getConversationsWithLatestMessage(user!.id),
    enabled: !!user,
    retry: 1,
    staleTime: 1000 * 60 * 1, // 1 minute
  })

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: () => getUnreadMessageCount(user!.id),
    enabled: !!user,
  })

  const { data: conversationMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => getConversationMessages(selectedConversation!.id),
    enabled: !!selectedConversation?.id,
  })

  const markReadMutation = useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId, user!.id),
    onSuccess: (data, conversationId) => {
      console.log('Mark read success for conversation:', conversationId)
      // Update the conversation list to reflect the read status
      queryClient.setQueryData(['user-conversations', user?.id], (oldData: Conversation[]) => {
        if (!oldData) return oldData
        return oldData.map((conv: Conversation) =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      })
      // Force refetch unread count after successful database update
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['unread-messages', user?.id] })
        queryClient.invalidateQueries({ queryKey: ['user-conversations', user?.id] })
      }, 1000)
    },
    onError: (error: Error) => {
      console.error('Mark read mutation error:', error)
    },
  })

  const sendMessageMutation = useMutation({
   mutationFn: (content: string) => sendMessage(selectedConversation!.id, user!.id, content),
   onSuccess: (newMessage) => {
     setNewMessage('')
     // Don't add to local state - let real-time subscription handle it
     // Update conversation list to show the latest message
     queryClient.invalidateQueries({ queryKey: ['user-conversations', user?.id] })
     // Update unread count
     queryClient.invalidateQueries({ queryKey: ['unread-messages', user?.id] })
   },
   onError: (error: Error) => {
     toast.error(error.message || 'Failed to send message')
   },
 })

  useEffect(() => {
    if (conversationMessages) {
      setMessages(conversationMessages)
      // Scroll to bottom when loading messages for a conversation
      setTimeout(() => {
        messagesEndRef.current?.scrollTo({
          top: messagesEndRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [conversationMessages]) // eslint-disable-line react-hooks/set-state-in-effect

  // Auto-select conversation from URL parameter
  useEffect(() => {
    if (conversationId && conversations && conversations.length > 0 && !selectedConversation) {
      console.log('Looking for conversation:', conversationId, 'in conversations:', conversations.map(c => c.id))
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        console.log('Found conversation, selecting:', conversation)
        setSelectedConversation(conversation)
        setView('chat') // Switch to chat view
        // Mark messages as read when auto-selecting
        markReadMutation.mutate(conversation.id)
      } else {
        console.log('Conversation not found in list')
      }
    }
  }, [conversationId, conversations, selectedConversation, markReadMutation]) // eslint-disable-line react-hooks/set-state-in-effect

  useEffect(() => {
    if (selectedConversation?.id) {
      const channel = supabase
        .channel(`messages-${selectedConversation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedConversation?.id])

  // Listen for new messages across all conversations to update the conversation list
  useEffect(() => {
    if (user?.id) {
      const channel = supabase
        .channel('all-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, (payload) => {
          const newMessage = payload.new as Message
          console.log('New message received:', newMessage)

          // Always invalidate queries when a new message is inserted
          // The RLS policies will ensure users only see messages they're allowed to see
          // Only invalidate conversations query if the message is from someone else
          // This prevents showing unread badges for our own messages
          if (newMessage.sender_id !== user.id) {
            queryClient.invalidateQueries({ queryKey: ['user-conversations', user.id] })
          }
          queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] })
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user?.id, queryClient])

  // Removed auto-scroll functionality

  const handleSelectConversation = (conversation: Conversation) => {
    if (isSelectionMode) {
      // Toggle selection
      setSelectedConversations(prev => {
        const newSet = new Set(prev)
        if (newSet.has(conversation.id)) {
          newSet.delete(conversation.id)
        } else {
          newSet.add(conversation.id)
        }
        return newSet
      })
    } else {
      setSelectedConversation(conversation)
      setView('chat')

      // Mark all messages in conversation as read when selecting
      console.log('Selecting conversation:', conversation.id)
      markReadMutation.mutate(conversation.id)
    }
  }

  const handleSelectAll = () => {
    if (conversations) {
      setSelectedConversations(new Set(conversations.map(c => c.id)))
    }
  }

  const handleDeselectAll = () => {
    setSelectedConversations(new Set())
  }

  const handleDeleteSelected = async () => {
    if (selectedConversations.size === 0) return

    // Custom styled confirmation dialog (popup style with blurred background)
    const confirmed = await new Promise<boolean>((resolve) => {
      // Create backdrop with subtle blur effect
      const backdrop = document.createElement('div')
      backdrop.className = 'fixed inset-0 z-40 bg-transparent backdrop-blur-sm'

      const dialog = document.createElement('div')
      dialog.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50'
      dialog.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md shadow-2xl border-2 border-red-200 animate-in fade-in-0 zoom-in-95 duration-200">
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-semibold text-gray-900">{t('deleteConversations')}</h3>
            </div>
          </div>
          <div class="mb-6">
            <p class="text-gray-600">
              {t('deleteConversationsDesc', { count: selectedConversations.size })}
            </p>
            <p class="text-sm text-gray-500 mt-2">
              {t('deleteWarning')}
            </p>
          </div>
          <div class="flex justify-end space-x-3">
            <button class="cancel-btn px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300">
              {t('cancel')}
            </button>
            <button class="delete-btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
              {t('delete')}
            </button>
          </div>
        </div>
      `

      document.body.appendChild(backdrop)
      document.body.appendChild(dialog)

      const cancelBtn = dialog.querySelector('.cancel-btn') as HTMLButtonElement
      const deleteBtn = dialog.querySelector('.delete-btn') as HTMLButtonElement

      const closeDialog = () => {
        document.body.removeChild(backdrop)
        document.body.removeChild(dialog)
        resolve(false)
      }

      const confirmDelete = () => {
        document.body.removeChild(backdrop)
        document.body.removeChild(dialog)
        resolve(true)
      }

      cancelBtn.onclick = closeDialog
      deleteBtn.onclick = confirmDelete

      // Close on backdrop click
      backdrop.onclick = closeDialog

      // Close on Escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeDialog()
          document.removeEventListener('keydown', handleEscape)
        }
      }
      document.addEventListener('keydown', handleEscape)
    })

    if (confirmed) {
      try {
        // Delete messages first (due to foreign key constraints)
        console.log('Deleting messages for conversations:', Array.from(selectedConversations))
        const { error: messagesError, count: messagesDeleted } = await supabase
          .from('messages')
          .delete({ count: 'exact' })
          .in('conversation_id', Array.from(selectedConversations))

        if (messagesError) {
          console.error('Messages deletion error:', messagesError)
          throw messagesError
        }
        console.log(`Messages deleted successfully: ${messagesDeleted} messages`)

        // Then delete conversations
        console.log('Deleting conversations:', Array.from(selectedConversations))
        const { error: conversationsError, count: conversationsDeleted } = await supabase
          .from('conversations')
          .delete({ count: 'exact' })
          .in('id', Array.from(selectedConversations))

        if (conversationsError) {
          console.error('Conversations deletion error:', conversationsError)
          throw conversationsError
        }
        console.log(`Conversations deleted successfully: ${conversationsDeleted} conversations`)

        // Update local state
        queryClient.invalidateQueries({ queryKey: ['user-conversations', user?.id] })
        queryClient.invalidateQueries({ queryKey: ['unread-messages', user?.id] })

        setSelectedConversations(new Set())
        setIsSelectionMode(false)
        toast.success(t('conversationsDeleted', { count: selectedConversations.size }))
      } catch (error) {
        console.error('Error deleting conversations:', error)
        toast.error('Failed to delete conversations')
      }
    }
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedConversations(new Set())
  }

  const handleBackToConversations = () => {
    setView('conversations')
    setSelectedConversation(null)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    sendMessageMutation.mutate(newMessage.trim())
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.buyer_id === user?.id ? conversation.seller : conversation.buyer
 }

  const getListingImage = (conversation: Conversation) => {
    const defaultImage = conversation.listing?.images?.find(img => img.is_default)
    return defaultImage?.image_url || conversation.listing?.images?.[0]?.image_url
  }

  // Show loading while auth is being restored
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center loading-pulse">
          <div className="loading-spinner w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6 shadow-lg"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('loadingMessages')}</h2>
            <p className="text-gray-600 dark:text-gray-300">{t('connectingConversations')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('signInToView')}</h1>
          <Link href="/auth">
            <Button className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700">{t('signIn')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <Mail className="h-8 w-8" />
            {t('conversations')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t('manageConversations')}</p>
        </div>
      </div>

      {/* Main Content */}
      {view === 'conversations' ? (
        <div className="max-w-4xl mx-auto">
          <Card className="h-fit overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
               <h3 className="font-semibold text-gray-900 dark:text-white text-xl">{t('conversations')}</h3>
               <div className="flex items-center gap-2">
                 {isSelectionMode ? (
                   <>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={toggleSelectionMode}
                       className="text-xs"
                     >
                       {t('cancel')}
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={handleSelectAll}
                       className="text-xs"
                     >
                       <CheckSquare className="h-4 w-4 mr-1" />
                       {t('selectAll')}
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={handleDeselectAll}
                       className="text-xs"
                     >
                       <Square className="h-4 w-4 mr-1" />
                       {t('deselectAll')}
                     </Button>
                     <Button
                       variant="destructive"
                       size="sm"
                       onClick={handleDeleteSelected}
                       disabled={selectedConversations.size === 0}
                       className="text-xs"
                     >
                       <Trash2 className="h-4 w-4 mr-1" />
                       {t('deleteSelected', { count: selectedConversations.size })}
                     </Button>
                   </>
                 ) : (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={toggleSelectionMode}
                     className="text-xs"
                   >
                     <Pencil className="h-4 w-4 mr-1" />
                     {t('edit')}
                   </Button>
                 )}
               </div>
             </div>

              {isLoading ? (
                <div className="text-center py-12 loading-pulse">
                  <div className="loading-spinner w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4 shadow-sm"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('loadingConversations')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('fetchingMessages')}</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-sm text-red-500 dark:text-red-400 mb-2">{t('errorLoadingConversations')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('checkConsole')}</p>
                </div>
              ) : conversations && Array.isArray(conversations) && conversations.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-700">
                  {conversations.map((conversation: Conversation) => {
                    const otherParticipant = getOtherParticipant(conversation)
                    const listingImage = getListingImage(conversation)
                    const isUnread = conversation.unread_count && conversation.unread_count > 0

                    return (
                      <div
                        key={conversation.id}
                        className={`p-4 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md border ${
                          isUnread
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-300 dark:border-blue-600 shadow-sm ring-1 ring-blue-200 dark:ring-blue-700'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        } ${isSelectionMode ? 'hover:bg-gray-100 dark:hover:bg-gray-600' : ''}`}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="flex items-start gap-4 relative">
                          {/* Selection Checkbox */}
                          {isSelectionMode && (
                            <div className="flex items-center pt-1">
                              <Checkbox
                                checked={selectedConversations.has(conversation.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedConversations(prev => {
                                    const newSet = new Set(prev)
                                    if (checked) {
                                      newSet.add(conversation.id)
                                    } else {
                                      newSet.delete(conversation.id)
                                    }
                                    return newSet
                                  })
                                }}
                                className="mt-1"
                              />
                            </div>
                          )}

                          {/* Listing Image */}
                          {listingImage ? (
                            <div className="w-14 h-14 relative rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={listingImage}
                                alt={conversation.listing?.title || 'Listing'}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MessageCircle className="h-7 w-7 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}

                          {/* Conversation Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className={`text-base font-medium truncate ${
                                  isUnread ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {otherParticipant?.display_name || t('unknownUser')}
                                </p>
                                <p className={`text-sm truncate mt-1 ${
                                  isUnread ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'
                                }`}>
                                  {conversation.listing?.title || t('unknownListing')}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                                {conversation.latest_message && (
                                  <span className={`text-xs ${
                                    isUnread ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {formatTime(conversation.latest_message.created_at)}
                                  </span>
                                )}
                                {/* Unread Badge */}
                                {conversation.unread_count && conversation.unread_count > 0 && (
                                  <Badge variant="destructive" className="text-xs px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Latest Message Preview */}
                            {conversation.latest_message ? (
                              <p className={`text-sm line-clamp-2 ${
                                isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'
                              }`}>
                                {conversation.latest_message.content.length > 100
                                  ? `${conversation.latest_message.content.substring(0, 100)}...`
                                  : conversation.latest_message.content
                                }
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('noMessagesYet')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mail className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('noConversationsYet')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <Card className="h-fit flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToConversations}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {getListingImage(selectedConversation!) ? (
                  <div className="w-10 h-10 relative rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={getListingImage(selectedConversation!)!}
                      alt={selectedConversation!.listing?.title || 'Listing'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedConversation!.listing?.title || t('unknownListing')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('withUser', { user: getOtherParticipant(selectedConversation!)?.display_name || t('unknownUser') })}
                  </p>
                </div>
                {selectedConversation!.listing?.price && (
                  <Badge variant="outline" className="ml-auto border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300">
                    {selectedConversation!.listing.price} ден
                  </Badge>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-hidden bg-gray-50 dark:bg-gray-900">
              <div className="h-full p-4 overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-700" ref={messagesEndRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex flex-col max-w-[70%]">
                        {message.sender_id !== user.id && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-3">
                            {getOtherParticipant(selectedConversation!)?.display_name || t('unknownUser')}
                          </p>
                        )}
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            message.sender_id === user.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === user.id ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-600 flex-shrink-0 bg-white dark:bg-gray-800">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('typeMessage')}
                  className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const t = useTranslations('chat')
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><div className="text-center text-gray-900 dark:text-white">{t('loadingChat')}</div></div>}>
      <ChatContent />
    </Suspense>
  )
}