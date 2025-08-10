'use client'

import { useState } from 'react'
import { z } from 'zod'
import { createRoomSchema } from '@/lib/validations'
import { roomHelpers } from '@/lib/api-helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Gamepad2, Settings, Clock, Play, X } from 'lucide-react'

interface CreateRoomDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (room: { id: string; code: string }) => void
}

export const CreateRoomDialog = ({ open, onClose, onCreated }: CreateRoomDialogProps) => {
  const [numRounds, setNumRounds] = useState(3)
  const [roundTime, setRoundTime] = useState(60)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!open) return null

  const validate = () => {
    const parsed = createRoomSchema.safeParse({ numRounds, roundTime })
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.errors.forEach((err) => {
        const field = (err.path?.[0] as string) || 'form'
        fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setIsSubmitting(true)
      const { data, error } = await roomHelpers.createRoom({ numRounds, roundTime })
      if (error || !data) {
        toast.error(error || 'Failed to create room')
        return
      }
      toast.success('Room created successfully!')
      onCreated(data as { id: string; code: string })
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-blue-50/50 opacity-60" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors duration-200"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <CardHeader className="relative z-10 text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Create New Room</CardTitle>
          <p className="text-gray-600 text-sm">Configure your game settings</p>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-600" />
                  Number of Rounds
                </label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={numRounds}
                  onChange={(e) => setNumRounds(parseInt(e.target.value || '0', 10))}
                  disabled={isSubmitting}
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 text-lg"
                  placeholder="3"
                />
                {errors.numRounds && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.numRounds}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Round Time (seconds)
                </label>
                <Input
                  type="number"
                  min={30}
                  max={300}
                  value={roundTime}
                  onChange={(e) => setRoundTime(parseInt(e.target.value || '0', 10))}
                  disabled={isSubmitting}
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 text-lg"
                  placeholder="60"
                />
                {errors.roundTime && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.roundTime}
                  </p>
                )}
              </div>
            </div>

            {errors.form && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                {errors.form}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isSubmitting}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Create Room
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
