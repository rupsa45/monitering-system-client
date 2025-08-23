import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Paperclip, Mic, MicOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { socketService } from '@/services/socketService'

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  message: string
  timestamp: Date
  type: 'text' | 'system' | 'file'
  fileUrl?: string
  fileName?: string
}

interface MeetingChatProps {
  meetingId: string
  roomCode: string
  isOpen: boolean
  onClose: () => void
}

export function MeetingChat({ meetingId, roomCode, isOpen, onClose }: MeetingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Socket.IO event listeners
  useEffect(() => {
    if (!isOpen) return

    // Listen for new messages
    socketService.on('chat:message', (data: ChatMessage) => {
      setMessages(prev => [...prev, data])
    })

    // Listen for typing indicators
    socketService.on('chat:typing', (data: { userId: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        if (data.isTyping) {
          return prev.includes(data.userId) ? prev : [...prev, data.userId]
        } else {
          return prev.filter(id => id !== data.userId)
        }
      })
    })

    // Listen for system messages
    socketService.on('chat:system', (data: { message: string; type: 'info' | 'warning' | 'error' }) => {
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'system',
        senderName: 'System',
        message: data.message,
        timestamp: new Date(),
        type: 'system'
      }
      setMessages(prev => [...prev, systemMessage])
    })

    return () => {
      socketService.off('chat:message')
      socketService.off('chat:typing')
      socketService.off('chat:system')
    }
  }, [isOpen])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.empId,
      senderName: user.empName,
      senderAvatar: user.empProfile,
      message: newMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    }

    // Emit message to server
    socketService.emit('chat:message', {
      meetingId,
      roomCode,
      message: newMessage.trim()
    })

    // Add message to local state
    setMessages(prev => [...prev, message])
    setNewMessage('')
    setIsTyping(false)

    // Stop typing indicator
    socketService.emit('chat:typing', {
      meetingId,
      roomCode,
      isTyping: false
    })
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)
    
    if (!isTyping && value.trim()) {
      setIsTyping(true)
      socketService.emit('chat:typing', {
        meetingId,
        roomCode,
        isTyping: true
      })
    } else if (isTyping && !value.trim()) {
      setIsTyping(false)
      socketService.emit('chat:typing', {
        meetingId,
        roomCode,
        isTyping: false
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // TODO: Implement file upload to server
    const fileMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.empId,
      senderName: user.empName,
      senderAvatar: user.empProfile,
      message: `Shared file: ${file.name}`,
      timestamp: new Date(),
      type: 'file',
      fileName: file.name,
      fileUrl: URL.createObjectURL(file)
    }

    setMessages(prev => [...prev, fileMessage])
  }

  const handleVoiceMessage = () => {
    setIsRecording(!isRecording)
    // TODO: Implement voice recording
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isOwnMessage = (message: ChatMessage) => {
    return message.senderId === user?.empId
  }

  if (!isOpen) return null

  return (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Meeting Chat</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isOwnMessage(message) ? 'order-2' : 'order-1'}`}>
                  {!isOwnMessage(message) && message.type !== 'system' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={message.senderAvatar} />
                        <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-muted-foreground">
                        {message.senderName}
                      </span>
                    </div>
                  )}
                  
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.type === 'system'
                        ? 'bg-muted text-muted-foreground text-center'
                        : isOwnMessage(message)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.type === 'file' ? (
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        <span>{message.fileName}</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.message}</p>
                    )}
                  </div>
                  
                  <div className={`text-xs text-muted-foreground mt-1 ${
                    isOwnMessage(message) ? 'text-right' : 'text-left'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceMessage}
              className={isRecording ? 'text-red-500' : ''}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </div>
      </CardContent>
    </Card>
  )
}
