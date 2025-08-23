import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  Video, 
  Mic, 
  Wifi, 
  Monitor, 
  Save,
  RotateCcw,
  Info
} from 'lucide-react'
import { webrtcService, WebRTCSettings } from '@/services/webrtcService'
import { toast } from 'sonner'

interface WebRTCSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function WebRTCSettingsPanel({
  isOpen,
  onClose,
  className
}: WebRTCSettingsPanelProps) {
  const [settings, setSettings] = useState<WebRTCSettings>({
    videoQuality: 'high',
    audioQuality: 'high',
    bandwidthLimit: 0,
    enableAdaptiveQuality: true,
    enableBandwidthOptimization: true
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Load current settings
      const currentSettings = webrtcService.getSettings()
      setSettings(currentSettings)
    }
  }, [isOpen])

  const handleSettingChange = (key: keyof WebRTCSettings, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      webrtcService.updateSettings(settings)
      toast.success('WebRTC settings saved successfully')
      onClose()
    } catch (error) {
      toast.error('Failed to save WebRTC settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSettings = () => {
    const defaultSettings: WebRTCSettings = {
      videoQuality: 'high',
      audioQuality: 'high',
      bandwidthLimit: 0,
      enableAdaptiveQuality: true,
      enableBandwidthOptimization: true
    }
    setSettings(defaultSettings)
    toast.info('Settings reset to defaults')
  }

  const getQualityDescription = (quality: string) => {
    switch (quality) {
      case 'high':
        return 'Best quality, higher bandwidth usage'
      case 'medium':
        return 'Balanced quality and bandwidth'
      case 'low':
        return 'Lower quality, minimal bandwidth usage'
      default:
        return ''
    }
  }

  const formatBandwidth = (bytesPerSecond: number) => {
    if (bytesPerSecond === 0) return 'Unlimited'
    
    const k = 1024
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
    
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <CardTitle>WebRTC Settings</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Quality Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Video className="h-4 w-4" />
              <Label className="text-sm font-medium">Video Quality</Label>
            </div>
            <Select
              value={settings.videoQuality}
              onValueChange={(value) => handleSettingChange('videoQuality', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Quality (1920x1080, 30fps)</SelectItem>
                <SelectItem value="medium">Medium Quality (1280x720, 24fps)</SelectItem>
                <SelectItem value="low">Low Quality (640x480, 15fps)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {getQualityDescription(settings.videoQuality)}
            </p>
          </div>

          <Separator />

          {/* Audio Quality Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mic className="h-4 w-4" />
              <Label className="text-sm font-medium">Audio Quality</Label>
            </div>
            <Select
              value={settings.audioQuality}
              onValueChange={(value) => handleSettingChange('audioQuality', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Quality (48kHz, Stereo)</SelectItem>
                <SelectItem value="medium">Medium Quality (44.1kHz, Stereo)</SelectItem>
                <SelectItem value="low">Low Quality (22kHz, Mono)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {getQualityDescription(settings.audioQuality)}
            </p>
          </div>

          <Separator />

          {/* Bandwidth Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4" />
              <Label className="text-sm font-medium">Bandwidth Limit</Label>
            </div>
            <div className="space-y-2">
              <Slider
                value={[settings.bandwidthLimit]}
                onValueChange={([value]) => handleSettingChange('bandwidthLimit', value)}
                max={10000000} // 10MB/s
                step={100000} // 100KB/s
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Unlimited</span>
                <span>{formatBandwidth(settings.bandwidthLimit)}</span>
                <span>10 MB/s</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Limit bandwidth usage to prevent network congestion
            </p>
          </div>

          <Separator />

          {/* Optimization Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <Label className="text-sm font-medium">Optimization</Label>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Adaptive Quality</Label>
                  <p className="text-xs text-gray-500">
                    Automatically adjust quality based on network conditions
                  </p>
                </div>
                <Switch
                  checked={settings.enableAdaptiveQuality}
                  onCheckedChange={(checked) => handleSettingChange('enableAdaptiveQuality', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Bandwidth Optimization</Label>
                  <p className="text-xs text-gray-500">
                    Optimize bandwidth usage for better performance
                  </p>
                </div>
                <Switch
                  checked={settings.enableBandwidthOptimization}
                  onCheckedChange={(checked) => handleSettingChange('enableBandwidthOptimization', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Information */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Settings Information</p>
                <p>Changes will apply to new connections. Existing connections may need to be reconnected for full effect.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleResetSettings}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




