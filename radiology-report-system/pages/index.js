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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!examType || !findings) {
        setReport('Please fill in all fields.');
        setIsLoading(false);
        return;
      }

      const response = await axios.post('/api/generate-report', { examType, findings });
      setReport(response.data.report);
    } catch (error) {
      console.error('Error generating report:', error.response?.data || error.message);
      setReport('Error generating report. Please try again.');
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
