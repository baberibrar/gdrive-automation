import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  FileCode,
  Presentation,
  Film,
  Music,
  Archive,
  Download,
  Loader2,
  FolderOpen,
} from "lucide-react";

function getFileIcon(file) {
  if (file.mimeType === "application/vnd.google-apps.folder") {
    return <Folder className="h-5 w-5 text-yellow-500" />;
  }

  const mime = file.mimeType || "";

  if (
    mime.includes("document") ||
    mime.includes("text") ||
    mime.includes("pdf") ||
    mime.includes("word")
  ) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  }
  if (mime.includes("presentation") || mime.includes("powerpoint")) {
    return <Presentation className="h-5 w-5 text-orange-500" />;
  }
  if (mime.includes("image")) {
    return <FileImage className="h-5 w-5 text-purple-500" />;
  }
  if (mime.includes("video")) {
    return <Film className="h-5 w-5 text-pink-500" />;
  }
  if (mime.includes("audio")) {
    return <Music className="h-5 w-5 text-indigo-500" />;
  }
  if (mime.includes("zip") || mime.includes("archive") || mime.includes("compressed")) {
    return <Archive className="h-5 w-5 text-gray-500" />;
  }
  if (mime.includes("json") || mime.includes("xml") || mime.includes("html") || mime.includes("script")) {
    return <FileCode className="h-5 w-5 text-teal-500" />;
  }

  return <File className="h-5 w-5 text-gray-400" />;
}

function getFileType(mimeType) {
  if (!mimeType) return "Unknown";

  const typeMap = {
    "application/vnd.google-apps.folder": "Folder",
    "application/vnd.google-apps.document": "Google Doc",
    "application/vnd.google-apps.spreadsheet": "Google Sheet",
    "application/vnd.google-apps.presentation": "Google Slides",
    "application/vnd.google-apps.form": "Google Form",
    "application/pdf": "PDF",
    "text/plain": "Text File",
    "text/csv": "CSV",
    "text/html": "HTML",
    "application/json": "JSON",
    "image/jpeg": "JPEG Image",
    "image/png": "PNG Image",
    "image/gif": "GIF Image",
    "video/mp4": "MP4 Video",
    "audio/mpeg": "MP3 Audio",
  };

  if (typeMap[mimeType]) return typeMap[mimeType];

  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.includes("word")) return "Word Doc";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "Spreadsheet";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "Presentation";

  return "File";
}

function formatFileSize(bytes) {
  if (!bytes) return "--";
  const size = parseInt(bytes, 10);
  if (isNaN(size)) return "--";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + " MB";
  return (size / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function formatDate(dateStr) {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FileList({ files, onFolderClick, onExtractClick, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
          <p className="text-gray-500 text-sm">Loading files...</p>
        </div>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <FolderOpen className="h-16 w-16 mb-4" />
        <p className="text-lg font-medium">No files found</p>
        <p className="text-sm mt-1">This folder is empty or no files match your search.</p>
      </div>
    );
  }

  const isFolder = (file) => file.mimeType === "application/vnd.google-apps.folder";

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Type
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Modified
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Size
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {files.map((file) => (
            <tr
              key={file.id}
              className={`hover:bg-gray-50 transition-colors ${
                isFolder(file) ? "cursor-pointer" : ""
              }`}
              onClick={() => isFolder(file) && onFolderClick(file)}
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {getFileIcon(file)}
                  <span
                    className={`text-sm truncate max-w-xs ${
                      isFolder(file)
                        ? "font-medium text-gray-900 hover:text-red-600"
                        : "text-gray-700"
                    }`}
                  >
                    {file.name}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 hidden sm:table-cell">
                <span className="text-sm text-gray-500">
                  {getFileType(file.mimeType)}
                </span>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <span className="text-sm text-gray-500">
                  {formatDate(file.modifiedTime)}
                </span>
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <span className="text-sm text-gray-500">
                  {isFolder(file) ? "--" : formatFileSize(file.size)}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                {!isFolder(file) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExtractClick(file);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Extract
                  </button>
                )}
                {isFolder(file) && (
                  <span className="text-xs text-gray-400">Open</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
