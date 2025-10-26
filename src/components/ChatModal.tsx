'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, MessageCircle, Send, Minimize2, Maximize2 } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getConversationMessages, sendMessage, getOrCreateConversation, markConversationRead } from '@/lib/api'
import { useTranslations } from 'next-intl'

// Define types for our chat system
type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
  sender?: {
    display_name: string
    username: string
  }
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

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  listingId: string
  sellerId: string
  listingTitle: string
  listingImage?: string
  sellerName: string
}

export function ChatModal({ isOpen, onClose, listingId, sellerId, listingTitle, listingImage, sellerName }: ChatModalProps) {
   const { user } = useAuth()
   const queryClient = useQueryClient()
   const [messages, setMessages] = useState<Message[]>([])
   const [newMessage, setNewMessage] = useState('')
   const [isMinimized, setIsMinimized] = useState(false)
   const [conversation, setConversation] = useState<Conversation | null>(null)
   const t = useTranslations('chat')

  // Get or create conversation
  const { data: conversationData, isLoading: conversationLoading, error: conversationError } = useQuery({
    queryKey: ['conversation', listingId, user?.id, sellerId],
    queryFn: () => getOrCreateConversation(listingId, user!.id, sellerId),
    enabled: !!user && isOpen && !!listingId && !!sellerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry to prevent loops
  })

  // Get messages for the conversation
  const { data: conversationMessages, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages', conversationData?.id],
    queryFn: () => getConversationMessages(conversationData!.id),
    enabled: !!conversationData?.id && isOpen && !conversationLoading,
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: false, // Don't retry to prevent loops
  })

  // Mark messages as read when conversation opens
  const markReadMutation = useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-messages', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['user-conversations', user?.id] })
    },
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendMessage(conversation!.id, user!.id, content),
    onSuccess: (newMessage) => {
      setNewMessage('')
      // Don't add to local state here - let the real-time subscription handle it
      // Update conversation list
      queryClient.invalidateQueries({ queryKey: ['user-conversations', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['unread-messages', user?.id] })
    },
    onError: (error: Error) => {
      console.error('Failed to send message:', error)
    },
  })

  useEffect(() => {
    if (conversationData) {
      setConversation(conversationData)
      // Mark as read when conversation opens
      markReadMutation.mutate(conversationData.id)
    }
  }, [conversationData]) // Removed markReadMutation from deps to prevent infinite loop

  useEffect(() => {
    if (conversationMessages) {
      setMessages(conversationMessages)
      console.log('Loaded messages:', conversationMessages.length)
    }
  }, [conversationMessages])

  // Listen for new messages in this conversation
  useEffect(() => {
    if (conversation?.id) {
      const channel = supabase
        .channel(`messages-${conversation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        }, (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [conversation?.id])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversation) return

    sendMessageMutation.mutate(newMessage.trim())
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isMinimized ? 'w-80 h-14' : 'w-80 h-96'
      }`}>
        {/* Header - Always visible */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {listingImage ? (
              <div className="w-8 h-8 relative rounded flex-shrink-0">
                <Image
                  src={listingImage}
                  alt={listingTitle}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-4 w-4 text-gray-500" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{sellerName}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{listingTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat Content - Hidden when minimized */}
        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <div className="h-64 p-3 overflow-y-auto">
                {conversationLoading || messagesLoading ? (
                  <div className="text-center py-8">
                    <div className="loading-spinner w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {conversationLoading ? t('settingUpConversation') : t('loadingMessagesShort')}
                    </p>
                  </div>
                ) : conversationError || messagesError ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-500 dark:text-red-400 mb-2">{t('failedToLoadChat')}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {conversationError?.message || messagesError?.message}
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('noMessagesYet')}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('startConversation')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <div
                        key={`${message.id}-${Date.now()}-${Math.random()}`}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex flex-col max-w-[70%]">
                          {message.sender_id !== user?.id && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
                              {message.sender?.display_name || sellerName}
                            </p>
                          )}
                          <div
                            className={`rounded-lg px-3 py-2 text-sm ${
                              message.sender_id === user?.id
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            }`}
                          >
                            {message.content}
                          </div>
                          <span className={`text-xs mt-1 px-1 ${
                            message.sender_id === user?.id ? 'text-right text-orange-600 dark:text-orange-400' : 'text-left text-gray-500 dark:text-gray-400'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e as any)
                    }
                  }}
                  placeholder={t('typeMessage')}
                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={sendMessageMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}