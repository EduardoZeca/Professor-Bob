import React, { useState } from 'react';
import { TeacherBobSidebar } from './TeacherBobSidebar';
import { ChatArea } from './ChatArea';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';

interface ResponsiveLayoutProps {
  selectedSubject: string | null;
  selectedTopic: string | null;
  onSubjectSelect: (subject: string) => void;
  onTopicSelect: (topic: string) => void;
}

export function ResponsiveLayout({
  selectedSubject,
  selectedTopic,
  onSubjectSelect,
  onTopicSelect
}: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/90 backdrop-blur-sm border-b border-purple-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">TB</span>
          </div>
          <h1 className="font-semibold text-purple-800">Teacher Bob</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="text-purple-600"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex min-h-screen lg:min-h-full">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <TeacherBobSidebar
            selectedSubject={selectedSubject}
            onSubjectSelect={onSubjectSelect}
            selectedTopic={selectedTopic}
            onTopicSelect={onTopicSelect}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="relative bg-white shadow-xl w-80 max-w-full">
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-purple-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <TeacherBobSidebar
                selectedSubject={selectedSubject}
                onSubjectSelect={(subject) => {
                  onSubjectSelect(subject);
                  setSidebarOpen(false);
                }}
                selectedTopic={selectedTopic}
                onTopicSelect={(topic) => {
                  onTopicSelect(topic);
                  setSidebarOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 min-h-0">
          <ChatArea
            selectedSubject={selectedSubject}
            selectedTopic={selectedTopic}
          />
        </div>
      </div>
    </>
  );
}