import toast from "react-hot-toast";

export function useToast() {
  return {
    toast: (options: {
      title?: string;
      description?: string;
      variant?: "default" | "destructive";
    }) => {
      if (options.variant === "destructive") {
        toast.error(options.description || options.title || "Error");
      } else {
        toast.success(options.description || options.title || "Success");
      }
    },
  };
}
