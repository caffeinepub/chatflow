import { useState } from "react";
import AdminPanel from "./AdminPanel";
import ChatWindow from "./ChatWindow";
import ConversationList from "./ConversationList";
import Header from "./Header";

export default function Layout() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  if (showAdmin) {
    return <AdminPanel onClose={() => setShowAdmin(false)} />;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header onShowAdmin={() => setShowAdmin(true)} />
      <div className="flex flex-1 overflow-hidden">
        <ConversationList
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
        />
        <ChatWindow chatId={selectedChatId} />
      </div>
    </div>
  );
}
