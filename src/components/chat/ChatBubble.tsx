import React from 'react';
import { Bot, Copy, Check } from 'lucide-react';
import type { Message } from '../../types';
import { Avatar } from '../ui/Avatar';
import { useApp } from '../../context/AppContext';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const { user } = useApp();
  const [copied, setCopied] = React.useState(false);
  const isAi = message.sender === 'ai';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple paragraph & lists parser for formatted responses
  const renderMessageContent = (text: string) => {
    return text.split('\n\n').map((paragraph, pIdx) => {
      // Check if paragraph is a list
      if (paragraph.startsWith('- ') || paragraph.startsWith('* ') || paragraph.match(/^\d+\.\s/)) {
        const items = paragraph.split('\n');
        return (
          <ul key={pIdx} className="list-disc pl-5 space-y-1.5 my-3 text-slate-700 dark:text-slate-200">
            {items.map((item, iIdx) => {
              const cleanedItem = item.replace(/^[-*\d.]+\s+/, '');
              return (
                <li key={iIdx} className="text-sm">
                  {renderTextWithBold(cleanedItem)}
                </li>
              );
            })}
          </ul>
        );
      }

      // Check if equation block
      if (paragraph.startsWith('$$') && paragraph.endsWith('$$')) {
        const formula = paragraph.replace(/\$\$/g, '');
        return (
          <div key={pIdx} className="my-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl font-mono text-xs overflow-x-auto text-indigo-650 dark:text-indigo-400 text-center">
            {formula}
          </div>
        );
      }

      return (
        <p key={pIdx} className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 mb-2 last:mb-0">
          {renderTextWithBold(paragraph)}
        </p>
      );
    });
  };

  const renderTextWithBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      // Check for inline math/code
      const codeParts = part.split(/(`.*?`|\$.*?\$)/g);
      return codeParts.map((subPart, subIndex) => {
        if (subPart.startsWith('`') && subPart.endsWith('`')) {
          return (
            <code key={subIndex} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded font-mono text-xs text-indigo-650 dark:text-indigo-400">
              {subPart.slice(1, -1)}
            </code>
          );
        }
        if (subPart.startsWith('$') && subPart.endsWith('$')) {
          return (
            <code key={subIndex} className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 font-mono text-xs text-indigo-650 dark:text-indigo-400">
              {subPart.slice(1, -1)}
            </code>
          );
        }
        return subPart;
      });
    });
  };

  return (
    <div className={`flex w-full space-x-4 p-5 rounded-2xl transition-colors duration-200 ${
      isAi ? 'bg-slate-50/50 dark:bg-slate-900/30' : 'bg-white dark:bg-slate-950'
    }`}>
      {/* Avatar column */}
      <div className="shrink-0">
        {isAi ? (
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
            <Bot className="h-5 w-5" />
          </div>
        ) : (
          <Avatar name={user?.name || 'User'} size="md" />
        )}
      </div>

      {/* Bubble details */}
      <div className="flex-1 space-y-1.5 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            {isAi ? 'ScholarAI Assistant' : user?.name || 'You'}
          </span>
          <span className="text-[10px] text-slate-400">
            {message.timestamp}
          </span>
        </div>

        {/* Text Area */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {renderMessageContent(message.text)}
        </div>

        {/* Action utilities */}
        <div className="flex items-center space-x-2 pt-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-md transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatBubble;
