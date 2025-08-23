import React, { useState, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { Meeting } from '@/services/meetingService'
import { MeetingCard } from './MeetingCard'
import { useAuthStore } from '@/stores/authStore'

interface VirtualizedMeetingListProps {
  meetings: Meeting[]
  onJoin: (meeting: Meeting) => void
  onEdit: (meeting: Meeting) => void
  onDelete: (meeting: Meeting) => void
  selectedMeetings: string[]
  onSelect: (meetingId: string, selected: boolean) => void
}

const ITEM_HEIGHT = 200 // Height of each meeting card
const ITEMS_PER_ROW = 3 // Number of items per row in grid view

export function VirtualizedMeetingList({
  meetings,
  onJoin,
  onEdit,
  onDelete,
  selectedMeetings,
  onSelect
}: VirtualizedMeetingListProps) {
  const { user } = useAuthStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const userRole = user?.empRole || 'employee'

  // Calculate rows for grid view
  const rows = Math.ceil(meetings.length / ITEMS_PER_ROW)

  // Row renderer for grid view
  const GridRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const startIndex = index * ITEMS_PER_ROW
    const rowMeetings = meetings.slice(startIndex, startIndex + ITEMS_PER_ROW)

    return (
      <div style={style} className="flex gap-4">
        {rowMeetings.map((meeting) => (
          <div key={meeting.id} className="flex-1">
            <MeetingCard
              meeting={meeting}
              userRole={userRole}
              selected={selectedMeetings.includes(meeting.id)}
              onSelect={(selected) => onSelect(meeting.id, selected)}
              onJoin={() => onJoin(meeting)}
              onEdit={() => onEdit(meeting)}
              onDelete={() => onDelete(meeting)}
            />
          </div>
        ))}
        {/* Fill empty spaces */}
        {Array.from({ length: ITEMS_PER_ROW - rowMeetings.length }).map((_, i) => (
          <div key={`empty-${i}`} className="flex-1" />
        ))}
      </div>
    )
  }, [meetings, selectedMeetings, userRole, onJoin, onEdit, onDelete, onSelect])

  // Row renderer for list view
  const ListRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const meeting = meetings[index]
    
    return (
      <div style={style} className="px-4">
        <MeetingCard
          meeting={meeting}
          userRole={userRole}
          selected={selectedMeetings.includes(meeting.id)}
          onSelect={(selected) => onSelect(meeting.id, selected)}
          onJoin={() => onJoin(meeting)}
          onEdit={() => onEdit(meeting)}
          onDelete={() => onDelete(meeting)}
          variant="list"
        />
      </div>
    )
  }, [meetings, selectedMeetings, userRole, onJoin, onEdit, onDelete, onSelect])

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium mb-2">No meetings found</p>
          <p className="text-sm">Create a new meeting to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            List
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Virtualized List */}
      <div className="h-[calc(100vh-300px)]">
        {viewMode === 'grid' ? (
          <List
            height={600}
            itemCount={rows}
            itemSize={ITEM_HEIGHT}
            width="100%"
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {GridRow}
          </List>
        ) : (
          <List
            height={600}
            itemCount={meetings.length}
            itemSize={120} // Height for list items
            width="100%"
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {ListRow}
          </List>
        )}
      </div>
    </div>
  )
}





