import {
  IconArrowDown,
  IconArrowRight,
  IconArrowUp,
  IconCircle,
  IconCircleCheck,
  IconCircleX,
  IconExclamationCircle,
  IconStopwatch,
} from '@tabler/icons-react'

// Force refresh - priorities removed
export const labels = [
  {
    value: 'bug',
    label: 'Bug',
  },
  {
    value: 'feature',
    label: 'Feature',
  },
  {
    value: 'documentation',
    label: 'Documentation',
  },
]

export const statuses = [
  {
    value: 'PENDING',
    label: 'Pending',
    icon: IconCircle,
  },
  {
    value: 'IN_PROGRESS',
    label: 'In Progress',
    icon: IconStopwatch,
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
    icon: IconCircleCheck,
  },
]
