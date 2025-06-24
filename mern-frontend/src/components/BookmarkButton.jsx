import React, { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck, Folder, Plus, Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  addBookmark,
  removeBookmark,
  isBookmarked,
  createBookmarkFolder,
} from "../utils/bookmarks";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/DropdownMenu";
import Input from "./ui/input";
import { useToast } from "./ui/toast";

const BookmarkButton = ({
  analysisData,
  variant = "icon",
  size = "sm",
  className,
}) => {
  const [bookmarked, setBookmarked] = useState(false);
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (analysisData?.id) {
      setBookmarked(isBookmarked(analysisData.id));
    }

    // Load folders
    const foldersJson = localStorage.getItem("Social Shield_bookmark_folders");
    const savedFolders = foldersJson ? JSON.parse(foldersJson) : ["Default"];
    setFolders(savedFolders);
  }, [analysisData?.id]);

  const handleBookmark = (folderName = "Default") => {
    if (!analysisData) return;

    if (bookmarked) {
      removeBookmark(analysisData.id);
      setBookmarked(false);
      addToast("Bookmark removed", "info");
    } else {
      addBookmark(analysisData, folderName);
      setBookmarked(true);
      addToast(
        folderName === "Default"
          ? "Analysis bookmarked"
          : `Analysis saved to "${folderName}" folder`,
        "bookmark"
      );
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
      const updatedFolders = createBookmarkFolder(newFolderName.trim());
      setFolders(updatedFolders);
      handleBookmark(newFolderName.trim());
      setNewFolderName("");
      setShowNewFolderInput(false);
      addToast(
        `Folder "${newFolderName.trim()}" created and bookmark saved`,
        "success"
      );
    }
  };

  if (variant === "icon") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size={size} className="hover:bg-blue-800/30">
            {bookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-blue-400" />
            ) : (
              <Bookmark className="h-4 w-4 text-blue-300" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="bg-gradient-to-b from-white to-purple-50 dark:from-purple-900/90 dark:to-gray-900 border border-purple-200/50 dark:border-purple-800/50 shadow-lg shadow-purple-200/30 dark:shadow-purple-900/20 rounded-lg p-1 w-56"
          align="end"
        >
          {bookmarked ? (
            <DropdownMenuItem
              onClick={() => handleBookmark()}
              className="text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 flex items-center gap-2 py-2 transition-colors duration-150"
            >
              <BookmarkCheck className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              Remove Bookmark
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                onClick={() => handleBookmark("Default")}
                className="text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 flex items-center gap-2 py-2 transition-colors duration-150"
              >
                <Bookmark className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                Bookmark
              </DropdownMenuItem>

              {folders.length > 1 && (
                <>
                  <DropdownMenuSeparator className="h-px bg-gradient-to-r from-purple-200 to-purple-300/50 dark:from-purple-700 dark:to-purple-600/50 mx-1 my-1" />
                  {folders
                    .filter((f) => f !== "Default")
                    .map((folder) => (
                      <DropdownMenuItem
                        key={folder}
                        onClick={() => handleBookmark(folder)}
                        className="text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 flex items-center gap-2 py-2 transition-colors duration-150"
                      >
                        <Folder className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                        Save to "{folder}"
                      </DropdownMenuItem>
                    ))}
                </>
              )}

              <DropdownMenuSeparator className="h-px bg-gradient-to-r from-purple-200 to-purple-300/50 dark:from-purple-700 dark:to-purple-600/50 mx-1 my-1" />

              {!showNewFolderInput ? (
                <DropdownMenuItem
                  onClick={() => setShowNewFolderInput(true)}
                  className="text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 flex items-center gap-2 py-2 transition-colors duration-150"
                >
                  <Plus className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Create New Folder
                </DropdownMenuItem>
              ) : (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md mx-1 my-1">
                  <Input
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="mb-2 bg-white dark:bg-purple-800/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 placeholder:text-purple-500 dark:placeholder:text-purple-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder();
                      if (e.key === "Escape") {
                        setShowNewFolderInput(false);
                        setNewFolderName("");
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim()}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Create
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNewFolderInput(false);
                        setNewFolderName("");
                      }}
                      className="flex-1 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 h-7 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Button variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className || ""}>
          {bookmarked ? (
            <>
              <BookmarkCheck className="h-4 w-4 mr-2" />
              Bookmarked
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmark
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-gradient-to-b from-white to-purple-50 dark:from-purple-900/90 dark:to-gray-900 border border-purple-200/50 dark:border-purple-800/50 shadow-lg shadow-purple-200/30 dark:shadow-purple-900/20 rounded-lg p-1 w-56"
        align="end"
      >
        {bookmarked ? (
          <DropdownMenuItem
            onClick={() => handleBookmark()}
            className="text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 flex items-center gap-2 py-2 transition-colors duration-150"
          >
            <BookmarkCheck className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            Remove Bookmark
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => handleBookmark("Default")}
              className="text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 flex items-center gap-2 py-2 transition-colors duration-150"
            >
              <Bookmark className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              Bookmark
            </DropdownMenuItem>

            {folders.length > 1 && (
              <>
                <DropdownMenuSeparator className="h-px bg-gradient-to-r from-purple-200 to-purple-300/50 dark:from-purple-700 dark:to-purple-600/50 mx-1 my-1" />
                {folders
                  .filter((f) => f !== "Default")
                  .map((folder) => (
                    <DropdownMenuItem
                      key={folder}
                      onClick={() => handleBookmark(folder)}
                      className="text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 flex items-center gap-2 py-2 transition-colors duration-150"
                    >
                      <Folder className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                      Save to "{folder}"
                    </DropdownMenuItem>
                  ))}
              </>
            )}

            <DropdownMenuSeparator className="h-px bg-gradient-to-r from-purple-200 to-purple-300/50 dark:from-purple-700 dark:to-purple-600/50 mx-1 my-1" />

            {!showNewFolderInput ? (
              <DropdownMenuItem
                onClick={() => setShowNewFolderInput(true)}
                className="text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 flex items-center gap-2 py-2 transition-colors duration-150"
              >
                <Plus className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                Create New Folder
              </DropdownMenuItem>
            ) : (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md mx-1 my-1">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="mb-2 bg-white dark:bg-purple-800/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 placeholder:text-purple-500 dark:placeholder:text-purple-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") {
                      setShowNewFolderInput(false);
                      setNewFolderName("");
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim()}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewFolderInput(false);
                      setNewFolderName("");
                    }}
                    className="flex-1 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BookmarkButton;
