import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import FileList from "../components/FileList";
import client from "../api/client";
import {
  Search,
  ChevronRight,
  Home,
  RefreshCw,
  X,
  FolderOpen,
  ArrowRight,
  Eye,
} from "lucide-react";

export default function DriveBrowserPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const watchedFolderId = user?.watched_folder_id;
  const watchedFolderName = user?.watched_folder_name || "Watched Folder";

  const [folderStack, setFolderStack] = useState([
    { id: watchedFolderId || "root", name: watchedFolderName },
  ]);

  // Reset folder stack when watched folder changes
  useEffect(() => {
    if (watchedFolderId) {
      setFolderStack([{ id: watchedFolderId, name: watchedFolderName }]);
    }
  }, [watchedFolderId, watchedFolderName]);

  const currentFolderId = folderStack[folderStack.length - 1].id;

  const fetchFiles = useCallback(async () => {
    if (!watchedFolderId) return;
    try {
      setLoading(true);
      const params = {};

      if (searchQuery) {
        params.query = searchQuery;
        // Still scope search to watched folder
        params.folder_id = watchedFolderId;
      } else {
        params.folder_id = currentFolderId;
      }

      const response = await client.get("/api/drive/files", { params });
      setFiles(response.data.files || response.data || []);
    } catch (err) {
      console.error("Failed to fetch files:", err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, searchQuery, watchedFolderId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  function handleFolderClick(folder) {
    setSearchQuery("");
    setSearchInput("");
    setFolderStack((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }

  function handleBreadcrumbClick(index) {
    setSearchQuery("");
    setSearchInput("");
    setFolderStack((prev) => prev.slice(0, index + 1));
  }

  function handleExtractClick(file) {
    navigate(`/extraction/${file.id}`, {
      state: { fileName: file.name, mimeType: file.mimeType },
    });
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setSearchQuery("");
  }

  // If no folder is selected, show a prompt to select one
  if (!watchedFolderId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No folder selected
            </h2>
            <p className="text-gray-500 text-sm mb-6 text-center max-w-md">
              You need to select a Google Drive folder first. Only files in the
              selected folder will be accessible.
            </p>
            <Link
              to="/select-folder"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Select a Folder
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Google Drive</h1>
            <div className="flex items-center gap-2 mt-1">
              <Eye className="h-4 w-4 text-green-500" />
              <p className="text-gray-500 text-sm">
                Browsing: <span className="font-medium text-gray-700">{watchedFolderName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={fetchFiles}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer self-start"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search files and folders..."
              className="w-full pl-12 pr-24 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {(searchInput || searchQuery) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Breadcrumb Navigation */}
        {!searchQuery && (
          <nav className="flex items-center gap-1 mb-4 flex-wrap">
            {folderStack.map((folder, index) => (
              <div key={folder.id + index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                )}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm transition-colors cursor-pointer ${
                    index === folderStack.length - 1
                      ? "font-medium text-gray-900 bg-gray-100"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {index === 0 && <Home className="h-3.5 w-3.5" />}
                  {folder.name}
                </button>
              </div>
            ))}
          </nav>
        )}

        {/* Search indicator */}
        {searchQuery && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Search results for:
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-full">
              &ldquo;{searchQuery}&rdquo;
              <button
                onClick={clearSearch}
                className="ml-1 hover:text-red-900 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        )}

        {/* File List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <FileList
            files={files}
            onFolderClick={handleFolderClick}
            onExtractClick={handleExtractClick}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}
