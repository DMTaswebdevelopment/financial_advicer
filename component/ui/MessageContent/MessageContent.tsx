import React from "react";

interface TerminalContent {
  type: "terminal";
  tool: string;
  input: string | object;
  output: string | object;
}

interface Message {
  content: string;
}

interface MessageContentProps {
  message: Message;
}

const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  const renderTerminal = (terminal: TerminalContent) => {
    const { tool, input, output } = terminal;

    const processUrls = (content: string | object): React.ReactNode => {
      if (typeof content !== "string") {
        return <pre>{JSON.stringify(content, null, 2)}</pre>;
      }

      const urlRegex = /(https?:\/\/[^\s)\]]+)/g;
      const parts = content.split(urlRegex);

      return parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      );
    };

    const formattedInput =
      typeof input === "string" ? input : JSON.stringify(input, null, 2);
    const formattedOutput =
      typeof output === "string" ? output : JSON.stringify(output, null, 2);

    return (
      <div className="terminal-container bg-gray-100 p-4 rounded-lg mb-4">
        <div className="tool-name font-bold text-lg mb-2">{tool}</div>

        <div className="terminal-section mb-3">
          <div className="section-title font-semibold">Input:</div>
          <pre className="bg-gray-200 p-2 rounded whitespace-pre-wrap">
            {formattedInput}
          </pre>
        </div>

        <div className="terminal-section">
          <div className="section-title font-semibold">Output:</div>
          <div className="bg-white p-2 rounded whitespace-pre-wrap">
            {processUrls(formattedOutput)}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (typeof message.content !== "string") {
      return <div>Unsupported message format</div>;
    }

    try {
      const regex = /{"type":"terminal".*?}/g;
      const matches = message.content.match(regex);

      if (!matches || matches.length === 0) {
        return <div className="whitespace-pre-wrap">{message.content}</div>;
      }

      const parts = message.content.split(regex);

      return (
        <>
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              {part && <div className="whitespace-pre-wrap">{part}</div>}
              {matches[i] &&
                renderTerminal(JSON.parse(matches[i]) as TerminalContent)}
            </React.Fragment>
          ))}
        </>
      );
    } catch (error) {
      console.error("Error rendering message content:", error);
      return <div className="whitespace-pre-wrap">{message.content}</div>;
    }
  };

  return <div className="message-content">{renderContent()}</div>;
};

export default MessageContent;
