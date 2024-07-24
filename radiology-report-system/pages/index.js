import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [examType, setExamType] = useState('')
  const [findings, setFindings] = useState('')
  const [report, setReport] = useState('')
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/generateReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ examType, findings }),
      })
      const data = await response.json()
      setReport(data.report)
      toast({
        title: "Relatório gerado com sucesso!",
        description: "O relatório foi gerado e está pronto para revisão.",
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">AI Quick Rad</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />
            <Label htmlFor="dark-mode">Modo Escuro</Label>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit">Gerar Relatório</Button>
          </form>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Relatório Gerado</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap">{report}</pre>
          </CardContent>
        </Card>
      )}

      <Toaster />
    </div>
  )
}
