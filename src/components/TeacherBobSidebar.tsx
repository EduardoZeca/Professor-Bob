import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Badge } from './ui/badge';
import { ScheduleEditor } from './ScheduleEditor';
import { BookOpen, Calendar as CalendarIcon, Clock, Home, Star } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  color: string;
  topics: string[];
}

const subjects: Subject[] = [
  {
    id: 'math',
    name: 'Matemática',
    color: 'bg-blue-100 text-blue-800',
    topics: ['Adição e Subtração', 'Multiplicação', 'Divisão', 'Frações', 'Geometria']
  },
  {
    id: 'portuguese',
    name: 'Português',
    color: 'bg-pink-100 text-pink-800',
    topics: ['Leitura', 'Escrita', 'Gramática', 'Interpretação de Texto', 'Ortografia']
  },
  {
    id: 'history',
    name: 'História',
    color: 'bg-amber-100 text-amber-800',
    topics: ['História do Brasil', 'Descobrimento', 'Colonização', 'Independência', 'República']
  },
  {
    id: 'science',
    name: 'Ciências',
    color: 'bg-green-100 text-green-800',
    topics: ['Corpo Humano', 'Animais', 'Plantas', 'Meio Ambiente', 'Experimentos']
  },
  {
    id: 'geography',
    name: 'Geografia',
    color: 'bg-teal-100 text-teal-800',
    topics: ['Estados do Brasil', 'Capitais', 'Relevo', 'Clima', 'População']
  }
];

interface ClassItem {
  id: string;
  time: string;
  subject: string;
  color: string;
}

interface ScheduleDay {
  day: string;
  classes: ClassItem[];
}

const initialScheduleData: ScheduleDay[] = [
  {
    day: 'Segunda-feira',
    classes: [
      { id: '1', time: '7:30 - 8:40', subject: 'História', color: 'bg-amber-100 text-amber-800' },
      { id: '2', time: '8:45 - 9:30', subject: 'Matemática', color: 'bg-blue-100 text-blue-800' },
      { id: '3', time: '9:35 - 10:20', subject: 'Português', color: 'bg-pink-100 text-pink-800' }
    ]
  },
  {
    day: 'Terça-feira',
    classes: [
      { id: '4', time: '7:30 - 8:40', subject: 'Ciências', color: 'bg-green-100 text-green-800' },
      { id: '5', time: '8:45 - 9:30', subject: 'Geografia', color: 'bg-teal-100 text-teal-800' },
      { id: '6', time: '9:35 - 10:20', subject: 'Matemática', color: 'bg-blue-100 text-blue-800' }
    ]
  }
];

interface TeacherBobSidebarProps {
  selectedSubject: string | null;
  onSubjectSelect: (subject: string) => void;
  selectedTopic: string | null;
  onTopicSelect: (topic: string) => void;
}

export function TeacherBobSidebar({ 
  selectedSubject, 
  onSubjectSelect, 
  selectedTopic, 
  onTopicSelect 
}: TeacherBobSidebarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState<'subjects' | 'schedule'>('subjects');
  const [scheduleData, setScheduleData] = useState<ScheduleDay[]>(initialScheduleData);

  const currentSubject = subjects.find(s => s.id === selectedSubject);

  return (
    <div className="w-80 bg-gradient-to-b from-purple-50 to-blue-50 border-r border-purple-100 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-purple-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl flex items-center justify-center">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-purple-800">Teacher Bob</h1>
            <p className="text-sm text-purple-600">Seu assistente de estudos</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'subjects' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('subjects')}
            className="flex-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Matérias
          </Button>
          <Button
            variant={activeTab === 'schedule' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('schedule')}
            className="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Horário
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'subjects' ? (
          <div className="p-4 space-y-4">
            {/* Subject Selection */}
            <Card className="border-purple-100 bg-white/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-purple-700">Escolha uma matéria</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSubject || ''} onValueChange={onSubjectSelect}>
                  <SelectTrigger className="border-purple-200">
                    <SelectValue placeholder="Selecione uma matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${subject.color.split(' ')[0]}`} />
                          {subject.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Topics */}
            {currentSubject && (
              <Card className="border-purple-100 bg-white/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-purple-700">Tópicos de {currentSubject.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentSubject.topics.map((topic) => (
                      <Button
                        key={topic}
                        variant={selectedTopic === topic ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => onTopicSelect(topic)}
                        className={`w-full justify-start h-auto p-3 ${
                          selectedTopic === topic 
                            ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' 
                            : 'hover:bg-purple-50'
                        }`}
                      >
                        <div className="text-left">
                          <div className="text-sm">{topic}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calendar */}
            <Card className="border-purple-100 bg-white/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-purple-700">Calendário</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border-purple-100"
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <Card className="border-blue-100 bg-white/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Cronograma Escolar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduleData.map((day) => (
                    <div key={day.day} className="space-y-2">
                      <h4 className="text-sm font-medium text-blue-800">{day.day}</h4>
                      <div className="space-y-1">
                        {day.classes.map((classItem) => (
                          <div key={classItem.id} className="bg-white/70 rounded-lg p-2 border border-blue-100">
                            <div className="text-xs text-blue-600 mb-1">{classItem.time}</div>
                            <Badge variant="secondary" className={classItem.color}>
                              {classItem.subject}
                            </Badge>
                          </div>
                        ))}
                        {day.classes.length === 0 && (
                          <div className="text-xs text-gray-500 italic p-2">
                            Nenhuma aula cadastrada
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <ScheduleEditor 
                  schedule={scheduleData} 
                  onScheduleUpdate={setScheduleData} 
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}