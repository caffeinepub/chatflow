import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, User } from "lucide-react";
import { useState } from "react";
import { useGetCallerUserProfile, useIsCallerAdmin } from "../hooks/useQueries";
import LoginButton from "./LoginButton";
import ProfileEditModal from "./ProfileEditModal";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  onShowAdmin: () => void;
}

export default function Header({ onShowAdmin }: HeaderProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  return (
    <>
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src="/assets/uploads/ChatFlow_20260311_091651_0000-1.png"
              alt="ChatFlow Logo"
              className="h-8 w-8 rounded-full object-cover"
            />
            <h1 className="text-xl font-bold text-foreground">ChatFlow</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar?.getDirectURL()} />
                  <AvatarFallback className="bg-primary/10">
                    {userProfile?.username.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userProfile?.username}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {userProfile?.status}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowProfileEdit(true)}>
                <User className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={onShowAdmin}>
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <LoginButton />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {showProfileEdit && (
        <ProfileEditModal onClose={() => setShowProfileEdit(false)} />
      )}
    </>
  );
}
