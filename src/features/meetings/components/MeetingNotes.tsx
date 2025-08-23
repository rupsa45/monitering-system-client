import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  Download, 
  Share2, 
  Edit, 
  Check, 
  X, 
  FileText, 
  Clock,
  User
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { socketService } from '@/services/socketService'
import { toast } from 'sonner'

interface Note {
  id: string
  content: string
  authorId: string
  authorName: string
  timestamp: Date
  isShared: boolean
}

interface MeetingNotesProps {
  meetingId: string
  roomCode: string
  isOpen: boolean
  onClose: () => void
}

export function MeetingNotes({ meetingId, roomCode, isOpen, onClose }: MeetingNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [autoSave] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { user } = useAuthStore()

  // Auto-save timer
  useEffect(() => {
    if (!autoSave || !currentNote.trim()) return

    const timer = setTimeout(() => {
      if (currentNote.trim() && user) {
        const note: Note = {
          id: Date.now().toString(),
          content: currentNote.trim(),
          authorId: user.empId,
          authorName: user.empName,
          timestamp: new Date(),
          isShared: false
        }

        // Emit note to server
        socketService.emit('notes:save', {
          meetingId,
          roomCode,
          note
        })

        // Add to local state
        setNotes(prev => [...prev, note])
        setCurrentNote('')
        toast.success('Note saved successfully!')
      }
    }, 3000) // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timer)
  }, [currentNote, autoSave, user, meetingId, roomCode])

  // Socket.IO event listeners
  useEffect(() => {
    if (!isOpen) return

    // Listen for shared notes
    socketService.on('notes:shared', (data: Note) => {
      setNotes(prev => {
        const existingIndex = prev.findIndex(note => note.id === data.id)
        if (existingIndex >= 0) {
          return prev.map((note, index) => 
            index === existingIndex ? data : note
          )
        }
        return [...prev, data]
      })
    })

    // Listen for note updates
    socketService.on('notes:updated', (data: Note) => {
      setNotes(prev => prev.map(note => 
        note.id === data.id ? data : note
      ))
    })

    // Listen for note deletions
    socketService.on('notes:deleted', (data: { id: string }) => {
      setNotes(prev => prev.filter(note => note.id !== data.id))
    })

    return () => {
      socketService.off('notes:shared')
      socketService.off('notes:updated')
      socketService.off('notes:deleted')
    }
  }, [isOpen])

  const handleSaveNote = useCallback(async () => {
    if (!currentNote.trim() || !user) return

    setIsSaving(true)
    try {
      const note: Note = {
        id: Date.now().toString(),
        content: currentNote.trim(),
        authorId: user.empId,
        authorName: user.empName,
        timestamp: new Date(),
        isShared: false
      }

      // Emit note to server
      socketService.emit('notes:save', {
        meetingId,
        roomCode,
        note
      })

      // Add to local state
      setNotes(prev => [...prev, note])
      setCurrentNote('')
      toast.success('Note saved successfully!')
    } catch (error) {
      toast.error('Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }, [currentNote, user, meetingId, roomCode])

  const handleShareNote = async (noteId: string) => {
    try {
      const note = notes.find(n => n.id === noteId)
      if (!note) return

      const sharedNote = { ...note, isShared: true }
      
      // Emit shared note to server
      socketService.emit('notes:share', {
        meetingId,
        roomCode,
        note: sharedNote
      })

      // Update local state
      setNotes(prev => prev.map(n => 
        n.id === noteId ? sharedNote : n
      ))

      toast.success('Note shared with meeting participants!')
    } catch (error) {
      toast.error('Failed to share note')
    }
  }

  const handleEditNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    setEditingNoteId(noteId)
    setCurrentNote(note.content)
    textareaRef.current?.focus()
  }

  const handleUpdateNote = async () => {
    if (!editingNoteId || !currentNote.trim() || !user) return

    setIsSaving(true)
    try {
      const updatedNote: Note = {
        id: editingNoteId,
        content: currentNote.trim(),
        authorId: user.empId,
        authorName: user.empName,
        timestamp: new Date(),
        isShared: false
      }

      // Emit updated note to server
      socketService.emit('notes:update', {
        meetingId,
        roomCode,
        note: updatedNote
      })

      // Update local state
      setNotes(prev => prev.map(note => 
        note.id === editingNoteId ? updatedNote : note
      ))

      setEditingNoteId(null)
      setCurrentNote('')
      toast.success('Note updated successfully!')
    } catch (error) {
      toast.error('Failed to update note')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setCurrentNote('')
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      // Emit delete note to server
      socketService.emit('notes:delete', {
        meetingId,
        roomCode,
        noteId
      })

      // Remove from local state
      setNotes(prev => prev.filter(note => note.id !== noteId))
      toast.success('Note deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete note')
    }
  }

  const handleDownloadNotes = () => {
    const notesText = notes
      .filter(note => note.isShared)
      .map(note => {
        const date = note.timestamp.toLocaleDateString()
        const time = note.timestamp.toLocaleTimeString()
        return `[${date} ${time}] ${note.authorName}:\n${note.content}\n\n`
      })
      .join('---\n')

    const blob = new Blob([notesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-notes-${meetingId}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Notes downloaded successfully!')
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isOwnNote = (note: Note) => {
    return note.authorId === user?.empId
  }

  if (!isOpen) return null

  return (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Meeting Notes</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadNotes}
              disabled={notes.filter(n => n.isShared).length === 0}
              aria-label="Download shared notes"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Notes List */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 pb-4">
            {notes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notes yet</p>
                <p className="text-sm">Start taking notes below</p>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{note.authorName}</span>
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatTime(note.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {note.isShared && (
                        <Badge variant="secondary" className="text-xs">
                          Shared
                        </Badge>
                      )}
                      {isOwnNote(note) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(note.id)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {!note.isShared && isOwnNote(note) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShareNote(note.id)}
                        >
                          <Share2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{note.content}</div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        <div className="p-4 border-t">
          {editingNoteId ? (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Edit your note..."
                className="min-h-[100px]"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdateNote}
                  disabled={!currentNote.trim() || isSaving}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Update
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Take notes during the meeting..."
                className="min-h-[100px]"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveNote}
                    disabled={!currentNote.trim() || isSaving}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Auto-save: {autoSave ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
