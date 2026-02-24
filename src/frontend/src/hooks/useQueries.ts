import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserProfile, Message } from '../backend';
import { Principal } from '@icp-sdk/core/principal';
import { ExternalBlob } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(principal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !actorFetching && !!principal,
    retry: false,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Conversation Queries
export function useGetConversations() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversations();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 4000,
    refetchIntervalInBackground: false,
  });
}

export function useGetChatHistory(chatId: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['chatHistory', chatId],
    queryFn: async () => {
      if (!actor || !chatId) return [];
      return actor.getChatHistory(chatId);
    },
    enabled: !!actor && !actorFetching && !!chatId,
    refetchInterval: 4000,
    refetchIntervalInBackground: false,
  });
}

// Message Mutations
export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(chatId, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useEditMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, timestamp, newContent }: { chatId: string; timestamp: bigint; newContent: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editMessage(chatId, timestamp, newContent);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, timestamp, deleteForEveryone }: { chatId: string; timestamp: bigint; deleteForEveryone: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMessage(chatId, timestamp, deleteForEveryone);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteConversation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteConversation(chatId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Search Queries
export function useSearchUser() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.searchUserByUsername(username);
    },
  });
}

export function useSearchMessages(chatId: string, searchText: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['searchMessages', chatId, searchText],
    queryFn: async () => {
      if (!actor || !chatId || !searchText) return [];
      return actor.searchMessages(chatId, searchText);
    },
    enabled: !!actor && !actorFetching && !!chatId && !!searchText,
  });
}

// Chat Creation
export function useCreateChat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ participants, isGroup, groupName, groupAvatar }: {
      participants: Principal[];
      isGroup: boolean;
      groupName: string | null;
      groupAvatar: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createChat(participants, isGroup, groupName, groupAvatar);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Group Operations
export function useUpdateGroupSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, groupName, groupAvatar }: {
      chatId: string;
      groupName: string | null;
      groupAvatar: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateGroupSettings(chatId, groupName, groupAvatar);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useAddGroupMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, newMember }: { chatId: string; newMember: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addGroupMember(chatId, newMember);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useRemoveGroupMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, member }: { chatId: string; member: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeGroupMember(chatId, member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useAssignGroupAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, newAdmin }: { chatId: string; newAdmin: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignGroupAdmin(chatId, newAdmin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetTotalUserCount() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['totalUserCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalUserCount();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetTotalMessageCount() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['totalMessageCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalMessageCount();
    },
    enabled: !!actor && !actorFetching,
  });
}
