import React, { useState } from 'react';
import { ResponsiveLayout } from './components/ResponsiveLayout';

export default function App() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedTopic(null); // Reset topic when subject changes
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <ResponsiveLayout
        selectedSubject={selectedSubject}
        selectedTopic={selectedTopic}
        onSubjectSelect={handleSubjectSelect}
        onTopicSelect={handleTopicSelect}
      />
    </div>
  );
}