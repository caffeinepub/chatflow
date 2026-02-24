import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Message {
    content: string;
    sender: Principal;
    isEdited: boolean;
    timestamp: bigint;
}
export interface UserProfile {
    status: string;
    username: string;
    isActive: boolean;
    avatar?: ExternalBlob;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGroupMember(chatId: string, newMember: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignGroupAdmin(chatId: string, newAdmin: Principal): Promise<void>;
    createChat(participants: Array<Principal>, isGroup: boolean, groupName: string | null, groupAvatar: ExternalBlob | null): Promise<string>;
    deleteConversation(chatId: string): Promise<void>;
    deleteMessage(chatId: string, timestamp: bigint, deleteForEveryone: boolean): Promise<void>;
    disableUser(user: Principal): Promise<void>;
    editMessage(chatId: string, timestamp: bigint, newContent: string): Promise<void>;
    enableUser(user: Principal): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChatHistory(chatId: string): Promise<Array<Message>>;
    getConversations(): Promise<Array<{
        messages: Array<Message>;
        groupAvatar?: ExternalBlob;
        chatId: string;
        groupName?: string;
    }>>;
    getTotalMessageCount(): Promise<bigint>;
    getTotalUserCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeGroupMember(chatId: string, member: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchMessages(chatId: string, searchText: string): Promise<Array<Message>>;
    searchUserByUsername(username: string): Promise<Principal | null>;
    sendMessage(chatId: string, content: string): Promise<void>;
    updateGroupSettings(chatId: string, groupName: string | null, groupAvatar: ExternalBlob | null): Promise<void>;
}
