import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type UserProfile = {
    username : Text;
    status : Text;
    avatar : ?Storage.ExternalBlob;
    isActive : Bool;
  };

  public type Message = {
    sender : Principal;
    content : Text;
    timestamp : Int;
    isEdited : Bool;
  };

  public type Chat = {
    participants : [Principal];
    messages : [Message];
    isGroup : Bool;
    groupName : ?Text;
    groupAvatar : ?Storage.ExternalBlob;
    admins : [Principal];
  };

  module Message {
    public func compareByTime(message1 : Message, message2 : Message) : Order.Order {
      Int.compare(message1.timestamp, message2.timestamp);
    };
  };

  module GroupWithMessages {
    public type GroupWithMessages = {
      messages : [Message];
      groupName : ?Text;
      groupAvatar : ?Storage.ExternalBlob;
    };
    public func compareByLastMessageTime(group1 : GroupWithMessages, group2 : GroupWithMessages) : Order.Order {
      let last1 = switch (group1.messages.size()) {
        case (0) { null };
        case (size1) { ?group1.messages[size1 - 1] };
      };
      let last2 = switch (group2.messages.size()) {
        case (0) { null };
        case (size2) { ?group2.messages[size2 - 1] };
      };
      switch (last1, last2) {
        case (?msg1, ?msg2) { Message.compareByTime(msg1, msg2) };
        case (?_, null) { #less };
        case (null, ?_) { #greater };
        case (null, null) { #equal };
      };
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let chats = Map.empty<Text, Chat>();

  func isUserActive(user : Principal) : Bool {
    switch (userProfiles.get(user)) {
      case (null) { true };
      case (?profile) { profile.isActive };
    };
  };

  func isGroupAdmin(chat : Chat, user : Principal) : Bool {
    for (admin in chat.admins.values()) {
      if (admin.equal(user)) { return true };
    };
    false;
  };

  func isWithinEditWindow(messageTime : Int) : Bool {
    let fiveMinutesInNanos : Int = 5 * 60 * 1_000_000_000;
    let currentTime = Time.now();
    (currentTime - messageTime) <= fiveMinutesInNanos;
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func searchUserByUsername(username : Text) : async ?Principal {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can search for users");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let allProfiles = userProfiles.toArray();
    let found = allProfiles.find(
      func((_, profile)) {
        profile.username == username;
      }
    );
    switch (found) {
      case (null) { null };
      case (?(principal, _)) { ?principal };
    };
  };

  public shared ({ caller }) func sendMessage(chatId : Text, content : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let chat = switch (chats.get(chatId)) {
      case (null) { Runtime.trap("Chat does not exist") };
      case (?chat) { chat };
    };
    var isParticipant = false;
    for (p in chat.participants.values()) {
      if (p.equal(caller)) { isParticipant := true };
    };
    if (not isParticipant) {
      Runtime.trap("You are not a participant in this chat");
    };
    let message : Message = {
      sender = caller;
      content;
      timestamp = Time.now();
      isEdited = false;
    };
    let updatedMessages = chat.messages.concat([message]);
    let updatedChat : Chat = {
      participants = chat.participants;
      messages = updatedMessages;
      isGroup = chat.isGroup;
      groupName = chat.groupName;
      groupAvatar = chat.groupAvatar;
      admins = chat.admins;
    };
    chats.add(chatId, updatedChat);
  };

  public query ({ caller }) func getChatHistory(chatId : Text) : async [Message] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get chat history");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let chat = switch (chats.get(chatId)) {
      case (null) { Runtime.trap("Chat does not exist") };
      case (?chat) { chat };
    };
    var isParticipant = false;
    for (p in chat.participants.values()) {
      if (p.equal(caller)) { isParticipant := true };
    };
    if (not isParticipant) {
      Runtime.trap("You are not a participant in this chat");
    };
    chat.messages.sort(Message.compareByTime);
  };

  public shared ({ caller }) func createChat(participants : [Principal], isGroup : Bool, groupName : ?Text, groupAvatar : ?Storage.ExternalBlob) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create chats");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let chatId = Time.now().toText();
    let newChat : Chat = {
      participants = participants.concat([caller]);
      messages = [];
      isGroup;
      groupName;
      groupAvatar;
      admins = [caller];
    };
    chats.add(chatId, newChat);
    chatId;
  };

  public query ({ caller }) func searchMessages(chatId : Text, searchText : Text) : async [Message] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can search messages");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let chat = switch (chats.get(chatId)) {
      case (null) { Runtime.trap("Chat does not exist") };
      case (?chat) { chat };
    };
    var isParticipant = false;
    for (p in chat.participants.values()) {
      if (p.equal(caller)) { isParticipant := true };
    };
    if (not isParticipant) {
      Runtime.trap("You are not a participant in this chat");
    };
    chat.messages.filter(
      func(message) {
        message.content.contains(#text searchText);
      }
    );
  };

  public shared ({ caller }) func editMessage(chatId : Text, timestamp : Int, newContent : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can edit messages");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let chat = switch (chats.get(chatId)) {
      case (null) { Runtime.trap("Chat does not exist") };
      case (?chat) { chat };
    };
    var isParticipant = false;
    for (p in chat.participants.values()) {
      if (p.equal(caller)) { isParticipant := true };
    };
    if (not isParticipant) {
      Runtime.trap("You are not a participant in this chat");
    };
    var messageFound = false;
    let updatedMessages = chat.messages.map(
      func(message) {
        if (message.sender.equal(caller) and message.timestamp == timestamp) {
          if (not isWithinEditWindow(message.timestamp)) {
            Runtime.trap("Cannot edit message: 5 minute window has passed");
          };
          messageFound := true;
          {
            sender = message.sender;
            content = newContent;
            timestamp = message.timestamp;
            isEdited = true;
          };
        } else {
          message;
        };
      }
    );
    if (not messageFound) {
      Runtime.trap("Message not found or you don't have permission to edit it");
    };
    let updatedChat : Chat = {
      participants = chat.participants;
      messages = updatedMessages;
      isGroup = chat.isGroup;
      groupName = chat.groupName;
      groupAvatar = chat.groupAvatar;
      admins = chat.admins;
    };
    chats.add(chatId, updatedChat);
  };

  public shared ({ caller }) func deleteMessage(chatId : Text, timestamp : Int, deleteForEveryone : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete messages");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let chat = switch (chats.get(chatId)) {
      case (null) { Runtime.trap("Chat does not exist") };
      case (?chat) { chat };
    };
    var isParticipant = false;
    for (p in chat.participants.values()) {
      if (p.equal(caller)) { isParticipant := true };
    };
    if (not isParticipant) {
      Runtime.trap("You are not a participant in this chat");
    };
    var messageFound = false;
    let updatedMessages = chat.messages.filter(
      func(message) {
        if (message.timestamp == timestamp) {
          if (message.sender.equal(caller)) {
            if (deleteForEveryone and not isWithinEditWindow(message.timestamp)) {
              Runtime.trap("Cannot delete for everyone: 5 minute window has passed");
            };
            messageFound := true;
            false;
          } else {
            Runtime.trap("You can only delete your own messages");
          };
        } else {
          true;
        };
      }
    );
    if (not messageFound) {
      Runtime.trap("Message not found");
    };
    let updatedChat : Chat = {
      participants = chat.participants;
      messages = updatedMessages;
      isGroup = chat.isGroup;
      groupName = chat.groupName;
      groupAvatar = chat.groupAvatar;
      admins = chat.admins;
    };
    chats.add(chatId, updatedChat);
  };

  public shared ({ caller }) func deleteConversation(chatId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete conversations");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let chat = switch (chats.get(chatId)) {
      case (null) { Runtime.trap("Chat does not exist") };
      case (?chat) { chat };
    };
    var isParticipant = false;
    for (p in chat.participants.values()) {
      if (p.equal(caller)) { isParticipant := true };
    };
    if (not isParticipant) {
      Runtime.trap("You are not a participant in this chat");
    };
    chats.remove(chatId);
  };

  public shared ({ caller }) func addGroupMember(chatId : Text, newMember : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add group members");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let chat = switch (chats.get(chatId)) {
      case (null) { Runtime.trap("Chat does not exist") };
      case (?chat) { chat };
    };
    if (not chat.isGroup) {
      Runtime.trap("This is not a group chat");
    };
    if (not isGroupAdmin(chat, caller)) {
      Runtime.trap("Only group admins can add members");
    };
    var isMember = false;
    for (p in chat.participants.values()) {
      if (p.equal(newMember)) { isMember := true };
    };
    if (isMember) {
      Runtime.trap("User is already a member");
    };
    let updatedChat : Chat = {
      participants = chat.participants.concat([newMember]);
      messages = chat.messages;
      isGroup = chat.isGroup;
      groupName = chat.groupName;
      groupAvatar = chat.groupAvatar;
      admins = chat.admins;
    };
    chats.add(chatId, updatedChat);
  };

  public shared ({ caller }) func removeGroupMember(chatId : Text, member : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can remove group members");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let chat = switch (chats.get(chatId)) {
      case (null) { Runtime.trap("Chat does not exist") };
      case (?chat) { chat };
    };
    if (not chat.isGroup) {
      Runtime.trap("This is not a group chat");
    };
    if (not isGroupAdmin(chat, caller)) {
      Runtime.trap("Only group admins can remove members");
    };
    var isLastAdmin = false;
    if (chat.admins.size() == 1) {
      for (p in chat.admins.values()) {
        if (p.equal(member)) { isLastAdmin := true };
      };
    };
    if (isLastAdmin) {
      Runtime.trap("Cannot remove the last admin");
    };
    let updatedParticipants = chat.participants.filter(
      func(p) { not p.equal(member) }
    );
    let updatedAdmins = chat.admins.filter(
      func(p) { not p.equal(member) }
    );
    let updatedChat : Chat = {
      participants = updatedParticipants;
      messages = chat.messages;
      isGroup = chat.isGroup;
      groupName = chat.groupName;
      groupAvatar = chat.groupAvatar;
      admins = updatedAdmins;
    };
    chats.add(chatId, updatedChat);
  };

  public shared ({ caller }) func assignGroupAdmin(chatId : Text, newAdmin : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can assign group admins");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let chat = switch (chats.get(chatId)) {
      case (null) { Runtime.trap("Chat does not exist") };
      case (?chat) { chat };
    };
    if (not chat.isGroup) {
      Runtime.trap("This is not a group chat");
    };
    if (not isGroupAdmin(chat, caller)) {
      Runtime.trap("Only group admins can assign new admins");
    };
    var isParticipant = false;
    for (p in chat.participants.values()) {
      if (p.equal(newAdmin)) { isParticipant := true };
    };
    if (not isParticipant) {
      Runtime.trap("User is not a member of this group");
    };
    var isAdmin = false;
    for (p in chat.admins.values()) {
      if (p.equal(newAdmin)) { isAdmin := true };
    };
    if (isAdmin) {
      Runtime.trap("User is already an admin");
    };
    let updatedChat : Chat = {
      participants = chat.participants;
      messages = chat.messages;
      isGroup = chat.isGroup;
      groupName = chat.groupName;
      groupAvatar = chat.groupAvatar;
      admins = chat.admins.concat([newAdmin]);
    };
    chats.add(chatId, updatedChat);
  };

  public shared ({ caller }) func updateGroupSettings(chatId : Text, groupName : ?Text, groupAvatar : ?Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update group settings");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let chat = switch (chats.get(chatId)) {
      case (null) { Runtime.trap("Chat does not exist") };
      case (?chat) { chat };
    };
    if (not chat.isGroup) {
      Runtime.trap("This is not a group chat");
    };
    if (not isGroupAdmin(chat, caller)) {
      Runtime.trap("Only group admins can update group settings");
    };
    let updatedChat : Chat = {
      participants = chat.participants;
      messages = chat.messages;
      isGroup = chat.isGroup;
      groupName;
      groupAvatar;
      admins = chat.admins;
    };
    chats.add(chatId, updatedChat);
  };

  public query ({ caller }) func getConversations() : async [{
    chatId : Text;
    messages : [Message];
    groupName : ?Text;
    groupAvatar : ?Storage.ExternalBlob;
  }] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get conversations");
    };
    if (not isUserActive(caller)) {
      Runtime.trap("Unauthorized: Your account is disabled");
    };
    let allChats = chats.toArray();
    let userChats = allChats.filter(
      func((_, chat)) {
        var isParticipant = false;
        for (p in chat.participants.values()) {
          if (p.equal(caller)) { isParticipant := true };
        };
        isParticipant;
      }
    );
    userChats.map(
      func((chatId, chat)) {
        {
          chatId;
          messages = chat.messages;
          groupName = chat.groupName;
          groupAvatar = chat.groupAvatar;
        };
      }
    ).sort(
      GroupWithMessages.compareByLastMessageTime
    );
  };

  // Admin panel functions
  public query ({ caller }) func getTotalUserCount() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view user statistics");
    };
    userProfiles.size();
  };

  public query ({ caller }) func getTotalMessageCount() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view message statistics");
    };
    var totalMessages : Nat = 0;
    for ((_, chat) in chats.entries()) {
      totalMessages += chat.messages.size();
    };
    totalMessages;
  };

  public shared ({ caller }) func disableUser(user : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can disable users");
    };
    let profile = switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };
    let updatedProfile : UserProfile = {
      username = profile.username;
      status = profile.status;
      avatar = profile.avatar;
      isActive = false;
    };
    userProfiles.add(user, updatedProfile);
  };

  public shared ({ caller }) func enableUser(user : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can enable users");
    };
    let profile = switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };
    let updatedProfile : UserProfile = {
      username = profile.username;
      status = profile.status;
      avatar = profile.avatar;
      isActive = true;
    };
    userProfiles.add(user, updatedProfile);
  };
};
