import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, Brain, Zap, Sparkles, Copy, Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const examTypes = [
  { value: 'mri', label: 'MRI' },
  { value: 'ct', label: 'CT Scan' },
  { value: 'xray', label: 'X-Ray' },
  { value: 'ultrasound', label: 'Ultrasound' },
];

const TabContent = ({ task, inputValue, setInputValue, isLoading, handleSubmit }) => {
  const inputProps = {
    id: task,
    placeholder: task === 'radgen' ? "Describe the findings here..." :
                 task === 'impressions' ? "Paste the full report here..." :
                 "Paste your text here...",
    rows: task === 'radgen' ? 5 : 10,
    value: inputValue,
    onChange: (e) => setInputValue(e.target.value),
    className: "resize-none"
  };

  const buttonProps = {
    text: task === 'radgen' ? "Generate Report" :
          task === 'impressions' ? "Generate Impressions" :
          "Enhance Text",
    icon: task === 'radgen' ? Brain : task === 'impressions' ? Zap : Sparkles,
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, task)} className="space-y-4">
      {task === 'radgen' && (
        <div className="space-y-2">
          <Label htmlFor="examType">Exam Type</Label>
          <Select onValueChange={(value) => setInputValue({ ...inputValue, examType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select exam type" />
            </SelectTrigger>
            <SelectContent>
              {examTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={task}>
          {task === 'radgen' ? 'Findings' : task === 'impressions' ? 'Full Report' : 'Text to Enhance'}
        </Label>
        <Textarea {...inputProps} />
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <buttonProps.icon className="mr-2 h-4 w-4" />
                  {buttonProps.text}
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{buttonProps.text} using AI</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </form>
  );
};

const ResultDisplay = ({ result, error, handleCopy, handleDownload }) => (
  <div className="mt-6 space-y-4">
    {error && (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}
    {result && (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Result
            <div className="space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleDownload}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download result</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] w-full rounded-md border">
            <div className="p-4">
              <pre className="whitespace-pre-wrap">{result}</pre>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )}
  </div>
);

const AIQuickRad = () => {
  const [activeTab, setActiveTab] = useState('radgen');
  const [inputValues, setInputValues] = useState({
    radgen: { examType: '', findings: '' },
    impressions: '',
    'smart-text': ''
  });
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme, setTheme } = useTheme();

  const handleSubmit = async (e, task) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          examType: task === 'radgen' ? inputValues.radgen.examType : '',
          findings: task === 'radgen' ? inputValues.radgen.findings : inputValues[task],
          task 
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process request');
      setResult(data.result);
    } catch (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([result], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "ai_quick_rad_result.txt";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold">AI Quick Rad</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle theme</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>Advanced Radiology Reporting System</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="radgen">RadGen</TabsTrigger>
              <TabsTrigger value="impressions">Impressions</TabsTrigger>
              <TabsTrigger value="smart-text">Smart Text</TabsTrigger>
            </TabsList>
            {['radgen', 'impressions', 'smart-text'].map(task => (
              <TabsContent key={task} value={task}>
                <TabContent
                  task={task}
                  inputValue={task === 'radgen' ? inputValues[task] : inputValues[task]}
                  setInputValue={(value) => setInputValues(prev => ({ ...prev, [task]: value }))}
                  isLoading={isLoading}
                  handleSubmit={handleSubmit}
                />
              </TabsContent>
            ))}
          </Tabs>
          
          <ResultDisplay 
            result={result} 
            error={error} 
            handleCopy={handleCopy}
            handleDownload={handleDownload}
          />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">Powered by AI</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AIQuickRad;
