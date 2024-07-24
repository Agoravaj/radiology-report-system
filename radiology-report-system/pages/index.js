import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import axios from 'axios';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// ... MenuBar and RichTextEditor components remain unchanged

export default function Home() {
  const [examType, setExamType] = useState('');
  const [findings, setFindings] = useState('');
  const [report, setReport] = useState('');
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!examType || !findings) {
        setReport('Por favor, preencha todos os campos.');
        setIsLoading(false);
        return;
      }

      const response = await axios.post('/api/generate-report', { examType, findings });
      setReport(response.data.report);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      if (error.response) {
        setReport(`Erro: ${error.response.data.error || 'Ocorreu um erro ao gerar o relatório.'}`);
      } else if (error.request) {
        setReport('Erro: Nenhuma resposta recebida do servidor. Por favor, tente novamente.');
      } else {
        setReport('Erro: Ocorreu um erro inesperado. Por favor, tente novamente.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className={`container mx-auto p-4 ${theme}`}>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">AI Quick Rad</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              id="theme-switch"
            />
            <Label htmlFor="theme-switch">Modo Escuro</Label>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="examType">Tipo de Exame</Label>
              <Input
                id="examType"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                placeholder="Ex: Ressonância Magnética do Ombro Direito"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="findings">Achados</Label>
              <Textarea
                id="findings"
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="Descreva os achados aqui..."
                rows={5}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </CardFooter>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório Gerado</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor initialContent={report} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}