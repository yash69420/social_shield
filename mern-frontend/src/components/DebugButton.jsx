import React from "react";
import { Button } from "./ui/button";
import { Bug } from "lucide-react";
import { debugEmailDates } from "../utils/export";

const DebugButton = ({ data }) => {
  const handleDebug = () => {
    debugEmailDates(data);
    alert(
      "Date debug information has been logged to the console. Press F12 to view."
    );
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="bg-gray-700/50 text-white"
      onClick={handleDebug}
    >
      <Bug className="h-4 w-4 mr-2" />
      Debug Dates
    </Button>
  );
};

export default DebugButton;
