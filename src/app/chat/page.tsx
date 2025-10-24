'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, MessageCircle, Mail, Send } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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
  updated_at: string
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
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('conversation')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<'conversations' | 'chat'>('conversations')

  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['user-conversations', user?.id],
    queryFn: () => getConversationsWithLatestMessage(user!.id),
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
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
      // Update unread count
      queryClient.invalidateQueries({ queryKey: ['unread-messages', user?.id] })
    },
    onError: (error: Error) => {
      console.error('Mark read mutation error:', error)
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendMessage(selectedConversation!.id, user!.id, content),
    onSuccess: (newMessage) => {
      setNewMessage('')
      // Add the new message to the local state immediately
      setMessages(prev => [...prev, newMessage])
      // Auto-scroll to the latest message when sending
      setTimeout(() => {
        messagesEndRef.current?.scrollTo({
          top: messagesEndRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
      queryClient.invalidateQueries({ queryKey: ['user-conversations', user?.id] })
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
          // The queries will handle filtering on their own
          queryClient.invalidateQueries({ queryKey: ['user-conversations', user.id] })
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
    setSelectedConversation(conversation)
    setView('chat')

    // Mark all messages in conversation as read when selecting
    console.log('Selecting conversation:', conversation.id)
    markReadMutation.mutate(conversation.id)
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view messages</h1>
          <Link href="/auth">
            <Button>Sign In</Button>
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Mail className="h-8 w-8" />
            Messages
            <Badge variant={unreadCount && unreadCount > 0 ? "destructive" : "secondary"} className="text-sm ml-4">
              {unreadCount || 0} unread
            </Badge>
          </h1>
          <p className="text-gray-600 mt-2">Manage your conversations with buyers and sellers</p>
        </div>
      </div>

      {/* Main Content */}
      {view === 'conversations' ? (
        <div className="max-w-4xl mx-auto">
          <Card className="h-fit overflow-hidden">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-6 flex-shrink-0 text-xl">Conversations</h3>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-500">Loading conversations...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-sm text-red-500 mb-2">Error loading conversations</p>
                  <p className="text-xs text-gray-400">Check console for details</p>
                </div>
              ) : conversations && Array.isArray(conversations) && conversations.length > 0 ? (
                <div className="space-y-3">
                  {conversations.map((conversation: Conversation) => {
                    const otherParticipant = getOtherParticipant(conversation)
                    const listingImage = getListingImage(conversation)
                    const isUnread = conversation.unread_count && conversation.unread_count > 0

                    return (
                      <div
                        key={conversation.id}
                        className={`p-4 rounded-lg cursor-pointer transition-all hover:bg-gray-50 border-l-4 ${
                          isUnread ? 'bg-blue-50 border-blue-400' : 'bg-white border-transparent'
                        }`}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Listing Image */}
                          {listingImage ? (
                            <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={listingImage}
                                alt={conversation.listing?.title || 'Listing'}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MessageCircle className="h-6 w-6 text-gray-500" />
                            </div>
                          )}

                          {/* Conversation Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className={`text-base font-medium truncate ${
                                isUnread ? 'text-gray-900 font-semibold' : 'text-gray-700'
                              }`}>
                                {otherParticipant?.display_name || 'Unknown User'}
                              </p>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {conversation.latest_message && (
                                  <span className={`text-xs ${
                                    isUnread ? 'text-blue-600 font-medium' : 'text-gray-500'
                                  }`}>
                                    {formatTime(conversation.latest_message.created_at)}
                                  </span>
                                )}
                                {isUnread && (
                                  <>
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span className="text-xs text-orange-600 font-medium">New</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Listing Title */}
                            <p className={`text-sm truncate mb-2 ${
                              isUnread ? 'text-gray-600' : 'text-gray-500'
                            }`}>
                              {conversation.listing?.title || 'Unknown Listing'}
                            </p>

                            {/* Latest Message Preview */}
                            {conversation.latest_message ? (
                              <p className={`text-sm truncate ${
                                isUnread ? 'font-semibold text-gray-900' : 'text-gray-600'
                              }`}>
                                {conversation.latest_message.content.length > 80
                                  ? `${conversation.latest_message.content.substring(0, 80)}...`
                                  : conversation.latest_message.content
                                }
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 italic">No messages yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No conversations yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <Card className="h-fit flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToConversations}
                  className="p-1"
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
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedConversation!.listing?.title || 'Unknown Listing'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    with {getOtherParticipant(selectedConversation!)?.display_name || 'Unknown User'}
                  </p>
                </div>
                {selectedConversation!.listing?.price && (
                  <Badge variant="outline" className="ml-auto">
                    {selectedConversation!.listing.price} MKD
                  </Badge>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-hidden">
              <div className="h-full p-4 overflow-y-scroll" ref={messagesEndRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex flex-col max-w-[70%]">
                        {message.sender_id !== user.id && (
                          <p className="text-xs text-gray-500 mb-1 px-3">
                            {getOtherParticipant(selectedConversation!)?.display_name || 'Unknown User'}
                          </p>
                        )}
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            message.sender_id === user.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === user.id ? 'text-orange-100' : 'text-gray-500'
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
            <div className="p-4 border-t flex-shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
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
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><div className="text-center">Loading chat...</div></div>}>
      <ChatContent />
    </Suspense>
  )
}