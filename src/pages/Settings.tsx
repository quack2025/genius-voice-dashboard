import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">Administra las preferencias de tu cuenta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Configuración general
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Las opciones de configuración estarán disponibles próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
