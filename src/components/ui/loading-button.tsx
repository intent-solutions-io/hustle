import * as React from "react"
import { Loader2, CheckCircle } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  isSuccess?: boolean
  loadingText?: string
  successText?: string
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      isLoading = false,
      isSuccess = false,
      loadingText = "Loading...",
      successText = "Success!",
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading || isSuccess}
        className={cn(className)}
        {...props}
      >
        {isLoading && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}
          </>
        )}
        {isSuccess && !isLoading && (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            {successText}
          </>
        )}
        {!isLoading && !isSuccess && children}
      </Button>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

export { LoadingButton }
