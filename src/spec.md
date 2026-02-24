# Specification

## Summary
**Goal:** Build ChatFlow, a WhatsApp-style messaging application with user authentication, one-to-one and group messaging, file sharing, and an admin panel.

**Planned changes:**
- Implement Internet Identity authentication with passkeys and social login (Google, Apple, Microsoft)
- Create user profiles with avatar upload, status messages, and username display
- Build one-to-one private messaging with scrollable history, timestamps, and auto-scroll
- Add contact list sidebar with last message preview, unread badges, and delete conversation
- Implement group chat with member management, group avatars, and admin roles
- Add image and file upload support (JPG, PNG, PDF, DOC) with in-chat preview
- Enable message editing and deletion (5-minute window) with "delete for everyone" option
- Implement in-conversation search functionality
- Add emoji picker for message composition
- Create WhatsApp-inspired responsive UI with green accent theme and dark/light mode toggle
- Build admin panel with user statistics and account management
- Implement auto-refresh polling (3-5 second intervals) for new messages

**User-visible outcome:** Users can register with Internet Identity, set up profiles, send private messages and create group chats, share images and files, search conversations, use emojis, edit/delete messages, and switch between dark/light themes. Admins can view statistics and manage user accounts. Messages auto-update every few seconds without manual refresh.
