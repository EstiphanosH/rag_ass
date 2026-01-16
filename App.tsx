
import React, { useState, useRef, useEffect } from 'react';
import { AgenticRAGService } from './services/gemini';
import { AgentRole, ProcessStatus, RAGStep, SafetyReport } from './types';
import { ICONS, MOCK_DATABASE } from './constants';
import StepCard from './components/StepCard';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [steps, setSteps] = useState<RAGStep[]>([]);
  const [activeFile, setActiveFile] = useState('main.py');
  const [finalResponse, setFinalResponse] = useState<string | null>(null);
  
  const ragService = useRef(new AgenticRAGService());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  const addStep = (role: AgentRole, content: string, metadata?: any) => {
    const newStep: RAGStep = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      timestamp: Date.now(),
      content,
      metadata
    };
    setSteps(prev => [...prev, newStep]);
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSteps([]);
    setFinalResponse(null);
    setStatus(ProcessStatus.VALIDATING);

    try {
      addStep(AgentRole.SAFETY, `[Python] safety.validate_input("${query}")`);
      const safety = await ragService.current.validateInput(query);
      
      if (!safety.passed) {
        addStep(AgentRole.SAFETY, `CRITICAL: Input Validation Failed. Terminating process.`, { violations: safety.violations.join(', ') });
        setStatus(ProcessStatus.FAILED);
        return;
      }

      setStatus(ProcessStatus.RETRIEVING);
      addStep(AgentRole.MAKER, `[Python] rag_engine.retrieve(query="${query}")`);
      const docIds = await ragService.current.retrieveDocuments(query);
      const retrievedContext = MOCK_DATABASE
        .filter(d => docIds.includes(d.id))
        .map(d => `${d.title}: ${d.content}`)
        .join('\n');
      
      setStatus(ProcessStatus.MAKING);
      addStep(AgentRole.MAKER, `[Python] rag_engine.maker_generate(context_len=${retrievedContext.length})`);
      let makerOutput = await ragService.current.makerGenerate(query, retrievedContext);
      addStep(AgentRole.MAKER, makerOutput);

      setStatus(ProcessStatus.CHECKING);
      addStep(AgentRole.CHECKER, `[Python] checker.audit(output_v1)`);
      const audit = await ragService.current.checkerAudit(makerOutput, query, retrievedContext);
      
      if (!audit.isGood) {
        addStep(AgentRole.CHECKER, `Audit Failed: ${audit.feedback}. Refining...`);
        setStatus(ProcessStatus.REFINING);
        makerOutput = await ragService.current.makerGenerate(query, `${retrievedContext}\n\nFEEDBACK: ${audit.feedback}`);
        addStep(AgentRole.MAKER, `[Python] Refined Output:\n${makerOutput}`);
      }

      setStatus(ProcessStatus.COMPLETED);
      const filtered = await ragService.current.outputFilter(makerOutput);
      setFinalResponse(filtered);

    } catch (err) {
      setStatus(ProcessStatus.FAILED);
      addStep(AgentRole.SAFETY, `RUNTIME_ERROR: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const isProcessing = status !== ProcessStatus.IDLE && status !== ProcessStatus.COMPLETED && status !== ProcessStatus.FAILED;

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#c9d1d9] font-sans">
      {/* Top Navbar */}
      <nav className="h-12 border-b border-[#30363d] flex items-center px-4 justify-between bg-[#161b22]">
        <div className="flex items-center gap-4">
          <i className="fa-brands fa-python text-[#3776ab] text-xl"></i>
          <span className="text-sm font-semibold tracking-wide">AgenticRAG-Workbench-v3</span>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-3 py-1 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold rounded cursor-pointer transition-colors" onClick={handleRun}>
             <i className="fa-solid fa-play mr-2"></i> Run Pipeline
           </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <aside className="w-64 border-r border-[#30363d] bg-[#0d1117] flex flex-col">
          <div className="p-3 text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">Explorer</div>
          <div className="flex flex-col">
            {[
              { name: 'main.py', icon: 'fa-brands fa-python text-[#3776ab]' },
              { name: 'safety.py', icon: 'fa-brands fa-python text-[#3776ab]' },
              { name: 'rag_engine.py', icon: 'fa-brands fa-python text-[#3776ab]' },
              { name: 'README.md', icon: 'fa-solid fa-circle-info text-[#58a6ff]' },
              { name: 'requirements.txt', icon: 'fa-solid fa-list-check text-[#8b949e]' },
            ].map(file => (
              <div 
                key={file.name} 
                onClick={() => setActiveFile(file.name)}
                className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-[#21262d] ${activeFile === file.name ? 'bg-[#21262d] border-l-2 border-[#f78166]' : ''}`}
              >
                <i className={`${file.icon} text-xs`}></i>
                <span>{file.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Code Editor (Visual Only) */}
        <section className="flex-1 flex flex-col border-r border-[#30363d]">
          <div className="h-9 bg-[#161b22] border-b border-[#30363d] flex items-center px-4">
            <span className="text-xs text-[#8b949e] italic">{activeFile}</span>
          </div>
          <div className="flex-1 p-6 font-mono text-sm overflow-y-auto bg-[#0d1117]">
            {activeFile === 'main.py' ? (
              <pre className="text-blue-300">
{`import google.generativeai as genai

# Meta System Prompt for Agentic Safety
META_PROMPT = """
ROLE: Senior AI Orchestrator
GOAL: Grounded Generation
"""

class Orchestrator:
    def __init__(self):
        self.safety = SafetyMonitor()
        self.rag = RAGManager()

    async def run(self, query):
        if await self.safety.check(query):
            context = await self.rag.fetch(query)
            return await self.rag.generate(context)`}
              </pre>
            ) : (
              <div className="text-slate-500 italic">File content previewed in README/Documentation...</div>
            )}
          </div>
          
          {/* Query Input */}
          <div className="p-4 bg-[#161b22] border-t border-[#30363d]">
            <form onSubmit={handleRun} className="flex gap-2">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter query for the Agentic Pipeline..."
                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-4 py-2 text-sm focus:outline-none focus:border-[#58a6ff]"
              />
              <button disabled={isProcessing} className="bg-[#21262d] border border-[#30363d] px-4 py-2 rounded text-sm hover:bg-[#30363d]">
                Execute
              </button>
            </form>
          </div>
        </section>

        {/* Trace / Terminal */}
        <section className="w-[450px] flex flex-col bg-[#0d1117]">
          <div className="h-9 bg-[#161b22] border-b border-[#30363d] flex items-center px-4 justify-between">
            <span className="text-xs font-bold text-[#8b949e] uppercase">Agentic Trace</span>
            <span className="text-[10px] text-emerald-500 font-mono">{status.toUpperCase()}</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {steps.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 italic text-sm">
                No active process...
              </div>
            )}
            {steps.map((step, idx) => (
              <StepCard key={step.id} step={step} isLast={idx === steps.length - 1} />
            ))}

            {finalResponse && (
              <div className="p-4 rounded border border-[#238636] bg-[#238636]/10 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold mb-2">
                  <i className="fa-solid fa-square-check"></i> PIPELINE_SUCCESS
                </div>
                <div className="text-sm leading-relaxed text-[#f0f6fc]">
                  {finalResponse}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
