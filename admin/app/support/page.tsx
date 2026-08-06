'use client';

import useSWR from 'swr';
import { getSupportChats, getSupportMessages, sendSupportMessage } from '@/lib/api';
import { Loader, Send, MessageCircle } from 'lucide-react';
import { useState } from 'react';

const fetcher = (url: string) => {
  if (url.startsWith('messages-')) {
    const userId = url.replace('messages-', '');
    return getSupportMessages(userId).then((res) => res.data);
  }
  return getSupportChats().then((res) => res.data);
};

export default function SupportPage() {
  const { data: chats = [], isLoading: chatsLoading } = useSWR('support-chats', fetcher, {
    revalidateOnFocus: false,
  });
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const { data: messages = [], isLoading: messagesLoading } = useSWR(
    selectedChat ? `messages-${selectedChat}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    setSendingMessage(true);
    try {
      await sendSupportMessage('admin', selectedChat, messageText);
      setMessageText('');
      // Refetch messages
      const res = await getSupportMessages(selectedChat);
      // Update messages in real-time
    } catch (error: any) {
      alert('Error sending message: ' + (error.response?.data?.error || 'Failed'));
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support Chat</h1>
        <p className="text-gray-600 mt-1">Manage user support requests and messages</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Chats List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold">Support Chats</h2>
            <p className="text-xs text-gray-500 mt-1">{chats.length} active chats</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="animate-spin" />
              </div>
            ) : chats.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No active chats
              </div>
            ) : (
              chats.map((chat: any) => (
                <button
                  key={chat.userUid}
                  onClick={() => setSelectedChat(chat.userUid)}
                  className={`w-full px-4 py-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedChat === chat.userUid ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{chat.userName}</p>
                      <p className="text-xs text-gray-600 truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(chat.lastTimestamp).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold">Conversation</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg: any) => (
                    <div
                      key={msg._id}
                      className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.isAdmin
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.isAdmin ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your response..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-2 opacity-30" />
                <p>Select a chat to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
