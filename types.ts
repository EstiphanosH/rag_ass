
export enum AgentRole {
  MAKER = 'Maker Agent',
  CHECKER = 'Checker Agent',
  SAFETY = 'Safety Monitor'
}

export enum ProcessStatus {
  IDLE = 'idle',
  VALIDATING = 'validating',
  RETRIEVING = 'retrieving',
  MAKING = 'making',
  CHECKING = 'checking',
  REFINING = 'refining',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface SafetyReport {
  passed: boolean;
  violations: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface RAGStep {
  id: string;
  role: AgentRole;
  timestamp: number;
  content: string;
  metadata?: any;
}

export interface AgenticRAGResponse {
  finalAnswer: string;
  steps: RAGStep[];
  sources: string[];
  safetyStatus: SafetyReport;
}
