import React, { useState, useEffect, useRef } from "react";
import {
  getBookmarks,
  removeBookmark,
  createBookmarkFolder,
  moveBookmarkToFolder,
  deleteBookmarkFolder,
} from "../utils/bookmarks";
import {
  Bookmark,
  Folder,
  Trash2,
  ChevronDown,
  Search,
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
  FolderPlus,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import Input from "../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../components/ui/DropdownMenu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/Dialog";
import ExportButton from "../components/ExportButton";
import { useToast } from "../components/ui/toast";

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showAddFolderDialog, setShowAddFolderDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { addToast } = useToast();

  // Create refs to store timeout IDs for cleanup
  const dropdownTimeoutRef = useRef(null);

  useEffect(() => {
    // Load bookmarks
    const savedBookmarks = getBookmarks();
    setBookmarks(savedBookmarks);

    // Load folders
    const foldersJson = localStorage.getItem("Social Shield_bookmark_folders");
    const savedFolders = foldersJson ? JSON.parse(foldersJson) : [];
    setFolders(savedFolders);

    // Clean up any pending timeouts on unmount
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const handleRemoveBookmark = (id) => {
    removeBookmark(id);
    setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id));
    addToast("Bookmark removed", "info");
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      // Check if folder name already exists
      if (folders.includes(newFolderName.trim())) {
        addToast(`Folder "${newFolderName}" already exists`, "error");
        return;
      }

      const updatedFolders = createBookmarkFolder(newFolderName);
      setFolders(updatedFolders);
      addToast(`Folder "${newFolderName}" created`, "success");

      // Clear input and close dialog
      setNewFolderName("");
      setShowAddFolderDialog(false);

      // Close dropdown and reopen it after a short delay to refresh its state
      setDropdownOpen(false);
      dropdownTimeoutRef.current = setTimeout(() => {
        setDropdownOpen(true);
      }, 100);
    }
  };

  const handleMoveToFolder = (bookmarkId, folderName) => {
    const updatedBookmarks = moveBookmarkToFolder(bookmarkId, folderName);
    setBookmarks(updatedBookmarks);
    addToast(`Bookmark moved to "${folderName}" folder`, "bookmark");
  };

  const openDeleteDialog = (folderName) => {
    // Close dropdown to prevent it from getting stuck
    setDropdownOpen(false);

    setFolderToDelete(folderName);
    setShowDeleteDialog(true);
  };

  const handleDeleteFolder = () => {
    if (!folderToDelete) return;

    const updatedFolders = deleteBookmarkFolder(folderToDelete);
    setFolders(updatedFolders);

    // Reset to All view if the active folder was deleted
    if (activeFolder === folderToDelete) {
      setActiveFolder("All");
    }

    // Reload bookmarks to reflect the changes
    const updatedBookmarks = getBookmarks();
    setBookmarks(updatedBookmarks);

    addToast(
      `Folder "${folderToDelete}" deleted. Bookmarks moved to unsorted items.`,
      "info"
    );

    // Close dialog and reset state
    setShowDeleteDialog(false);
    setFolderToDelete(null);
  };

  // Ensure dropdown state is properly reset when dialogs are closed
  useEffect(() => {
    if (!showAddFolderDialog && !showDeleteDialog) {
      // Reset dropdown state when dialogs close
      dropdownTimeoutRef.current = setTimeout(() => {
        // This will ensure the dropdown can be reopened properly
        setDropdownOpen(false);
      }, 100);
    }
  }, [showAddFolderDialog, showDeleteDialog]);

  // Filter bookmarks by folder and search term
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesFolder =
      activeFolder === "All" || bookmark.folder === activeFolder;
    const matchesSearch =
      searchTerm === "" ||
      bookmark.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.sender?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="container py-4 sm:py-6 lg:py-8 max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
      <header className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Saved Analysis
          </h1>

          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bookmarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 sm:h-10 flex items-center gap-2 text-sm"
                  >
                    <Folder className="h-4 w-4" />
                    <span className="truncate max-w-[100px] sm:max-w-[120px]">
                      {activeFolder}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-gradient-to-b from-white to-purple-50 dark:from-purple-900/90 dark:to-gray-900 border border-purple-200/50 dark:border-purple-800/50 shadow-lg shadow-purple-200/30 dark:shadow-purple-900/20 rounded-md p-1 w-[200px] sm:min-w-[220px]"
                  onEscapeKeyDown={() => setDropdownOpen(false)}
                  onInteractOutside={() => setDropdownOpen(false)}
                >
                  <div className="flex items-center justify-between pr-2">
                    <DropdownMenuItem
                      onClick={() => {
                        setActiveFolder("All");
                        setTimeout(() => setDropdownOpen(false), 50);
                      }}
                      className={`flex-grow text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 transition-colors duration-150 ${
                        activeFolder === "All"
                          ? "bg-gradient-to-r from-purple-50 to-purple-100/70 dark:from-purple-900/20 dark:to-purple-800/10"
                          : ""
                      }`}
                    >
                      All Bookmarks
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="h-px bg-gradient-to-r from-purple-200 to-purple-300/50 dark:from-purple-700 dark:to-purple-600/50 mx-1 my-1" />
                  {folders.map((folder) => (
                    <div
                      key={folder}
                      className="flex items-center justify-between pr-2"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          setActiveFolder(folder);
                          setTimeout(() => setDropdownOpen(false), 50);
                        }}
                        className={`flex-grow text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 transition-colors duration-150 ${
                          activeFolder === folder
                            ? "bg-gradient-to-r from-purple-50 to-purple-100/70 dark:from-purple-900/20 dark:to-purple-800/10"
                            : ""
                        }`}
                      >
                        {folder}
                      </DropdownMenuItem>
                      {folder !== "Default" && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-6 w-6 p-0 ml-1 hover:bg-purple-700/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(folder);
                          }}
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-500 dark:text-purple-400 hover:text-white" />
                        </Button>
                      )}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {filteredBookmarks.length > 0 && (
                <ExportButton
                  data={filteredBookmarks}
                  title={`Bookmarks - ${activeFolder}`}
                  className="h-9 sm:h-10 text-sm"
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Add Folder Dialog */}
      <Dialog
        open={showAddFolderDialog}
        onOpenChange={(open) => {
          setShowAddFolderDialog(open);
          if (!open) setNewFolderName("");
        }}
      >
        <DialogContent className="bg-white dark:bg-slate-900 border-[rgb(var(--border))] w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-[rgb(var(--foreground))] flex items-center gap-2 text-lg">
              <FolderPlus className="h-5 w-5 text-[rgb(var(--primary))]" />
              Create New Folder
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Create a new folder to organize your bookmarks.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label
              htmlFor="folder-name"
              className="text-sm font-medium text-[rgb(var(--foreground))] block mb-2"
            >
              Folder Name
            </label>
            <Input
              id="folder-name"
              placeholder="Enter folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-transparent text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  handleCreateFolder();
                }
              }}
            />
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddFolderDialog(false);
                setNewFolderName("");
              }}
              className="border-[rgb(var(--border))] text-sm w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/90 text-white text-sm w-full sm:w-auto"
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white dark:bg-slate-900 border-[rgb(var(--border))] w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-[rgb(var(--foreground))] flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete Folder
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Are you sure you want to delete the folder{" "}
              <span className="font-semibold text-[rgb(var(--foreground))]">
                "{folderToDelete}"
              </span>
              ?
              <p className="mt-2 text-amber-600 dark:text-amber-400 flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                All bookmarks in this folder will be moved to the Default
                folder.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-[rgb(var(--border))] text-sm w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFolder}
              className="bg-red-600 hover:bg-red-700 text-white text-sm w-full sm:w-auto"
            >
              Delete Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredBookmarks.length === 0 ? (
        <div className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg p-6 sm:p-8 lg:p-12 text-center">
          <Bookmark className="h-10 w-10 sm:h-12 sm:w-12 text-[rgb(var(--muted-foreground))] mx-auto mb-3 sm:mb-4 opacity-40" />
          <h3 className="text-base sm:text-lg font-medium mb-2">
            No bookmarks found
          </h3>
          <p className="text-[rgb(var(--muted-foreground))] max-w-md mx-auto text-sm sm:text-base">
            {searchTerm
              ? `No results matching "${searchTerm}"`
              : activeFolder !== "All"
              ? `No bookmarks in the "${activeFolder}" folder`
              : "Save important analysis results to view them here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredBookmarks.map((bookmark) => (
            <Card
              key={bookmark.id}
              className={`border overflow-hidden shadow-lg ${
                bookmark.threat
                  ? "bg-gradient-to-r from-red-100 to-red-50/80 border-red-300 dark:from-red-900/40 dark:to-red-900/20 dark:border-red-700/70"
                  : "bg-gradient-to-r from-green-100 to-green-50/80 border-green-300 dark:from-green-900/40 dark:to-green-900/20 dark:border-green-700/70"
              }`}
            >
              <div className="p-3 sm:p-4 lg:p-5">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                    <div
                      className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        bookmark.threat
                          ? "bg-white dark:bg-slate-800 ring-2 ring-red-400 dark:ring-red-500"
                          : "bg-white dark:bg-slate-800 ring-2 ring-green-400 dark:ring-green-500"
                      }`}
                    >
                      {bookmark.threat ? (
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">
                        {bookmark.subject}
                      </h3>
                      <p className="text-xs text-[rgb(var(--muted-foreground))] truncate mt-1">
                        From: {bookmark.sender}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                        >
                          <Folder className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="bg-gradient-to-b from-white to-purple-50 dark:from-purple-900/90 dark:to-gray-900 border border-purple-200/50 dark:border-purple-800/50 shadow-lg shadow-purple-200/30 dark:shadow-purple-900/20 rounded-md w-40"
                        align="end"
                      >
                        {folders.map((folder) => (
                          <DropdownMenuItem
                            key={folder}
                            onClick={() =>
                              handleMoveToFolder(bookmark.id, folder)
                            }
                            className="text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 transition-colors duration-150"
                          >
                            {folder}
                            {bookmark.folder === folder && " ✓"}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => handleRemoveBookmark(bookmark.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[rgb(var(--muted-foreground))] hover:text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-2">
                    <span
                      className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-xs font-medium ${
                        bookmark.threat
                          ? "bg-white text-red-600 dark:bg-slate-800 dark:text-red-400 border-2 border-red-300 dark:border-red-700"
                          : "bg-white text-green-600 dark:bg-slate-800 dark:text-green-400 border-2 border-green-300 dark:border-green-700"
                      }`}
                    >
                      {bookmark.threat
                        ? `Threat: ${bookmark.score}%`
                        : `Safe: ${100 - bookmark.score}%`}
                    </span>

                    {bookmark.sentiment && (
                      <span
                        className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-xs font-medium border-2 ${
                          bookmark.sentiment.toLowerCase() === "positive"
                            ? "bg-white text-green-600 dark:bg-slate-800 dark:text-green-400 border-green-300 dark:border-green-700"
                            : bookmark.sentiment.toLowerCase() === "negative"
                            ? "bg-white text-red-600 dark:bg-slate-800 dark:text-red-400 border-red-300 dark:border-red-700"
                            : "bg-white text-yellow-600 dark:bg-slate-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700"
                        }`}
                      >
                        {bookmark.sentiment}
                      </span>
                    )}

                    <span className="text-xs text-[rgb(var(--muted-foreground))]">
                      {bookmark.date && `${bookmark.date}`}
                    </span>
                  </div>

                  {bookmark.analysis && (
                    <div className="pt-1">
                      <p className="text-xs sm:text-sm line-clamp-2 text-[rgb(var(--foreground))] leading-relaxed">
                        {bookmark.analysis}
                      </p>
                    </div>
                  )}

                  {(bookmark.suspicious_factors?.length > 0 ||
                    bookmark.safety_factors?.length > 0) && (
                    <div className="grid grid-cols-1 gap-2 sm:gap-3 pt-1">
                      {bookmark.suspicious_factors?.length > 0 && (
                        <div
                          className={`space-y-2 p-2 sm:p-3 rounded-lg ${
                            bookmark.threat
                              ? "bg-white dark:bg-slate-800 border-2 border-red-300 dark:border-red-700/50"
                              : "bg-white dark:bg-slate-800 border border-red-200/50 dark:border-red-800/30"
                          }`}
                        >
                          <h4 className="text-xs font-medium text-red-600 dark:text-red-400">
                            Risk Factors
                          </h4>
                          <ul className="space-y-1">
                            {bookmark.suspicious_factors
                              .slice(0, 2)
                              .map((factor, i) => (
                                <li key={i} className="text-xs flex gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                                  <span className="line-clamp-1">{factor}</span>
                                </li>
                              ))}
                            {bookmark.suspicious_factors.length > 2 && (
                              <li className="text-xs text-[rgb(var(--muted-foreground))]">
                                +{bookmark.suspicious_factors.length - 2} more
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {bookmark.safety_factors?.length > 0 && (
                        <div
                          className={`space-y-2 p-2 sm:p-3 rounded-lg ${
                            !bookmark.threat
                              ? "bg-white dark:bg-slate-800 border-2 border-green-300 dark:border-green-700/50"
                              : "bg-white dark:bg-slate-800 border border-green-200/50 dark:border-green-800/30"
                          }`}
                        >
                          <h4 className="text-xs font-medium text-green-600 dark:text-green-400">
                            Safety Indicators
                          </h4>
                          <ul className="space-y-1">
                            {bookmark.safety_factors
                              .slice(0, 2)
                              .map((factor, i) => (
                                <li key={i} className="text-xs flex gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                                  <span className="line-clamp-1">{factor}</span>
                                </li>
                              ))}
                            {bookmark.safety_factors.length > 2 && (
                              <li className="text-xs text-[rgb(var(--muted-foreground))]">
                                +{bookmark.safety_factors.length - 2} more
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-[rgb(var(--border))]">
                  <span className="text-xs text-[rgb(var(--muted-foreground))]">
                    Saved:{" "}
                    {new Date(bookmark.bookmarked_at).toLocaleDateString()}
                  </span>

                  <ExportButton
                    data={[bookmark]}
                    title={`Email Analysis - ${bookmark.subject}`}
                    className="text-xs h-6 sm:h-7 px-2 sm:px-3"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
