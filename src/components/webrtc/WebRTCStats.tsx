import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Wifi, 
  Signal, 
  SignalHigh, 
  SignalMedium, 
  SignalLow,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { webrtcService, WebRTCStats as WebRTCStatsType } from '@/services/webrtcService'

interface WebRTCStatsProps {
  className?: string
}

export function WebRTCStats({ className }: WebRTCStatsProps) {
  const [stats, setStats] = useState<WebRTCStatsType[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    // Start monitoring when component mounts
    startMonitoring()
    
    return () => {
      // Stop monitoring when component unmounts
      stopMonitoring()
    }
  }, [])

  const startMonitoring = () => {
    webrtcService.onStatsUpdate = (newStats) => {
      setStats(newStats)
      setLastUpdate(new Date())
    }
    
    webrtcService.startStatsMonitoring(3000) // Update every 3 seconds
    setIsMonitoring(true)
  }

  const stopMonitoring = () => {
    webrtcService.stopStatsMonitoring()
    setIsMonitoring(false)
  }

  const getOverallQuality = (): 'high' | 'medium' | 'low' => {
    if (stats.length === 0) return 'medium'
    
    const avgPacketLoss = stats.reduce((sum, stat) => sum + stat.packetsLost, 0) / stats.length
    const avgBandwidth = stats.reduce((sum, stat) => sum + stat.bandwidth, 0) / stats.length
    
    if (avgPacketLoss > 5 || avgBandwidth < 500000) return 'low'
    if (avgPacketLoss > 2 || avgBandwidth < 1000000) return 'medium'
    return 'high'
  }

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'high':
        return <SignalHigh className="h-4 w-4 text-green-500" />
      case 'medium':
        return <SignalMedium className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <SignalLow className="h-4 w-4 text-red-500" />
      default:
        return <Signal className="h-4 w-4 text-gray-500" />
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

  const getConnectionStatus = () => {
    const connectedPeers = stats.filter(stat => stat.bandwidth > 0).length
    const totalPeers = stats.length
    
    if (totalPeers === 0) {
      return {
        status: 'No connections',
        color: 'text-gray-500',
        icon: <AlertTriangle className="h-4 w-4" />
      }
    }
    
    if (connectedPeers === totalPeers) {
      return {
        status: 'All connected',
        color: 'text-green-500',
        icon: <CheckCircle className="h-4 w-4" />
      }
    }
    
    return {
      status: `${connectedPeers}/${totalPeers} connected`,
      color: 'text-yellow-500',
      icon: <Clock className="h-4 w-4" />
    }
  }

  const overallQuality = getOverallQuality()
  const connectionStatus = getConnectionStatus()
  const totalBandwidth = stats.reduce((sum, stat) => sum + stat.bandwidth, 0)
  const avgLatency = stats.length > 0 ? stats.reduce((sum, stat) => sum + stat.roundTripTime, 0) / stats.length : 0
  const avgPacketLoss = stats.length > 0 ? stats.reduce((sum, stat) => sum + stat.packetsLost, 0) / stats.length : 0

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">WebRTC Statistics</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {connectionStatus.icon}
            <span className={cn('text-sm', connectionStatus.color)}>
              {connectionStatus.status}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Quality */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {getQualityIcon(overallQuality)}
            <span className="font-medium">Overall Quality</span>
          </div>
          <Badge variant={overallQuality === 'high' ? 'default' : overallQuality === 'medium' ? 'secondary' : 'destructive'}>
            {overallQuality.toUpperCase()}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Bandwidth</span>
              <Wifi className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-lg font-semibold">{formatBandwidth(totalBandwidth)}</div>
            <Progress 
              value={Math.min((totalBandwidth / 5000000) * 100, 100)} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Latency</span>
              <Clock className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-lg font-semibold">{formatLatency(avgLatency)}</div>
            <Progress 
              value={Math.min((avgLatency / 200) * 100, 100)} 
              className="h-2"
            />
          </div>
        </div>

        {/* Packet Loss */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Average Packet Loss</span>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-lg font-semibold">{avgPacketLoss.toFixed(1)}%</div>
          <Progress 
            value={Math.min(avgPacketLoss * 10, 100)} 
            className="h-2"
          />
        </div>

        {/* Individual Peer Stats */}
        {stats.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Peer Connections</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.map((stat) => (
                <div key={stat.peerId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    {getQualityIcon(stat.quality)}
                    <span className="text-sm font-medium">{stat.peerId}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>{formatBandwidth(stat.bandwidth)}</span>
                    <span>{formatLatency(stat.roundTripTime)}</span>
                    <span>{stat.packetsLost.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monitoring Status */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">Monitoring</span>
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isMonitoring ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="text-sm text-gray-600">
              {isMonitoring ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function for className concatenation
function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}




