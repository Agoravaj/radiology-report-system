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
import { Loader2, Sun, Moon, FileText, Clipboard } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <ToggleGroup type="multiple" className="flex flex-wrap gap-2 mb-4">
      <ToggleGroupItem value="bold" aria-label="Toggle bold" onClick={() => editor.chain().focus().toggleBold().run()} data-state={editor.isActive('bold') ? "on" : "off"}>
        B
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic" onClick={() => editor.chain().focus().toggleItalic().run()} data-state={editor.isActive('italic') ? "on" : "off"}>
        I
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline" onClick={() => editor.chain().focus().toggleUnderline().run()} data-state={editor.isActive('underline') ? "on" : "off"}>
        U
      </ToggleGroupItem>
      <ToggleGroupItem value="highlight" aria-label="Toggle highlight" onClick={() => editor.chain().focus().toggleHighlight().run()} data-state={editor.isActive('highlight') ? "on" : "off"}>
        H
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

const RichTextEditor = ({ initialContent }) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline, TextAlign.configure({ types: ['heading', 'paragraph'] }), Highlight],
    content: initialContent,
  });

  return (
    <div className="rich-text-editor">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="prose dark:prose-invert max-w-none p-4 border rounded-md" />
    </div>
  );
};

export default function Home() {
  const [examType, setExamType] = useState('');
  const [findings, setFindings] = useState('');
  const [report, setReport] = useState('');
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (!examType || !findings) {
        throw new Error('Por favor, preencha todos os campos.');
      }
      const response = await axios.post('/api/generate-report', { examType, findings });
      setReport(response.data.report);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      if (error.response) {
        setError(`Erro: ${error.response.data.error || 'Ocorreu um erro ao gerar o relatório.'}`);
      } else if (error.request) {
        setError('Erro: Nenhuma resposta recebida do servidor. Por favor, tente novamente.');
      } else {
        setError(error.message || 'Erro: Ocorreu um erro inesperado. Por favor, tente novamente.');
      }
    }
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(report).then(() => {
      alert('Relatório copiado para a área de transferência!');
    });
  };

  return (
    <div className={`container mx-auto p-4 ${theme} min-h-screen`}>
      <Card className="mb-8 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-3xl font-bold flex items-center">
            <FileText className="mr-2" />
            AI Quick Rad
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              id="theme-switch"
            />
            <Label htmlFor="theme-switch" className="flex items-center">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Label>
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
                className="w-full"
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
                className="w-full"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button type="submit" onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </CardFooter>
      </Card>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {report && (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Relatório Gerado</CardTitle>
            <Button variant="outline" size="icon" onClick={copyToClipboard}>
              <Clipboard className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <RichTextEditor initialContent={report} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}