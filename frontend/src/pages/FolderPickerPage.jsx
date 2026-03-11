import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import client from "../api/client";
import {
  Folder,
  ChevronRight,
  Home,
  Loader2,
  FolderOpen,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

export default function FolderPickerPage() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuth();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [folderStack, setFolderStack] = useState([
    { id: "root", name: "My Drive" },
  ]);

  const currentFolderId = folderStack[folderStack.length - 1].id;

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.get("/api/drive/files", {
        params: { folder_id: currentFolderId },
      });
      const allFiles = response.data.files || response.data || [];
      // Only show folders
      setFolders(
        allFiles.filter(
          (f) => f.mimeType === "application/vnd.google-apps.folder"
        )
      );
    } catch (err) {
      console.error("Failed to fetch folders:", err);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  function handleFolderClick(folder) {
    setFolderStack((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }

  function handleBreadcrumbClick(index) {
    setFolderStack((prev) => prev.slice(0, index + 1));
  }

  async function handleSelectFolder() {
    const current = folderStack[folderStack.length - 1];
    if (current.id === "root") {
      alert("Please navigate into a specific folder to select it.");
      return;
    }

    try {
      setSelecting(true);
      await client.post("/api/drive/select-folder", {
        folder_id: current.id,
        folder_name: current.name,
      });
      // Refresh user data to include watched folder info
      await fetchUser();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Failed to select folder:", err);
      alert("Failed to select folder. Please try again.");
    } finally {
      setSelecting(false);
    }
  }

  const currentFolder = folderStack[folderStack.length - 1];
  const isRoot = currentFolder.id === "root";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Select a Folder to Watch
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Choose a specific Google Drive folder. Only files in this folder will
            be accessible, and you'll receive notifications when changes occur.
          </p>
        </div>

        {/* Current selection banner */}
        {user?.watched_folder_name && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                Currently watching:{" "}
                <span className="font-bold">{user.watched_folder_name}</span>
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                You can select a different folder below.
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-green-700 hover:text-green-900 font-medium cursor-pointer"
            >
              Skip
            </button>
          </div>
        )}

        {/* Breadcrumb Navigation */}
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

        {/* Select this folder button */}
        {!isRoot && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Folder className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  {currentFolder.name}
                </p>
                <p className="text-xs text-blue-600">
                  Select this folder to start watching for changes
                </p>
              </div>
            </div>
            <button
              onClick={handleSelectFolder}
              disabled={selecting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {selecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Select This Folder
                </>
              )}
            </button>
          </div>
        )}

        {/* Folders list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
                <p className="text-gray-500 text-sm">Loading folders...</p>
              </div>
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FolderOpen className="h-14 w-14 mb-3" />
              <p className="text-base font-medium">No subfolders here</p>
              <p className="text-sm mt-1">
                {isRoot
                  ? "No folders found in your Drive."
                  : "This folder has no subfolders. You can select it using the button above."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderClick(folder)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                >
                  <Folder className="h-5 w-5 text-yellow-500 shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate flex-1">
                    {folder.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Back button */}
        {folderStack.length > 1 && (
          <button
            onClick={() => handleBreadcrumbClick(folderStack.length - 2)}
            className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        )}
      </main>
    </div>
  );
}
