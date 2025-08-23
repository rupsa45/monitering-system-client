import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Wifi, 
  WifiOff, 
  Signal, 
  SignalHigh, 
  SignalMedium, 
  SignalLow,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface WebRTCConnectionStatusProps {
  peerId: string
  peerName: string
  isConnected: boolean
  isConnecting: boolean
  quality: 'high' | 'medium' | 'low'
  bandwidth: number
  packetLoss: number
  latency: number
  className?: string
}

export function WebRTCConnectionStatus({
  peerId,
  peerName,
  isConnected,
  isConnecting,
  quality,
  bandwidth,
  packetLoss,
  latency,
  className
}: WebRTCConnectionStatusProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    setLastUpdate(new Date())
  }, [bandwidth, packetLoss, latency])

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high':
        return 'text-green-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'high':
        return <SignalHigh className="h-4 w-4" />
      case 'medium':
        return <SignalMedium className="h-4 w-4" />
      case 'low':
        return <SignalLow className="h-4 w-4" />
      default:
        return <Signal className="h-4 w-4" />
    }
  }

  const getConnectionStatus = () => {
    if (isConnecting) {
      return {
        icon: <Clock className="h-4 w-4 text-yellow-500" />,
        text: 'Connecting...',
        color: 'text-yellow-500'
      }
    }
    
    if (isConnected) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        text: 'Connected',
        color: 'text-green-500'
      }
    }
    
    return {
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      text: 'Disconnected',
      color: 'text-red-500'
    }
  }

  const formatBandwidth = (bytesPerSecond: number) => {
    if (bytesPerSecond === 0) return '0 B/s'
    
    const k = 1024
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
    
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatLatency = (ms: number) => {
    if (ms < 100) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const connectionStatus = getConnectionStatus()

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{peerName}</CardTitle>
          <div className="flex items-center space-x-2">
            {connectionStatus.icon}
            <span className={cn('text-xs', connectionStatus.color)}>
              {connectionStatus.text}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Quality Indicator */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Quality</span>
            <div className="flex items-center space-x-1">
              {getQualityIcon(quality)}
              <span className={cn('text-xs font-medium', getQualityColor(quality))}>
                {quality.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Bandwidth */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Bandwidth</span>
            <div className="flex items-center space-x-1">
              <Activity className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium">
                {formatBandwidth(bandwidth)}
              </span>
            </div>
          </div>

          {/* Packet Loss */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Packet Loss</span>
            <span className={cn(
              'text-xs font-medium',
              packetLoss > 5 ? 'text-red-500' : packetLoss > 2 ? 'text-yellow-500' : 'text-green-500'
            )}>
              {packetLoss.toFixed(1)}%
            </span>
          </div>

          {/* Latency */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Latency</span>
            <span className={cn(
              'text-xs font-medium',
              latency > 200 ? 'text-red-500' : latency > 100 ? 'text-yellow-500' : 'text-green-500'
            )}>
              {formatLatency(latency)}
            </span>
          </div>

          {/* Last Update */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-400">Last Update</span>
            <span className="text-xs text-gray-400">
              {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}




