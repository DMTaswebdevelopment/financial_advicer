import { useUser } from "@/app/context/authContext";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import React from "react";
import { BotIcon } from "lucide-react";

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

const MessageBubble = ({
  content,
  isUser,
}: // isStreaming,
MessageBubbleProps) => {
  const { user } = useUser();

  return (
    <div
      className={`flex my-5  ${
        isUser ? "justify-end text-start" : "justify-start"
      } flex-wrap`}
    >
      <div
        className={`rounded-2xl px-4 py-2.5  max-w-[85%] md:max-w-[75%] shadow-sm ring-1 ring-inset relative flex-wrap  break-words ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none ring-blue-700"
            : "bg-white text-gray-900 rounded-bl-none ring-gray-200 text-start my-5"
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed py-2">
          <div dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />
        </div>

        {isUser ? (
          <Avatar className="absolute right-0">
            <AvatarImage
              src={
                user?.photoUrl ||
                "https://res.cloudinary.com/dmz8tsndt/image/upload/v1731398201/samples/smile.jpg"
              }
            />

            <AvatarFallback>
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <BotIcon className="h-10 w-10 absolute left-1 bg-blue-300 p-2 rounded-full" />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
