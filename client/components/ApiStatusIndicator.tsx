import { Wifi, WifiOff, Database, AlertCircle } from "lucide-react";

interface ApiStatusIndicatorProps {
  isUsingFallback: boolean;
  statusMessage: string;
  error?: string | null;
  className?: string;
}

export default function ApiStatusIndicator({ 
  isUsingFallback, 
  statusMessage, 
  error,
  className = ""
}: ApiStatusIndicatorProps) {
  const getStatusColor = () => {
    if (error) return "text-ufc-red";
    if (isUsingFallback) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusIcon = () => {
    if (error) return AlertCircle;
    if (isUsingFallback) return Database;
    return Wifi;
  };

  const getStatusText = () => {
    if (error) return "Connection Error";
    if (isUsingFallback) return "Offline Mode";
    return "Live Data";
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <StatusIcon className={`w-4 h-4 ${getStatusColor()}`} />
      <span className={`font-oswald tracking-wide ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {statusMessage && (
        <span className="text-ufc-metallic font-oswald text-xs tracking-wide">
          • {statusMessage}
        </span>
      )}
    </div>
  );
}
