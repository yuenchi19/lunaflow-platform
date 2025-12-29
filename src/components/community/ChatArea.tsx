"use client";

import { useEffect, useState, useRef } from "react";
import { Message, User } from "@/types";
import { sendMessage, getMessages, deleteMessage, MOCK_USERS } from "@/lib/data";
import { Trash2, Hash, Gift, Smile, Plus, Bell, Check } from "lucide-react";
import { useCommunity } from "@/components/community/CommunityContext";

interface ChatAreaProps {
    channelId: string;
    currentUser: User;
    channelName: string;
    introContent?: string;
}

import ReactMarkdown from 'react-markdown';

export function ChatArea({ channelId, currentUser, channelName, introContent }: ChatAreaProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [replyTo, setReplyTo] = useState<Message | null>(null); // [NEW] Reply state
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { isRulesAgreed, agreeToRules, setIsMobileMenuOpen } = useCommunity();
    const fileInputRef = useRef<HTMLInputElement>(null); // [NEW] File input

    // Check if this is the "Rules" channel
    const isRulesChannel = channelName.includes("はじめに①") || channelId === 'c1';

    const loadMessages = () => {
        const msgs = getMessages(channelId);
        setMessages(msgs);
    };

    const handleDelete = (messageId: string) => {
        if (!confirm("このメッセージを削除しますか？")) return;
        deleteMessage(channelId, messageId);
        loadMessages();
    };

    const handleReply = (msg: Message) => {
        setReplyTo(msg);
        // Focus input
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Mock Image Upload (Base64 or URL)
        // In real app, upload to storage and get URL
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            // Send message with image markdown
            const imageMarkdown = `![${file.name}](${base64}) \n`;
            sendMessage(channelId, currentUser.id, imageMarkdown);
            loadMessages();
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 2000); // Polling for "real-time"
        return () => clearInterval(interval);
    }, [channelId]);

    useEffect(() => {
        // Scroll to bottom of message container without shifting the whole page
        if (messagesEndRef.current?.parentElement) {
            const container = messagesEndRef.current.parentElement;
            container.scrollTop = container.scrollHeight;
        }
    }, [messages, channelId]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        let content = inputValue;
        if (replyTo) {
            // Append reply context or handle as metadata. 
            // For simple markdown chat, we'll prefix with a quote.
            const replyUser = MOCK_USERS.find(u => u.id === replyTo.userId);
            const replyName = replyUser?.communityNickname || replyUser?.name || "User";
            content = `> **@${replyName}**: ${replyTo.content.substring(0, 50)}${replyTo.content.length > 50 ? "..." : ""}\n\n${inputValue}`;
            setReplyTo(null);
        }

        sendMessage(channelId, currentUser.id, content);
        setInputValue("");
        loadMessages();
    };

    const handleConfirmRules = () => {
        if (confirm("ルールを確認し、同意しますか？")) {
            agreeToRules();
            alert("確認しました。「はじめに②」などのチャンネルが開放されました！");
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#313338] text-[#DBDEE1] overflow-hidden">
            {/* Header */}
            <header className="h-12 border-b border-[#26272D] flex items-center px-4 bg-[#313338] shadow-sm justify-between flex-shrink-0 z-10 relative">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden text-[#B5BAC1] mr-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <Hash className="w-6 h-6 text-[#80848E]" />
                    <h1 className="font-bold text-base text-[#F2F3F5]">{channelName}</h1>
                </div>
                <div className="flex items-center gap-4 text-[#B5BAC1]">
                    <Bell className="w-6 h-6 hover:text-[#DBDEE1] cursor-pointer" />
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-[0.1rem] scrollbar-thin scrollbar-thumb-[#1A1B1E] scrollbar-track-[#2E3338]">

                {/* Special Layout for Rules Channel (omitted changes here, keeping existing if possible or re-pasting entire if needed) */}
                {/* ... (Rules Channel Layout) ... */}
                {isRulesChannel ? (
                    <div className="max-w-3xl mx-auto mt-4 md:mt-10 p-4 md:p-6 bg-[#2B2D31] rounded-md shadow-lg border border-[#1F2023]">
                        {/* ... Existing Rules Content ... */}
                        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 border-b border-[#3F4147] pb-3 md:pb-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#5865F2] rounded-full flex items-center justify-center flex-shrink-0">
                                <Hash className="w-6 h-6 md:w-8 md:h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg md:text-2xl font-bold text-white">LunaFlow Communityへようこそ</h1>
                                <p className="text-[#B5BAC1] text-xs md:text-base">ここが、このサーバーの始まりです。</p>
                            </div>
                        </div>

                        <div className="space-y-4 md:space-y-6 text-[#DBDEE1]">
                            {/* ... List items ... */}
                            <div className="flex gap-2 md:gap-3">
                                <span className="w-8 h-8 md:w-10 md:h-10 bg-[#5865F2] rounded-full flex items-center justify-center text-white font-bold text-base md:text-xl flex-shrink-0">1</span>
                                <div>
                                    <h3 className="font-bold text-sm md:text-lg text-white mb-0.5 md:mb-1">仲間へのリスペクト</h3>
                                    <p className="text-xs md:text-sm text-[#B5BAC1]">全てのメンバーに対して敬意を払い、建設的なコミュニケーションを心がけましょう。</p>
                                </div>
                            </div>
                            {/* ... */}
                            <div className="flex gap-2 md:gap-3">
                                <span className="w-8 h-8 md:w-10 md:h-10 bg-[#5865F2] rounded-full flex items-center justify-center text-white font-bold text-base md:text-xl flex-shrink-0">2</span>
                                <div>
                                    <h3 className="font-bold text-sm md:text-lg text-white mb-0.5 md:mb-1">スパム・勧誘禁止</h3>
                                    <p className="text-xs md:text-sm text-[#B5BAC1]">許可のない宣伝行為や、無関係なサイトへの誘導は厳禁です。</p>
                                </div>
                            </div>
                            <div className="flex gap-2 md:gap-3">
                                <span className="w-8 h-8 md:w-10 md:h-10 bg-[#5865F2] rounded-full flex items-center justify-center text-white font-bold text-base md:text-xl flex-shrink-0">3</span>
                                <div>
                                    <h3 className="font-bold text-sm md:text-lg text-white mb-0.5 md:mb-1">売れた人を祝おう！</h3>
                                    <p className="text-xs md:text-sm text-[#B5BAC1]">仲間の成功を自分のことのように喜び、ポジティブな雰囲気を作りましょう。</p>
                                </div>
                            </div>

                            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-[#3F4147]">
                                <p className="mb-3 md:mb-4 font-bold text-white text-sm md:text-base">確認してお約束できる人は、【✅】を押してください。<br />次の【はじめに②】が解放されます✨</p>

                                <button
                                    onClick={handleConfirmRules}
                                    disabled={isRulesAgreed}
                                    className={`
                                        w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded text-white font-bold transition-all text-sm md:text-base
                                        ${isRulesAgreed
                                            ? "bg-[#23A559] cursor-default opacity-80"
                                            : "bg-[#5865F2] hover:bg-[#4752C4] shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                        }
                                    `}
                                >
                                    <div className={`w-5 h-5 md:w-6 md:h-6 border-2 border-white rounded flex items-center justify-center ${isRulesAgreed ? "bg-white text-[#23A559]" : ""}`}>
                                        {isRulesAgreed && <Check className="w-3 h-3 md:w-4 md:h-4" />}
                                    </div>
                                    {isRulesAgreed ? "確認済み" : "ルールを確認しました"}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Hero Section for Channel (Welcome) */}
                        <div className="mb-4 mt-4 space-y-2 border-b border-[#3F4147] pb-4">
                            <div className="w-[68px] h-[68px] rounded-full bg-[#41434A] flex items-center justify-center mb-2">
                                <Hash className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-[32px] font-bold text-white">#{channelName}へようこそ！</h1>
                            <p className="text-[#B5BAC1] text-base">ここが <span className="font-medium text-white">#{channelName}</span> の始まりです。</p>
                        </div>

                        {/* Intro Content */}
                        {introContent && (
                            <div className="mb-6 mx-4 p-6 bg-[#2B2D31] rounded-md border border-[#1F2023] shadow-sm">
                                <div className="prose prose-invert max-w-none prose-p:text-[#DBDEE1] prose-headings:text-white prose-a:text-[#00A8FC] prose-strong:text-white">
                                    <ReactMarkdown>{introContent}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, index) => {
                            const isSameUser = index > 0 && messages[index - 1].userId === msg.userId;
                            const messageUser = msg.userId === currentUser.id ? currentUser : MOCK_USERS.find(u => u.id === msg.userId);
                            const displayName = messageUser?.communityNickname || messageUser?.name || "Unknown User";

                            return (
                                <div key={msg.id} className={`group flex pr-4 pl-[72px] py-0.5 relative hover:bg-[#2E3035] ${!isSameUser ? "mt-[17px]" : ""}`}>
                                    {!isSameUser && (
                                        <div className="absolute left-4 top-0.5 w-[40px] h-[40px] rounded-full bg-indigo-500 overflow-hidden mt-0.5 select-none text-white flex items-center justify-center font-bold text-lg">
                                            {displayName.charAt(0)}
                                        </div>
                                    )}

                                    <div className="flex flex-col flex-1 min-w-0">
                                        {!isSameUser && (
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-medium text-base text-[#F2F3F5] hover:underline cursor-pointer">
                                                    {displayName}
                                                </span>
                                                <span className="text-[12px] text-[#949BA4] font-medium ml-1">
                                                    {new Date(msg.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`text-[#DBDEE1] leading-[1.375rem] whitespace-pre-wrap text-base font-normal`}>
                                            <ReactMarkdown
                                                components={{
                                                    img: (props: any) => <img {...props} className="max-w-sm rounded-lg my-2 border border-[#1F2023]" />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="absolute right-4 top-0 bg-[#313338] shadow-sm rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-[#2E3035] flex gap-1">
                                        <button
                                            onClick={() => handleReply(msg)}
                                            className="p-1 text-[#B5BAC1] hover:text-indigo-400 transition-colors"
                                            title="返信"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-reply"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
                                        </button>
                                        {currentUser.role === 'admin' && (
                                            <button
                                                onClick={() => handleDelete(msg.id)}
                                                className="p-1 text-[#B5BAC1] hover:text-[#F23F42] transition-colors"
                                                title="メッセージを削除"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} className="h-4" />
                    </>
                )}
            </div>

            {/* Input Area */}
            {!isRulesChannel && (
                <div className="px-4 pb-6 bg-[#313338] flex-shrink-0">
                    {/* Removed Old Plan Restriction for light plan in specific channel, now strict check if needed or just allow basic */}
                    {currentUser.plan === 'light' ? (
                        <div className="bg-[#383A40] rounded-lg px-4 py-4 text-center text-[#B5BAC1] text-sm">
                            🔒 ライトプランの方はメッセージの投稿ができません（閲覧のみ可能です）
                        </div>
                    ) : (
                        <div className="bg-[#383A40] rounded-lg px-4 py-2.5 flex flex-col gap-2 relative">
                            {/* Reply Context */}
                            {replyTo && (
                                <div className="flex items-center justify-between text-xs text-[#B5BAC1] bg-[#2B2D31] p-2 rounded mb-1">
                                    <span>Replying to User...</span>
                                    <button onClick={() => setReplyTo(null)} className="hover:text-white">✕</button>
                                </div>
                            )}

                            <div className="flex items-start gap-3 w-full">
                                {/* Image Upload Button */}
                                <button
                                    className="text-[#B5BAC1] hover:text-[#F2F3F5] p-1 h-fit mt-0.5 transition-colors flex-shrink-0"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="bg-[#B5BAC1] text-[#383A40] w-6 h-6 rounded-full flex items-center justify-center hover:text-white transition-colors">
                                        <Plus className="w-4 h-4 font-bold" />
                                    </div>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />

                                <textarea
                                    className="flex-1 bg-transparent border-none outline-none text-[#DBDEE1] placeholder-[#949BA4] resize-none min-h-[44px] text-base py-1 scrollbar-thin scrollbar-thumb-[#202225]"
                                    placeholder={`#${channelName} へメッセージを送信`}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    rows={1}
                                    style={{ overflow: 'hidden' }}
                                />

                                {/* Removed Gift/Smile, keeping Send button implicit or minimalistic */}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
