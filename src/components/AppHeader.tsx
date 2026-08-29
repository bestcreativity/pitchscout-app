import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  FolderOpen,
  Globe,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  Shield,
  Sparkles,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "adetoyebiridwan1.0@gmail.com";

export function AppHeader() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const name =
    (user?.user_metadata?.["display_name"] as string | undefined) ||
    user?.email ||
    "Account";

  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 pt-6 sm:px-8">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-sm font-semibold tracking-widest text-muted-foreground">
          ACE PITCH
        </Link>
        {user && (
          <nav className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" size="sm" className="rounded-full h-8 px-3">
              <Link to="/">
                <LayoutGrid className="size-3.5" /> Main
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full h-8 px-3">
              <Link to="/train-pitch">
                <MessageSquareText className="size-3.5" /> Train Pitch
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full h-8 px-3">
              <Link to="/gig-creator">
                <Sparkles className="size-3.5" /> Gig Creator
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full h-8 px-3">
              <Link to="/ai-browser">
                <Globe className="size-3.5" /> AI Browser
              </Link>
            </Button>
          </nav>
        )}
      </div>

      {loading ? (
        <div className="h-9 w-24" />
      ) : user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full">
              <User className="size-4" />
              <span className="max-w-[9rem] truncate">{name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/">
                <LayoutGrid className="size-4" /> Main page
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/train-pitch">
                <MessageSquareText className="size-4" /> Train Pitch
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/gig-creator">
                <Sparkles className="size-4" /> Gig Creator
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/ai-browser">
                <Globe className="size-4" /> AI Browser
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <Briefcase className="size-4" /> Your background
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/storage">
                <FolderOpen className="size-4" /> Saved research
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin">
                    <Shield className="size-4" /> Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link to="/auth">Sign in</Link>
        </Button>
      )}
    </header>
  );
}
