import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Send, Upload, FileText, X, Bot, User } from 'lucide-react';
// import { ImageWithFallback } from './figma/ImageWithFallback';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  subject?: string;
  topic?: string;
  files?: File[];
  timestamp: Date;
}

interface ChatAreaProps {
  selectedSubject: string | null;
  selectedTopic: string | null;
}

export function ChatArea({ selectedSubject, selectedTopic }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Oi! Eu sou o Teacher Bob! 🎓 Estou aqui para te ajudar com seus estudos. Escolha uma matéria na barra lateral e me faça qualquer pergunta sobre o que você está aprendendo na escola!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    setSelectedFiles(prev => [...prev, ...pdfFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && selectedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      subject: selectedSubject || undefined,
      topic: selectedTopic || undefined,
      files: selectedFiles.length > 0 ? selectedFiles : undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSelectedFiles([]);
    setIsTyping(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/perguntar", {
        method : "POST",
        headers : {"Content-Type" : "application/json" },
        body : JSON.stringify({
          texto : inputValue,
          materia : selectedSubject,
          topico : selectedTopic
        })
      });
      if(!response.ok)
        throw new Error(`Erro do servidor: ${response.status}`)
      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.resposta,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Falha ao comunicar com o backend:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "Desculpe, não consegui me conectar com meu cérebro agora. 🧠 Verifique se o servidor está rodando e tente novamente.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsTyping(false);
    }

    
    // // Simulate AI response
    // setTimeout(() => {
    //   const assistantMessage: Message = {
    //     id: (Date.now() + 1).toString(),
    //     type: 'assistant',
    //     content: `Ótima pergunta! Vou te ajudar com ${selectedSubject ? selectedSubject : 'esse assunto'}${selectedTopic ? ` sobre ${selectedTopic}` : ''}. ${selectedFiles.length > 0 ? `Vi que você enviou ${selectedFiles.length} arquivo(s) PDF - vou analisar o conteúdo para te dar uma resposta ainda melhor!` : ''}\n\nAqui está uma explicação simples e fácil de entender...`,
    //     timestamp: new Date()
    //   };
    //   setMessages(prev => [...prev, assistantMessage]);
    //   setIsTyping(false);
    // }, 2000);
    
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-blue-50/30 to-purple-50/30">
      {/* Header */}
      <div className="p-4 border-b border-purple-100 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-purple-200">
              <AvatarImage src="https://images.unsplash.com/photo-1744451658473-cf5c564d5a37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixi" />
              <AvatarFallback className="bg-purple-100 text-purple-600">TB</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-medium text-purple-800">Teacher Bob</h2>
              <p className="text-sm text-purple-600">
                {selectedSubject && selectedTopic 
                  ? `Ajudando com ${selectedSubject} - ${selectedTopic}`
                  : selectedSubject 
                    ? `Pronto para ${selectedSubject}`
                    : 'Escolha uma matéria para começar!'
                }
              </p>
            </div>
          </div>
          {(selectedSubject || selectedTopic) && (
            <div className="flex gap-2">
              {selectedSubject && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {selectedSubject}
                </Badge>
              )}
              {selectedTopic && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {selectedTopic}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
            <Avatar className="w-8 h-8 flex-shrink-0">
              {message.type === 'assistant' ? (
                <>
                  <AvatarImage src="https://images.unsplash.com/photo-1744451658473-cf5c564d5a37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwY2FydG9vbiUyMHJvYm90JTIwdGVhY2hlciUyMG1hc2NvdHxlbnwxfHx8fDE3NTk4NDcyOTl8MA&ixlib=rb-4.1.0&q=80&w=1080" />
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </>
              ) : (
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              )}
            </Avatar>
            <Card className={`max-w-[80%] ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white border-purple-100'
            }`}>
              <div className="p-4">
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.files && message.files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white/20 rounded-lg p-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </Card>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-purple-100 text-purple-600">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <Card className="bg-white border-purple-100">
              <div className="p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-purple-100 bg-white/50 backdrop-blur-sm">
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-purple-100 rounded-lg px-3 py-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-700">{file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                  className="h-auto p-1 text-purple-600 hover:text-purple-800"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf"
            multiple
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <div className="flex-1 relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta aqui... (Pressione Enter para enviar)"
              className="min-h-[50px] max-h-32 resize-none border-purple-200 focus:border-purple-400 pr-12"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() && selectedFiles.length === 0}
              className="absolute right-2 bottom-2 h-8 w-8 p-0 bg-purple-500 hover:bg-purple-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-purple-600 mt-2 text-center">
          Teacher Bob está aqui para te ajudar com seus estudos! 📚✨
        </div>
      </div>
    </div>
  );
}