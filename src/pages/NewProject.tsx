import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Check, Code } from 'lucide-react';

export default function NewProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('es');
  const [mode, setMode] = useState('realtime');
  const [isLoading, setIsLoading] = useState(false);
  const [showSnippetModal, setShowSnippetModal] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [copied, setCopied] = useState(false);

  const generatePublicKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'proj_';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del proyecto es requerido',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const newPublicKey = generatePublicKey();

    const { error } = await supabase.from('projects').insert({
      user_id: user!.id,
      name: name.trim(),
      public_key: newPublicKey,
      language,
      transcription_mode: mode,
    });

    if (error) {
      toast({
        title: 'Error al crear proyecto',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    setPublicKey(newPublicKey);
    setShowSnippetModal(true);
    setIsLoading(false);
  };

  const snippet = `<div id="genius-voice" data-project="${publicKey}"></div>
<script src="https://cdn.geniuslabs.ai/voice.js"></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: '¡Copiado!',
      description: 'El snippet ha sido copiado al portapapeles',
    });
  };

  const handleCloseModal = () => {
    setShowSnippetModal(false);
    navigate('/dashboard');
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a proyectos
        </button>
        <h1 className="text-2xl font-bold text-foreground">Nuevo Proyecto</h1>
        <p className="text-muted-foreground mt-1">Configura un nuevo proyecto de captura de voz</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del proyecto</CardTitle>
          <CardDescription>
            Completa los datos para crear tu proyecto de Voice Capture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del proyecto *</Label>
              <Input
                id="name"
                placeholder="Ej: Encuesta satisfacción Q1 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma principal</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Modo de transcripción</Label>
              <RadioGroup value={mode} onValueChange={setMode} className="space-y-3">
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="realtime" id="realtime" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="realtime" className="cursor-pointer font-medium">
                      Real-Time
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Transcripción automática inmediata al recibir cada grabación
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="batch" id="batch" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="batch" className="cursor-pointer font-medium">
                      Batch
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Transcripción bajo demanda para optimizar costos
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear Proyecto'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Snippet Modal */}
      <Dialog open={showSnippetModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>¡Proyecto creado!</DialogTitle>
                <DialogDescription>
                  Copia este snippet e intégralo en tu encuesta
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4">
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">{snippet}</pre>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleCloseModal}>
              Ir al dashboard
            </Button>
            <Button onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar snippet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
