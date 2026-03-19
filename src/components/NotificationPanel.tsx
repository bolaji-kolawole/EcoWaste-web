import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Notification } from '../services/NotificationService';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Recycle } from 'lucide-react';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (external_id: string) => void;
}

export default function NotificationPanel({ notifications, onClose, onMarkRead }: NotificationPanelProps) {
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="size-5 text-green-600" />;
      case 'info':
        return <Recycle className="size-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="size-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="size-5 text-red-600" />;
      default:
        return <Info className="size-5 text-blue-600" />;
    }
  };

  const markAllAsRead = () => {
    notifications.forEach((n) => {
      if (!n.read) {
        onMarkRead(n.external_id);
      }
    });
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Notifications
          </SheetTitle>
          <SheetDescription>
            Stay updated on your waste collection requests
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {notifications.filter((n) => !n.read).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="w-full"
            >
              <CheckCheck className="size-4 mr-2" />
              Mark all as read
            </Button>
          )}

          {sortedNotifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="size-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedNotifications.map((notification) => (
                <div
                  key={notification.external_id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.read
                      ? 'bg-white border-gray-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkRead(notification.external_id)}
                        className="shrink-0"
                      >
                        <CheckCheck className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
