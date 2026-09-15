'use client';

import React from 'react';
import { Plus, Clipboard, Database, FileCode, Server, Braces } from 'lucide-react';

interface TemplateOption {
  title: string;
  filename: string;
  language: string;
  icon: React.ReactNode;
  description: string;
  code: string;
}

const STARTER_TEMPLATES: TemplateOption[] = [
  {
    title: 'Nacos Spring Cloud Config',
    filename: 'application-prod.yml',
    language: 'yaml',
    icon: <Server className="w-5 h-5 text-emerald-400" />,
    description: 'Spring Cloud data source, redis cache & thread pool config',
    code: `spring:
  application:
    name: order-service
  datasource:
    url: jdbc:mysql://10.0.0.12:3306/order_db?useSSL=false
    username: root
    password: "\${DB_PASSWORD}"
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
server:
  port: 8080
logging:
  level:
    com.example: INFO
`,
  },
  {
    title: 'MySQL Schema Migration',
    filename: 'V1__init_orders_schema.sql',
    language: 'sql',
    icon: <Database className="w-5 h-5 text-sky-400" />,
    description: 'Relational table DDL with indexes, foreign keys & audit columns',
    code: `CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,
  },
  {
    title: 'Docker Compose Stack',
    filename: 'docker-compose.yml',
    language: 'yaml',
    icon: <FileCode className="w-5 h-5 text-purple-400" />,
    description: 'Multi-container orchestration setup with volume mounts & networks',
    code: `version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    restart: unless-stopped
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

volumes:
  redis-data:
`,
  },
  {
    title: 'API Payload / JSON Schema',
    filename: 'api-spec.json',
    language: 'json',
    icon: <Braces className="w-5 h-5 text-amber-400" />,
    description: 'Structured RESTful API JSON payload with types and validations',
    code: `{
  "apiVersion": "v1.2",
  "data": {
    "requestId": "req-9842a-71b",
    "status": "active",
    "timeoutMs": 5000,
    "retryPolicy": {
      "maxAttempts": 3,
      "backoffMultiplier": 1.5
    }
  }
}
`,
  },
];

interface WorkspaceEmptyStateProps {
  onNewDocument: () => void;
  onApplyTemplate: (template: { title: string; filename: string; language: string; code: string }) => void;
  onPasteFromClipboard: () => void;
}

export const WorkspaceEmptyState: React.FC<WorkspaceEmptyStateProps> = ({
  onNewDocument,
  onApplyTemplate,
  onPasteFromClipboard,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto text-center">
      <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-200">
        {/* Header Hero */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-brand-primary text-xs font-medium">
            Versioned Developer Workbench
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 tracking-tight">
            No document selected
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Create a blank document, paste from your clipboard, or start from a configuration template to track changes and diff revisions.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onNewDocument}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-brand-text text-xs font-semibold shadow-md shadow-sky-500/20 hover:brightness-110 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </button>

          <button
            type="button"
            onClick={onPasteFromClipboard}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-canvas-elevated border border-canvas-border hover:border-canvas-highlight text-slate-200 text-xs font-medium transition-all active:scale-95"
          >
            <Clipboard className="w-4 h-4 text-slate-400" />
            <span>Paste from Clipboard</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-2">
          <div className="h-px flex-1 bg-canvas-border" />
          <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Or start with a template</span>
          <div className="h-px flex-1 bg-canvas-border" />
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {STARTER_TEMPLATES.map((tpl) => (
            <div
              key={tpl.title}
              onClick={() => onApplyTemplate(tpl)}
              className="group p-3.5 rounded-xl bg-canvas-surface/80 border border-canvas-border hover:border-brand-primary/50 hover:bg-canvas-surface cursor-pointer transition-all active:scale-[0.99] shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {tpl.icon}
                    <span className="font-semibold text-xs text-slate-200 group-hover:text-brand-primary transition-colors">
                      {tpl.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-canvas-elevated text-slate-400">
                    {tpl.language}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-canvas-border/50 text-[10px] font-mono text-slate-500 truncate">
                {tpl.filename}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
