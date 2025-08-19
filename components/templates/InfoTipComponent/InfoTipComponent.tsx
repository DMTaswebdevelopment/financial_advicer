"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import React, { useEffect, useState } from "react";

type TooltipIconProps = {
  tooltip?: string;
  onHover?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
  className?: string;
  isClicked?: boolean;
  setClickedTooltip?: (id: string | null) => void;
  id?: string;
};

const InfoTipComponent: React.FC<TooltipIconProps> = ({
  tooltip,
  onHover,
  onLeave,
  onClick,
  className = "",
  isClicked = false,
  setClickedTooltip,
  id = null,
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      if (isClicked) {
        setClickedTooltip?.(null);
        setOpen(false);
        onLeave?.();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isClicked, onLeave, setClickedTooltip]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    e.preventDefault();
    onHover?.();
    if (!isClicked) setOpen(true);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isClicked) {
      setOpen(false);
      onLeave?.();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent doc click from firing immediately
    if (isClicked) {
      setClickedTooltip?.(null);
      setOpen(false);
      onLeave?.();
    } else {
      setClickedTooltip?.(id);
      setOpen(true);
      onClick?.();
    }
  };

  return (
    <Tooltip.Provider delayDuration={50}>
      <Tooltip.Root open={open}>
        <Tooltip.Trigger asChild>
          <button
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            className={`absolute top-2 right-2 cursor-pointer ${className}`}
          >
            <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={8}
            className="z-50 rounded bg-gray-900 text-white px-2 py-2 text-xs shadow-md max-w-60"
          >
            {tooltip}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default InfoTipComponent;
