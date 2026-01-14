import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Trash2, Edit3, Plus, Folder, FolderPlus, ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSystemItem, listDrafts, deleteItem, createFolder, moveItem } from '../services/agentService';

export function Memory() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Folder Creation State
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    fetchItems(currentPath);
  }, [currentPath]);

  const fetchItems = async (path: string) => {
    setLoading(true);
    try {
      const data = await listDrafts(path);
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: FileSystemItem) => {
    e.stopPropagation();
    const typeLabel = item.type === 'folder' ? 'folder and its contents' : 'memory';
    if (!confirm(`Are you sure you want to delete this ${typeLabel}?`)) return;

    try {
      const fullPath = item.path; // Already relative to drafts dir
      await deleteItem(fullPath);
      fetchItems(currentPath);
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  const handleCreateFolder = async () => {
      if (!newFolderName.trim()) return;
      try {
          const path = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
          await createFolder(path);
          setNewFolderName("");
          setShowNewFolderInput(false);
          fetchItems(currentPath);
      } catch (error) {
          console.error("Failed to create folder", error);
          alert("Failed to create folder");
      }
  };

  const handleMove = async (e: React.MouseEvent, item: FileSystemItem) => {
    e.stopPropagation();
    const newPath = prompt("Enter new path (rename or move):", item.path);
    if (!newPath || newPath === item.path) return;

    try {
        await moveItem(item.path, newPath);
        fetchItems(currentPath);
    } catch (error) {
        console.error("Failed to move item:", error);
        alert("Failed to move item. Check if destination exists or path is valid.");
    }
  };

  const navigateToFolder = (folderName: string) => {
      const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      setCurrentPath(newPath);
  };

  const navigateUp = () => {
      if (!currentPath) return;
      const parts = currentPath.split('/');
      parts.pop();
      setCurrentPath(parts.join('/'));
  };

  const navigateToBreadcrumb = (index: number) => {
      const parts = currentPath.split('/');
      const newPath = parts.slice(0, index + 1).join('/');
      setCurrentPath(newPath);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header & Toolbar */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <span className="w-2 h-8 bg-zero-primary rounded-full"/>
                Memory Core
            </h1>
            <p className="text-muted-foreground">Access your stored drafts and project history.</p>
            </div>
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setShowNewFolderInput(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zero-card border border-zero-border hover:border-zero-primary/50 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                >
                    <FolderPlus size={18} />
                    New Folder
                </button>
                <button 
                    onClick={() => navigate('/editor')}
                    className="flex items-center gap-2 px-4 py-2 bg-zero-primary text-white rounded-lg hover:bg-zero-primary/90 transition-colors"
                >
                    <Plus size={18} />
                    New Draft
                </button>
            </div>
        </div>

        {/* Breadcrumbs & Navigation */}
        <div className="flex items-center gap-2 text-sm bg-zero-card/50 p-3 rounded-lg border border-zero-border">
            <button 
                onClick={() => setCurrentPath("")}
                className={`flex items-center hover:text-zero-primary transition-colors ${!currentPath ? 'text-zero-primary font-bold' : 'text-muted-foreground'}`}
            >
                <Home size={14} />
            </button>
            {currentPath.split('/').filter(Boolean).map((part, index) => (
                <div key={index} className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-muted-foreground/50" />
                    <button 
                        onClick={() => navigateToBreadcrumb(index)}
                        className={`hover:text-zero-primary transition-colors ${index === currentPath.split('/').length - 1 ? 'text-zero-primary font-bold' : 'text-muted-foreground'}`}
                    >
                        {part}
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* New Folder Input */}
      <AnimatePresence>
        {showNewFolderInput && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
            >
                <div className="flex items-center gap-2 bg-zero-card border border-zero-primary/50 p-2 rounded-lg max-w-md">
                    <Folder size={18} className="text-zero-primary ml-2" />
                    <input 
                        autoFocus
                        type="text" 
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder Name..."
                        className="flex-1 bg-transparent focus:outline-none text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    />
                    <button onClick={handleCreateFolder} className="text-xs bg-zero-primary text-black px-2 py-1 rounded">Create</button>
                    <button onClick={() => setShowNewFolderInput(false)} className="text-xs hover:text-red-500 px-2">Cancel</button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-zero-card/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-zero-card/30 rounded-2xl border border-zero-border border-dashed">
          <Folder size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-foreground mb-2">Empty Directory</h3>
          <p className="text-muted-foreground mb-6">This folder is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Back Button if not root (Optional visual, breadcrumbs handle it mostly but good for UX) */}
            {currentPath && (
                 <div 
                    onClick={navigateUp}
                    className="flex flex-col items-center justify-center gap-2 bg-zero-card/30 hover:bg-zero-card/50 border border-zero-border border-dashed rounded-xl p-5 cursor-pointer transition-all h-40 text-muted-foreground hover:text-foreground"
                 >
                    <ArrowLeft size={24} />
                    <span className="text-sm font-mono">.. / BACK</span>
                 </div>
            )}

          {items.map((item, idx) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                  if (item.type === 'folder') {
                      navigateToFolder(item.name);
                  } else {
                      navigate(`/editor?file=${encodeURIComponent(item.path)}`);
                  }
              }}
              className={`group relative overflow-hidden rounded-xl p-5 cursor-pointer transition-all duration-300 border ${
                  item.type === 'folder' 
                  ? 'bg-zero-card/50 hover:bg-zero-card border-zero-border hover:border-zero-primary/50' 
                  : 'bg-zero-card hover:bg-zero-card/80 border-zero-border hover:border-zero-primary/50'
              }`}
            >
               {/* Icon Header */}
               <div className="flex justify-between items-start mb-4">
                   <div className={`p-3 rounded-lg ${item.type === 'folder' ? 'bg-blue-500/10 text-blue-400' : 'bg-zero-primary/10 text-zero-primary'}`}>
                       {item.type === 'folder' ? <Folder size={24} /> : <FileText size={24} />}
                   </div>
                   <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => handleMove(e, item)}
                            className="p-2 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 rounded-lg transition-colors mr-1"
                            title="Rename/Move"
                        >
                            <Edit3 size={16} />
                        </button>
                        <button 
                            onClick={(e) => handleDelete(e, item)}
                            className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                   </div>
               </div>

               {/* Content */}
               <div>
                   <h3 className="font-bold text-foreground mb-1 truncate" title={item.name}>
                       {item.name}
                   </h3>
                   <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                       <span className="flex items-center gap-1">
                           <Clock size={10} />
                           {format(item.updated_at * 1000, 'MMM d, HH:mm')}
                       </span>
                       {item.type === 'file' && (
                           <span>{Math.round(item.size / 1024 * 10) / 10} KB</span>
                       )}
                   </div>
               </div>

               {/* Preview (Files Only) */}
               {item.type === 'file' && item.preview && (
                   <div className="mt-4 pt-4 border-t border-zero-border/50">
                       <p className="text-xs text-muted-foreground line-clamp-3 font-mono leading-relaxed opacity-70">
                           {item.preview}
                       </p>
                   </div>
               )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
