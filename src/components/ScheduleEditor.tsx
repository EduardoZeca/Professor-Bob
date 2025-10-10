import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Trash2, Plus, Edit3, Save, X } from 'lucide-react';

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

interface ScheduleEditorProps {
  schedule: ScheduleDay[];
  onScheduleUpdate: (newSchedule: ScheduleDay[]) => void;
}

const subjects = [
  { name: 'Matemática', color: 'bg-blue-100 text-blue-800' },
  { name: 'Português', color: 'bg-pink-100 text-pink-800' },
  { name: 'História', color: 'bg-amber-100 text-amber-800' },
  { name: 'Ciências', color: 'bg-green-100 text-green-800' },
  { name: 'Geografia', color: 'bg-teal-100 text-teal-800' },
  { name: 'Educação Física', color: 'bg-orange-100 text-orange-800' },
  { name: 'Artes', color: 'bg-purple-100 text-purple-800' },
  { name: 'Inglês', color: 'bg-indigo-100 text-indigo-800' },
  { name: 'Recreio', color: 'bg-gray-100 text-gray-800' }
];

const daysOfWeek = [
  'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'
];

export function ScheduleEditor({ schedule, onScheduleUpdate }: ScheduleEditorProps) {
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [newClass, setNewClass] = useState<Partial<ClassItem>>({});
  const [isAddingClass, setIsAddingClass] = useState<string | null>(null);

  const getSubjectColor = (subjectName: string) => {
    const subject = subjects.find(s => s.name === subjectName);
    return subject?.color || 'bg-gray-100 text-gray-800';
  };

  const addNewClass = (dayName: string) => {
    if (!newClass.time || !newClass.subject) return;

    const updatedSchedule = schedule.map(day => {
      if (day.day === dayName) {
        const newClassItem: ClassItem = {
          id: Date.now().toString(),
          time: newClass.time!,
          subject: newClass.subject!,
          color: getSubjectColor(newClass.subject!)
        };
        return {
          ...day,
          classes: [...day.classes, newClassItem].sort((a, b) => a.time.localeCompare(b.time))
        };
      }
      return day;
    });

    onScheduleUpdate(updatedSchedule);
    setNewClass({});
    setIsAddingClass(null);
  };

  const editClass = (dayName: string, classId: string, updatedClass: Partial<ClassItem>) => {
    const updatedSchedule = schedule.map(day => {
      if (day.day === dayName) {
        return {
          ...day,
          classes: day.classes.map(classItem => {
            if (classItem.id === classId) {
              const subject = updatedClass.subject || classItem.subject;
              return {
                ...classItem,
                ...updatedClass,
                color: getSubjectColor(subject)
              };
            }
            return classItem;
          }).sort((a, b) => a.time.localeCompare(b.time))
        };
      }
      return day;
    });

    onScheduleUpdate(updatedSchedule);
    setEditingClass(null);
  };

  const removeClass = (dayName: string, classId: string) => {
    const updatedSchedule = schedule.map(day => {
      if (day.day === dayName) {
        return {
          ...day,
          classes: day.classes.filter(classItem => classItem.id !== classId)
        };
      }
      return day;
    });

    onScheduleUpdate(updatedSchedule);
  };

  const addNewDay = (dayName: string) => {
    const dayExists = schedule.find(day => day.day === dayName);
    if (!dayExists) {
      const newSchedule = [...schedule, { day: dayName, classes: [] }];
      onScheduleUpdate(newSchedule);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4 border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Editar Cronograma
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-800 flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Editar Cronograma Escolar
          </DialogTitle>
          <DialogDescription className="text-blue-600">
            Aqui você pode editar seu cronograma escolar, adicionar novas aulas, modificar horários e organizar suas matérias.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add missing days */}
          <div className="space-y-2">
            <h4 className="font-medium text-blue-700">Adicionar dias da semana:</h4>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => {
                const exists = schedule.find(scheduleDay => scheduleDay.day === day);
                if (!exists) {
                  return (
                    <Button
                      key={day}
                      variant="outline"
                      size="sm"
                      onClick={() => addNewDay(day)}
                      className="border-green-200 text-green-600 hover:bg-green-50"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {day}
                    </Button>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Edit existing schedule */}
          {schedule.map((day) => (
            <Card key={day.day} className="border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-blue-800">{day.day}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingClass(day.day)}
                    className="border-green-200 text-green-600 hover:bg-green-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Aula
                  </Button>
                </div>

                {/* Add new class form */}
                {isAddingClass === day.day && (
                  <Card className="mb-4 border-green-200 bg-green-50">
                    <CardContent className="p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="new-time" className="text-sm">Horário</Label>
                          <Input
                            id="new-time"
                            placeholder="ex: 7:30 - 8:40"
                            value={newClass.time || ''}
                            onChange={(e) => setNewClass(prev => ({ ...prev, time: e.target.value }))}
                            className="border-green-200"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-subject" className="text-sm">Matéria</Label>
                          <Select value={newClass.subject || ''} onValueChange={(value) => setNewClass(prev => ({ ...prev, subject: value }))}>
                            <SelectTrigger className="border-green-200">
                              <SelectValue placeholder="Selecione uma matéria" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject.name} value={subject.name}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${subject.color.split(' ')[0]}`} />
                                    {subject.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end gap-2">
                          <Button
                            onClick={() => addNewClass(day.day)}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsAddingClass(null);
                              setNewClass({});
                            }}
                            className="border-gray-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Existing classes */}
                <div className="space-y-2">
                  {day.classes.map((classItem) => (
                    <div key={classItem.id}>
                      {editingClass?.id === classItem.id ? (
                        <Card className="border-blue-200 bg-blue-50">
                          <CardContent className="p-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label htmlFor={`edit-time-${classItem.id}`} className="text-sm">Horário</Label>
                                <Input
                                  id={`edit-time-${classItem.id}`}
                                  value={editingClass.time}
                                  onChange={(e) => setEditingClass(prev => ({ ...prev!, time: e.target.value }))}
                                  className="border-blue-200"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`edit-subject-${classItem.id}`} className="text-sm">Matéria</Label>
                                <Select 
                                  value={editingClass.subject} 
                                  onValueChange={(value) => setEditingClass(prev => ({ ...prev!, subject: value }))}
                                >
                                  <SelectTrigger className="border-blue-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {subjects.map((subject) => (
                                      <SelectItem key={subject.name} value={subject.name}>
                                        <div className="flex items-center gap-2">
                                          <div className={`w-3 h-3 rounded-full ${subject.color.split(' ')[0]}`} />
                                          {subject.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-end gap-2">
                                <Button
                                  onClick={() => editClass(day.day, classItem.id, editingClass)}
                                  size="sm"
                                  className="bg-blue-500 hover:bg-blue-600"
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Salvar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingClass(null)}
                                  className="border-gray-300"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="bg-white/70 rounded-lg p-3 border border-blue-100 flex items-center justify-between">
                          <div>
                            <div className="text-sm text-blue-600 mb-1">{classItem.time}</div>
                            <Badge variant="secondary" className={classItem.color}>
                              {classItem.subject}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingClass(classItem)}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeClass(day.day, classItem.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {day.classes.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <p className="text-sm">Nenhuma aula cadastrada para {day.day}</p>
                      <p className="text-xs mt-1">Clique em "Adicionar Aula" para começar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}