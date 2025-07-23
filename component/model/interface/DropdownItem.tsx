interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface DropdownMenuProps {
  buttonLabel?: string;
  items: DropdownItem[];
  className?: string;
}
