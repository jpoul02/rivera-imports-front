"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, RotateCcw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SettingsScreen() {
  const { config, updateConfig, resetDatos } = useApp();
  const [nombre, setNombre] = useState(config.nombreNegocio);
  const [umbral, setUmbral] = useState(String(config.umbralStockBajo));

  const guardar = () => {
    const u = Number(umbral);
    if (!nombre.trim()) {
      toast.error("El nombre del negocio es obligatorio");
      return;
    }
    if (Number.isNaN(u) || u < 0 || !Number.isInteger(u)) {
      toast.error("Umbral inválido");
      return;
    }
    updateConfig({ nombreNegocio: nombre.trim(), umbralStockBajo: u });
    toast.success("Configuración guardada");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="display-title text-3xl sm:text-4xl">CONFIGURACIÓN</h1>
        <div className="mt-2 h-0.5 w-12 bg-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="display-title flex items-center gap-2 text-lg">
            <Building2 className="h-4 w-4 text-primary" />
            NEGOCIO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="negocio">Nombre del negocio</Label>
            <Input
              id="negocio"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="umbral">Umbral de stock bajo</Label>
            <Input
              id="umbral"
              type="number"
              min="0"
              step="1"
              value={umbral}
              onChange={(e) => setUmbral(e.target.value)}
              className="h-10 w-32 font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Los artículos con stock igual o menor a este número se marcan en rojo.
            </p>
          </div>
          <Button className="h-10" onClick={guardar}>
            Guardar cambios
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="display-title text-lg text-destructive">
            ZONA DE PELIGRO
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Restablecer datos de demostración</p>
            <p className="text-xs text-muted-foreground">
              Borra los cambios locales y vuelve al inventario de ejemplo.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="h-10 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
              >
                <RotateCcw className="h-4 w-4" />
                Restablecer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Restablecer todos los datos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se perderán los artículos, ventas y usuarios creados en este navegador.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-10">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="h-10 bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    resetDatos();
                    toast.success("Datos restablecidos");
                  }}
                >
                  Sí, restablecer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
