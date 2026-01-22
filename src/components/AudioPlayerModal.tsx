import { useEffect, useRef, useState } from 'react';
import { Recording, supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, X } from 'lucide-react';

interface AudioPlayerModalProps {
  recording: Recording | null;
  onClose: () => void;
}

export default function AudioPlayerModal({ recording, onClose }: AudioPlayerModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recording) {
      loadAudio();
    } else {
      setAudioUrl(null);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [recording]);

  const loadAudio = async () => {
    if (!recording) return;
    
    setLoading(true);
    
    const { data } = await supabase.storage
      .from('voice-recordings')
      .createSignedUrl(recording.audio_path, 3600);

    if (data?.signedUrl) {
      setAudioUrl(data.signedUrl);
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <Dialog open={!!recording} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Reproducir Audio</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleEnded}
                />
              )}

              <div className="flex items-center justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 w-16 rounded-full"
                  onClick={togglePlay}
                  disabled={!audioUrl}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration || recording?.duration_seconds || 0}
                  step={0.1}
                  onValueChange={handleSliderChange}
                  disabled={!audioUrl}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration || recording?.duration_seconds || 0)}</span>
                </div>
              </div>

              {recording?.session_id && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Session ID</p>
                  <p className="text-sm font-mono">{recording.session_id}</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
