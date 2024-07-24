// pages/index.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';

// Utility functions
const analyzeReport = async (report) => {
  const response = await fetch('/api/analyzeReport', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Analyze the following radiology report and provide:
          1. Suggestions for improvement
          2. Completeness check
          3. Consistency check
          4. Adherence to best practices
          5. Flag any critical findings
          6. Suggest relevant additional findings based on the context

          Report:
          ${report}`
        }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze report');
  }

  const data = await response.json();
  const aiResponse = data.content[0].text;

  const criticalFindingsMatch = aiResponse.match(/Critical findings:([\s\S]*?)(?:\n\n|$)/);
  const criticalFindings = criticalFindingsMatch 
    ? criticalFindingsMatch[1].split('\n').filter(item => item.trim()) 
    : [];

  return { aiSuggestions: aiResponse, criticalFindings };
};

const exportReport = (report) => {
  const element = document.createElement("a");
  const file = new Blob([report], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = "radiology_report.txt";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const templates = {
  'ct-brain': '# CT Brain\n\n## Technique\n\n## Findings\n\n## Impression\n',
  'mri-knee': '# MRI Knee\n\n## Technique\n\n## Findings\n\n## Impression\n',
  'chest-xray': '# Chest X-Ray\n\n## Technique\n\n## Findings\n\n## Impression\n'
};

const medicalTerms = [
  'pneumonia', 'fracture', 'edema', 'metastasis', 'atherosclerosis',
  'cardiomegaly', 'effusion', 'pneumothorax', 'atelectasis', 'emphysema',
  'osteophyte', 'stenosis', 'herniation', 'aneurysm', 'neoplasm'
];

// Components
const Sidebar = ({ templates, setTemplate, customSections, onAddCustomSection }) => (
  <div className="w-64 p-4 border-r border-zinc-300">
    <h3 className="mb-2 text-lg font-semibold text-zinc-800">Templates</h3>
    <ul>
      {Object.keys(templates).map(key => (
        <li key={key} className="cursor-pointer hover:text-zinc-600" onClick={() => setTemplate(key)}>{key}</li>
      ))}
    </ul>
    <h3 className="mt-6 mb-2 text-lg font-semibold text-zinc-800">Custom Sections</h3>
    <ul>
      {customSections.map((section, index) => (
        <li key={index}>{section}</li>
      ))}
    </ul>
    <button onClick={onAddCustomSection} className="mt-4 bg-zinc-700 text-zinc-100 px-4 py-2 rounded hover:bg-zinc-600">
      Add Custom Section
    </button>
  </div>
);

const Editor = React.forwardRef(({ value, onChange, medicalTerms }, ref) => {
  const [suggestions, setSuggestions] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    const lastWord = value.slice(0, cursorPosition).split(' ').pop();
    if (lastWord.length > 2) {
      const matchingSuggestions = medicalTerms.filter(term => 
        term.startsWith(lastWord.toLowerCase()) && term !== lastWord.toLowerCase()
      );
      setSuggestions(matchingSuggestions.slice(0, 3));
    } else {
      setSuggestions([]);
    }
  }, [value, cursorPosition, medicalTerms]);

  const handleChange = (e) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleSuggestionClick = (suggestion) => {
    const words = value.slice(0, cursorPosition).split(' ');
    words.pop();
    const newValue = words.join(' ') + ' ' + suggestion + ' ' + value.slice(cursorPosition);
    onChange(newValue);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const newValue = value.slice(0, e.target.selectionStart) + '  ' + value.slice(e.target.selectionEnd);
            onChange(newValue);
            e.target.selectionStart = e.target.selectionEnd = e.target.selectionStart + 2;
          }
        }}
        className="w-full h-[calc(100vh-300px)] p-4 border border-zinc-300 rounded resize-none bg-zinc-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500"
        placeholder="Enter your radiology report here..."
      />
      {suggestions.length > 0 && (
        <div className="absolute bottom-0 left-0 bg-zinc-100 border border-zinc-300 rounded shadow-lg">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 cursor-pointer hover:bg-zinc-200"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

Editor.displayName = 'Editor';

const Preview = ({ report }) => (
  <div className="border border-zinc-300 rounded p-4 h-[calc(100vh-300px)] overflow-auto bg-zinc-50 text-zinc-800">
    {report.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mb-4 text-zinc-900">{line.substring(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold mb-2 text-zinc-800">{line.substring(3)}</h2>;
      } else {
        return <p key={index} className="mb-2 text-zinc-700">{line}</p>;
      }
    })}
  </div>
);

const Toolbar = ({
  onLoadTemplate,
  onToggleSidebar,
  onInsertMeasurement,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isRealTimeAnalysis,
  onToggleRealTimeAnalysis
}) => (
  <div className="flex flex-wrap gap-2 mb-4">
    <button onClick={onLoadTemplate} className="bg-zinc-700 text-zinc-100 px-4 py-2 rounded hover:bg-zinc-600">Load Template</button>
    <button onClick={onToggleSidebar} className="bg-zinc-600 text-zinc-100 px-4 py-2 rounded hover:bg-zinc-500">Toggle Sidebar</button>
    <button onClick={onInsertMeasurement} className="bg-zinc-700 text-zinc-100 px-4 py-2 rounded hover:bg-zinc-600">Insert Measurement</button>
    <button onClick={onUndo} disabled={!canUndo} className={`px-4 py-2 rounded ${canUndo ? 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600' : 'bg-zinc-300 text-zinc-500'}`}>Undo</button>
    <button onClick={onRedo} disabled={!canRedo} className={`px-4 py-2 rounded ${canRedo ? 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600' : 'bg-zinc-300 text-zinc-500'}`}>Redo</button>
    <button 
      onClick={onToggleRealTimeAnalysis} 
      className={`px-4 py-2 rounded ${isRealTimeAnalysis ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-600 text-zinc-100'} hover:bg-zinc-700`}
    >
      Real-time Analysis: {isRealTimeAnalysis ? 'ON' : 'OFF'}
    </button>
  </div>
);

const StatusBar = ({
  wordCount,
  readabilityScore,
  completenessScore,
  activeSection,
  isAnalyzing,
  onAnalyze,
  onExport
}) => (
  <div className="flex flex-wrap justify-between items-center mt-4 p-2 bg-zinc-100 rounded text-zinc-700">
    <span>Words: {wordCount}</span>
    <span>Readability Score: {readabilityScore.toFixed(2)}%</span>
    <span>Completeness: {completenessScore.toFixed(2)}%</span>
    <span>Current Section: {activeSection}</span>
    <button 
      onClick={onAnalyze} 
      disabled={isAnalyzing}
      className={`px-4 py-2 rounded ${isAnalyzing ? 'bg-zinc-300 text-zinc-500' : 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600'}`}
    >
      {isAnalyzing ? 'Analyzing...' : 'Analyze Report'}
    </button>
    <button onClick={onExport} className="bg-zinc-700 text-zinc-100 px-4 py-2 rounded hover:bg-zinc-600">
      Export Report
    </button>
  </div>
);

const AISuggestions = ({ suggestions }) => (
  <div className="mt-4 p-4 border border-zinc-300 rounded bg-zinc-50 text-zinc-800">
    <h2 className="text-xl font-semibold mb-2 text-zinc-900">AI Suggestions</h2>
    <p>{suggestions}</p>
  </div>
);

const CriticalFindings = ({ findings }) => (
  <div className="mt-4 p-4 border border-zinc-400 rounded bg-zinc-100 text-zinc-800">
    <h2 className="text-xl font-semibold mb-2 text-zinc-900">Critical Findings</h2>
    <ul className="list-disc pl-5">
      {findings.map((finding, index) => (
        <li key={index} className="text-zinc-700">{finding}</li>
      ))}
    </ul>
  </div>
);

const FloatingActionButton = ({ onSave, onExport, onAnalyze }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4">
      {isOpen && (
        <div className="mb-2 flex flex-col gap-2">
          <button onClick={onSave} className="bg-zinc-700 text-zinc-100 w-12 h-12 rounded-full shadow-lg hover:bg-zinc-600">💾</button>
          <button onClick={onExport} className="bg-zinc-700 text-zinc-100 w-12 h-12 rounded-full shadow-lg hover:bg-zinc-600">📤</button>
          <button onClick={onAnalyze} className="bg-zinc-700 text-zinc-100 w-12 h-12 rounded-full shadow-lg hover:bg-zinc-600">🔍</button>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="bg-zinc-800 text-zinc-100 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-zinc-700"
      >
        {isOpen ? '✕' : '+'}
      </button>
    </div>
  );
};

// Main App Component
export default function AdvancedRadiologyReportSystem() {
  const [report, setReport] = useState('');
  const [template, setTemplate] = useState('ct-brain');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [readabilityScore, setReadabilityScore] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [customSections, setCustomSections] = useState([]);
  const [versionHistory, setVersionHistory] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [isRealTimeAnalysis, setIsRealTimeAnalysis] = useState(false);
  const [criticalFindings, setCriticalFindings] = useState([]);
  const [completenessScore, setCompletenessScore] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const editorRef = useRef(null);

  useEffect(() => {
    const words = report.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setReadabilityScore(calculateReadabilityScore(report));
    setCompletenessScore(calculateCompletenessScore(report));
    setActiveSection(getCurrentSection(report));

    if (isRealTimeAnalysis) {
      const debounce = setTimeout(() => {
        handleAnalyzeReport(true);
      }, 1000);
      return () => clearTimeout(debounce);
    }
  }, [report, isRealTimeAnalysis]);

  const handleAnalyzeReport = useCallback(async (isRealTime = false) => {
    if (!isRealTime) setIsAnalyzing(true);
    try {
      const { aiSuggestions, criticalFindings } = await analyzeReport(report);
      setAiSuggestions(aiSuggestions);
      setCriticalFindings(criticalFindings);
    } catch (error) {
      alert("An error occurred while analyzing the report.");
    } finally {
      if (!isRealTime) setIsAnalyzing(false);
    }
  }, [report]);

  const handleReportChange = (newReport) => {
    setReport(newReport);
    if (currentVersion < versionHistory.length - 1) {
      setVersionHistory(versionHistory.slice(0, currentVersion + 1));
    }
    setVersionHistory([...versionHistory, newReport]);
    setCurrentVersion(versionHistory.length);
  };

  const handleInsertMeasurement = () => {
    const measurement = prompt("Enter measurement (e.g., 5 cm):");
    if (measurement) {
      const newReport = insertAtCursor(report, measurement);
      handleReportChange(newReport);
    }
  };

  const handleAddCustomSection = () => {
    const sectionName = prompt("Enter new section name:");
    if (sectionName) {
      setCustomSections([...customSections, sectionName]);
      handleReportChange(report + '\n\n## ' + sectionName + '\n');
    }
  };

  const insertAtCursor = (text, insertion) => {
    const cursorPosition = editorRef.current.selectionStart;
    return text.substring(0, cursorPosition) + insertion + text.substring(cursorPosition);
  };

  const calculateReadabilityScore = (text) => {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    const score = 100 - (avgWordsPerSentence * 2);
    return Math.max(0, Math.min(100, score));
  };

  const calculateCompletenessScore = (text) => {
    const requiredSections = ['Technique', 'Findings', 'Impression'];
    const presentSections = requiredSections.filter(section => text.includes(section));
    return (presentSections.length / requiredSections.length) * 100;
  };

  const getCurrentSection = (text) => {
    const lines = text.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith('## ')) {
        return lines[i].substring(3).trim();
      }
    }
    return '';
  };

  const handleUndo = () => {
    if (currentVersion > 0) {
      setCurrentVersion(currentVersion - 1);
      setReport(versionHistory[currentVersion - 1]);
    }
  };

  const handleRedo = () => {
    if (currentVersion < versionHistory.length - 1) {
      setCurrentVersion(currentVersion + 1);
      setReport(versionHistory[currentVersion + 1]);
    }
  };

  const handleExportReport = () => {
    exportReport(report);
    alert("Report exported successfully!");
  };

  return (
    <div className="min-h-screen p-4 bg-zinc-100">
      <Head>
        <title>Enhanced Radiology Report System</title>
        <meta name="description" content="AI-powered radiology report system" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-zinc-800">
          Enhanced AI-Powered Radiology Report System
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {showSidebar && (
            <Sidebar
              templates={templates}
              setTemplate={setTemplate}
              customSections={customSections}
              onAddCustomSection={handleAddCustomSection}
            />
          )}

          <div className="flex-grow space-y-4">
            <Toolbar
              onLoadTemplate={() => handleReportChange(templates[template])}
              onToggleSidebar={() => setShowSidebar(!showSidebar)}
              onInsertMeasurement={handleInsertMeasurement}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={currentVersion > 0}
              canRedo={currentVersion < versionHistory.length - 1}
              isRealTimeAnalysis={isRealTimeAnalysis}
              onToggleRealTimeAnalysis={() => setIsRealTimeAnalysis(!isRealTimeAnalysis)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Editor
                ref={editorRef}
                value={report}
                onChange={handleReportChange}
                medicalTerms={medicalTerms}
              />
              <Preview report={report} />
            </div>

            <StatusBar
              wordCount={wordCount}
              readabilityScore={readabilityScore}
              completenessScore={completenessScore}
              activeSection={activeSection}
              isAnalyzing={isAnalyzing}
              onAnalyze={() => handleAnalyzeReport()}
              onExport={handleExportReport}
            />

            {aiSuggestions && <AISuggestions suggestions={aiSuggestions} />}
            {criticalFindings.length > 0 && <CriticalFindings findings={criticalFindings} />}
          </div>
        </div>

        <FloatingActionButton
          onSave={() => alert("Report saved successfully!")}
          onExport={handleExportReport}
          onAnalyze={() => handleAnalyzeReport()}
        />
      </main>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
