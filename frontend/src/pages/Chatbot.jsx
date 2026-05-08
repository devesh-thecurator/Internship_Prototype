import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ChatbotPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    api.get('/chatbot/history/').then((response) => setHistory(response.data));
  }, []);

  const sendQuery = async (event) => {
    event.preventDefault();
    if (!query) return;
    const currentQuery = query;
    setMessages((prev) => [...prev, { type: 'user', text: currentQuery }]);
    setQuery('');
    setTyping(true);
    const response = await api.post('/chatbot/query/', { query: currentQuery });
    setMessages((prev) => [...prev, { type: 'bot', text: response.data.answer }]);
    setHistory((prev) => [{ id: response.data.chat_id, query: currentQuery, created_at: new Date().toISOString() }, ...prev]);
    setTyping(false);
  };

  const prompts = [
    'Which clauses are missing?',
    'Summarize risk and compliance status.',
    'What should be fixed before approval?',
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">AI Chatbot</h3>
        <p className="mt-2 text-slate-500">Ask questions about uploaded documents, validation errors, and suggested corrections.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="col-span-2 rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setQuery(prompt)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-blue-300 hover:bg-blue-50"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 ${item.type === 'bot' ? 'bg-slate-100 text-slate-900' : 'bg-blue-50 text-slate-900'}`}
              >
                <p className="text-sm font-semibold uppercase text-slate-500">{item.type}</p>
                <p className="mt-2 text-slate-700">{item.text}</p>
              </div>
            ))}
            {typing && (
              <div className="rounded-lg bg-slate-100 p-4 text-sm text-slate-500">
                AI is reviewing retrieved document context...
              </div>
            )}
          </div>
          <form className="mt-6 flex gap-3" onSubmit={sendQuery}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask the AI about validation findings..."
              className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-primary focus:ring-2 focus:ring-blue-200"
            />
            <button className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
              Send
            </button>
          </form>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-900">Recent chat history</h4>
          <div className="mt-4 space-y-3">
            {history.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{item.query}</p>
                <p className="mt-2 text-sm text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
