import React, { useState } from 'react';
import { Search, GraduationCap, ClipboardList, Upload, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Result {
  id: number;
  registration_number: string;
  student_name: string;
  class: string;
  batch: string;
  subject: string;
  marks: number;
  grade: string;
  exam_date: string;
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [reg, setReg] = useState('');
  const [className, setClassName] = useState('');
  const [batch, setBatch] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadStatus, setUploadStatus] = useState<{ success?: boolean; message?: string }>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch(`/api/results?reg=${reg}&className=${className}&batch=${batch}`);
      const data = await res.json();
      if (data.length === 0) {
        setError('No results found for the provided details.');
      } else {
        setResults(data);
      }
    } catch (err) {
      setError('Failed to fetch results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadStatus({ success: true, message: `Successfully uploaded ${data.count} records.` });
      } else {
        setUploadStatus({ success: false, message: data.error || 'Upload failed.' });
      }
    } catch (err) {
      setUploadStatus({ success: false, message: 'Upload failed.' });
    } finally {
      setLoading(false);
    }
  };

  const clearData = async () => {
    if (!confirm('Are you sure you want to clear all data?')) return;
    try {
      await fetch('/api/clear', { method: 'POST' });
      alert('All data cleared.');
    } catch (err) {
      alert('Failed to clear data.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-slate-900 leading-none">Ronju English care</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Excellence in Learning</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            {isAdmin ? 'Student Portal' : 'Admin Login'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {isAdmin ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Upload className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <h3 className="font-semibold mb-2">Upload Result Excel</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Upload an Excel file with columns: registration_number, student_name, class, batch, subject, marks, grade, exam_date
                    </p>
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>

                  {uploadStatus.message && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 ${uploadStatus.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {uploadStatus.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <span className="text-sm font-medium">{uploadStatus.message}</span>
                    </div>
                  )}

                  <div className="pt-6 border-top border-slate-100">
                    <button 
                      onClick={clearData}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Database Records
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="student"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero Section */}
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">Check Your Exam Results</h2>
                <p className="text-slate-600">Enter your details below to view your performance and grades for the recent examinations.</p>
              </div>

              {/* Search Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Registration No.</label>
                    <input 
                      required
                      type="text" 
                      value={reg}
                      onChange={(e) => setReg(e.target.value)}
                      placeholder="e.g. 2024001"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Class</label>
                    <select 
                      required
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                    >
                      <option value="">Select Class</option>
                      <option value="4">Class 4</option>
                      <option value="5">Class 5</option>
                      <option value="6">Class 6</option>
                      <option value="7">Class 7</option>
                      <option value="8">Class 8</option>
                      <option value="9">Class 9</option>
                      <option value="10">Class 10</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Batch</label>
                    <select 
                      required
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                    >
                      <option value="">Select Batch</option>
                      <option value="A">Batch A</option>
                      <option value="B">Batch B</option>
                      <option value="C">Batch C</option>
                      <option value="D">Batch D</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 pt-2">
                    <button 
                      disabled={loading}
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                      {loading ? 'Searching...' : 'Search Result'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Results Display */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-3xl mx-auto p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">{error}</p>
                  </motion.div>
                )}

                {results.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mx-auto space-y-6"
                  >
                    {/* Congratulations Message */}
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-block bg-emerald-50 border border-emerald-100 px-8 py-3 rounded-2xl"
                      >
                        <p className="text-emerald-700 font-bold flex items-center gap-3">
                          <span className="text-2xl">🎉</span> Congratulations! You have passed the exam.
                        </p>
                      </motion.div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                      <div className="bg-indigo-600 px-8 py-6 text-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Student Name</p>
                            <h3 className="text-2xl font-bijoy font-bold">{results[0].student_name}</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Registration</p>
                            <p className="text-xl font-mono font-bold">{results[0].registration_number}</p>
                          </div>
                        </div>
                        <div className="flex gap-6 mt-6 pt-6 border-t border-indigo-500/30">
                          <div>
                            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Class</p>
                            <p className="font-bold">{results[0].class}</p>
                          </div>
                          <div>
                            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Batch</p>
                            <p className="font-bold">{results[0].batch}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-8">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left border-b border-slate-100">
                              <th className="pb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Subject</th>
                              <th className="pb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Marks</th>
                              <th className="pb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Exam</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {results.map((res) => (
                              <tr key={res.id} className="group">
                                <td className="py-4 font-medium text-slate-900">{res.subject}</td>
                                <td className="py-4 font-mono text-slate-600">{res.marks}</td>
                                <td className="py-4 text-sm text-slate-500">{res.exam_date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => window.print()}
                      className="w-full py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Download / Print Result
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} Ronju English care. All rights reserved.</p>
          <p className="text-slate-300 text-[10px] mt-2 uppercase tracking-widest font-bold">Empowering Students for a Brighter Future</p>
        </div>
      </footer>
    </div>
  );
}
