import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface UsageLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUp?: () => void;
  isGuest?: boolean;
}

export function UsageLimitDialog({
  open,
  onOpenChange,
  onSignUp,
  isGuest = false,
}: UsageLimitDialogProps) {
  const handleTelegramClick = () => {
    window.open("https://t.me/the_ace_studio", "_blank");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isGuest ? "Trial Limit Reached" : "Usage Limit Reached"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              {isGuest ? (
                <p>
                  You've used your 2 free trials without registration. To continue
                  using all features including follow-ups and message crafting, please
                  sign up for a free account.
                </p>
              ) : (
                <p>
                  You've reached your monthly usage limit. Please contact the admin to
                  increase your usage or upgrade your plan.
                </p>
              )}
            </div>

            <div className="mt-4 rounded-lg bg-muted p-3 space-y-3">
              <p className="text-sm font-medium">Need help?</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleTelegramClick}
              >
                <MessageCircle className="size-4 mr-2" />
                Contact us on Telegram
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Username: @the_ace_studio
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          {isGuest && onSignUp && (
            <AlertDialogAction onClick={onSignUp}>
              Sign Up Free
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
