"use client";

import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { BotIcon } from "lucide-react";
import { UserNameListType } from "@/component/model/types/UserNameListType";
import { getUserLocalStorage } from "@/functions/function";

interface MessageBubbleProps {
  content: string;
  isUser?: boolean;
  isDocLoading?: boolean;
}

const formatMessage = (content: string): string => {
  // First unescape backslashes
  content = content.replace(/\\\\/g, "\\");

  //Then handle newlines
  content = content.replace(/\\n/g, "\n");

  //Remove only the markers but keep the content between them
  content = content
    .replace(/----START----\n?/g, "")
    .replace(/\n?----END----/g, "");

  return content.trim();
};

const ChatMessageBubbleComponent = ({
  content,
  isUser,
}: MessageBubbleProps) => {
  const userData: UserNameListType | null = getUserLocalStorage();

  return (
    <>
      <div
        className={`flex my-5 w-full ${
          isUser ? "justify-end" : "justify-start"
        } flex-wrap`}
      >
        <div
          className={`relative rounded-2xl px-4 py-2.5 shadow-sm ring-1 ring-inset break-words ${
            isUser
              ? "bg-black text-white ring-gray-200"
              : "bg-white text-gray-900 rounded-bl-none ring-gray-200 my-5"
          }`}
        >
          <div className="whitespace-pre-wrap break-words text-xs leading-relaxed py-2">
            <div dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />
          </div>

          {isUser ? (
            <div className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 z-10">
              {userData?.photoUrl !== undefined ? (
                <Avatar>
                  <AvatarImage
                    src={userData?.photoUrl || "You"}
                    className="w-8 h-8"
                  />
                </Avatar>
              ) : (
                <div className="w-8 h-8 text-xs bg-blue-300 font-bold text-black rounded-full flex items-center justify-center p-2">
                  <span>You</span>
                </div>
              )}
            </div>
          ) : (
            <BotIcon className="h-8 w-8 absolute left-1 bottom-0 -translate-x-1/2 translate-y-1/2 bg-blue-300 p-2 rounded-full z-10" />
          )}
        </div>
      </div>
      {/* </div> */}
    </>
  );
};

export default ChatMessageBubbleComponent;
