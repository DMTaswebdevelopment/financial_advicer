type ToastType = "success" | "error" | "warning" | "info";

interface ToasterComponentProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose?: (val: boolean) => void;
  type: ToastType;
}
